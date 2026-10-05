import {getAuditEventModel} from '../auditoria/models/AuditEvent.js';
import mongoose,{Schema,type Model} from 'mongoose';
import {z} from 'zod';
import {Router} from 'express';
import {AppError} from '../../errors/AppError.js';
import {authenticate} from '../../middleware/authenticate.js';
import {tenant} from '../../middleware/tenant.js';
import {authorize} from '../../middleware/authorize.js';
import {getSaleModel} from './models/Sale.js';
import {getPurchaseOrderModel} from '../compras/models/PurchaseOrder.js';
import {getBankAccountModel,getCashMovementModel} from '../finanzas/models/FinanceModels.js';
import {getStockMovementModel} from '../inventario/models/StockMovement.js';
import {getStockLockModel} from '../inventario/models/StockLock.js';
import {recordCommercialStock} from '../inventario/stockService.js';
type Settlement={companyId:string;branchId:string;userId:string;kind:'sales'|'purchase-orders';sourceId:string;warehouseId:string;accountId:string;date:string;stockMovementId:string;cashMovementId:string;quantity:number;total:number;status:string;createdAt:Date};
const schema=new Schema<Settlement>({companyId:{type:String,required:true},branchId:{type:String,required:true},userId:{type:String,required:true},kind:{type:String,enum:['sales','purchase-orders'],required:true},sourceId:{type:String,required:true},warehouseId:{type:String,required:true},accountId:{type:String,required:true},date:{type:String,required:true},stockMovementId:{type:String,required:true},cashMovementId:{type:String,required:true},quantity:{type:Number,required:true},total:{type:Number,required:true},status:{type:String,required:true}},{timestamps:{createdAt:true,updatedAt:false}});
schema.index({companyId:1,branchId:1,kind:1,sourceId:1},{unique:true});
export function getSettlementModel():Model<Settlement>{return mongoose.models.CommercialSettlement??mongoose.model<Settlement>('CommercialSettlement',schema);}
const id=z.string().regex(/^[a-f0-9]{24}$/i).transform(v=>v.toLowerCase());
export const settlementInput=z.object({kind:z.enum(['sales','purchase-orders']),sourceId:id,warehouseId:id,accountId:id,date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;})}).strict();
const conflict=()=>new AppError({code:'CONFLICT',message:'Commercial operation unavailable or changed',friendlyMessage:'La operación cambió, ya fue registrada o no está disponible. Actualiza el listado.',statusCode:409});
function serialize(row:any){const {_id,__v,...rest}=row;return {id:String(_id),...rest};}
export async function settleCommercial(scope:{companyId:string;branchId:string;userId:string},raw:unknown){
 const parsed=settlementInput.safeParse(raw);if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid settlement',friendlyMessage:'Revisa operación, almacén, cuenta y fecha.',statusCode:400});
 const input=parsed.data,key={companyId:scope.companyId,branchId:scope.branchId,kind:input.kind,sourceId:input.sourceId};
 await Promise.all([getAuditEventModel().init(),getSettlementModel().init(),getStockMovementModel().init(),getStockLockModel().init(),getCashMovementModel().init(),getSaleModel().init(),getPurchaseOrderModel().init()]);
 const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const existing=await getSettlementModel().findOne(key).session(session).lean().exec();
  if(existing){if(existing.warehouseId!==input.warehouseId||existing.accountId!==input.accountId||existing.date!==input.date)throw conflict();return serialize(existing);}
  const filter={_id:input.sourceId,companyId:scope.companyId,branchId:scope.branchId,status:input.kind==='sales'?'PENDIENTE':'APROBADA'};
  const status=input.kind==='sales'?'PAGADA':'RECIBIDA';
  const row=input.kind==='sales'?await getSaleModel().findOneAndUpdate(filter,{$set:{status}},{new:true,session}).lean().exec():await getPurchaseOrderModel().findOneAndUpdate(filter,{$set:{status}},{new:true,session}).lean().exec();
  if(!row)throw conflict();
  if(!Number.isFinite(row.total)||row.total<=0||!Number.isSafeInteger(Math.round(row.total*100))||row.total!==Number(row.total.toFixed(2)))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid commercial total',friendlyMessage:'Esta operación requiere un importe positivo válido.',statusCode:400});
  const account=await getBankAccountModel().exists({_id:input.accountId,companyId:scope.companyId,branchId:scope.branchId,status:'ACTIVE'}).session(session);
  if(!account)throw new AppError({code:'VALIDATION_ERROR',message:'Account unavailable',friendlyMessage:'Selecciona una cuenta activa de esta sucursal.',statusCode:400});
  const reference=(input.kind==='sales'?'SALE:':'PURCHASE:')+input.sourceId;
  const stock=await recordCommercialStock({...scope,warehouseId:input.warehouseId,productId:row.productId,quantity:row.quantity,reference},input.kind==='sales'?'ISSUE':'RECEIPT',session);
  const [cash]=await getCashMovementModel().create([{companyId:scope.companyId,branchId:scope.branchId,accountId:input.accountId,concept:reference,type:input.kind==='sales'?'INFLOW':'OUTFLOW',amount:row.total,date:input.date}],{session});
  const [receipt]=await getSettlementModel().create([{...scope,...input,stockMovementId:stock.id,cashMovementId:String(cash._id),quantity:row.quantity,total:row.total,status}],{session});
  await getAuditEventModel().create([{...scope,action:'UPDATE',module:input.kind==='sales'?'ventas':'compras',entityId:input.sourceId,previousState:{status:input.kind==='sales'?'PENDIENTE':'APROBADA'},newState:{status},details:{settlementId:String(receipt._id),stockMovementId:stock.id,cashMovementId:String(cash._id),warehouseId:input.warehouseId,accountId:input.accountId,date:input.date,quantity:row.quantity,total:row.total}}],{session});
  return serialize(receipt.toObject());
 });}catch(e){if(typeof e==='object'&&e!==null&&'code'in e&&e.code===11000)throw conflict();throw e;}finally{await session.endSession();}
}
export async function findCommercialSettlement(scope:{companyId:string;branchId:string},raw:unknown){
 const parsed=settlementInput.pick({kind:true,sourceId:true}).strict().safeParse(raw);
 if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid receipt query',friendlyMessage:'Revisa el tipo y el identificador del documento.',statusCode:400});
 const row=await getSettlementModel().findOne({...parsed.data,companyId:scope.companyId,branchId:scope.branchId}).lean().exec();
 if(!row)throw new AppError({code:'NOT_FOUND',message:'Receipt not found',friendlyMessage:'No hay comprobante conjunto para este documento en tu sucursal.',statusCode:404});
 return serialize(row);
}
export function createSettlementRoutes(){const router=Router();
router.get('/',authenticate,tenant,authorize('usuarios.ver'),async(req,res,next)=>{try{const t=req.tenant;if(!t?.companyId||!t.branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing scope',friendlyMessage:'La sesión requiere empresa y sucursal.',statusCode:401});res.json({ok:true,data:await findCommercialSettlement({companyId:t.companyId,branchId:t.branchId},req.query)});}catch(e){next(e);}});
router.post('/',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{const t=req.tenant;if(!t?.companyId||!t.branchId||!t.userId)throw new AppError({code:'UNAUTHORIZED',message:'Missing scope',friendlyMessage:'La sesión requiere empresa y sucursal.',statusCode:401});res.json({ok:true,data:await settleCommercial({companyId:t.companyId,branchId:t.branchId,userId:t.userId},req.body)});}catch(e){next(e);}});return router;}
