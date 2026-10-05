import mongoose from 'mongoose';
import { getAuditEventModel } from '../modules/auditoria/models/AuditEvent.js';
import { getSaleModel } from '../modules/ventas/models/Sale.js';
import { getPurchaseOrderModel } from '../modules/compras/models/PurchaseOrder.js';
import { createSale, updateSaleStatus } from '../modules/ventas/saleService.js';
import { createPurchaseOrder, updatePurchaseOrderStatus } from '../modules/compras/purchaseOrderService.js';
import { AppError } from '../errors/AppError.js';
type Context = { userId: string; ipAddress?: string };
async function audited<T extends {id:string;companyId:string;branchId:string;total:number}>(module:string, context:Context, model:{init():Promise<unknown>}, create:(session:mongoose.ClientSession)=>Promise<T>):Promise<T> {
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing audit user',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 const audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const row=await create(session);
  await audit.create([{userId:context.userId,companyId:row.companyId,branchId:row.branchId,action:'CREATE',module,entityId:row.id,newState:row,details:{total:row.total},ipAddress:context.ipAddress}],{session});
  return row;
 });}finally{await session.endSession();}
}
export function createAuditedSale(input:Parameters<typeof createSale>[0],context:Context){return audited('ventas',context,getSaleModel(),session=>createSale(input,session));}
export function createAuditedPurchaseOrder(input:Parameters<typeof createPurchaseOrder>[0],context:Context){return audited('compras',context,getPurchaseOrderModel(),session=>createPurchaseOrder(input,session));}

async function auditedStatus<T extends {id:string;companyId:string;branchId:string;status:string}>(module:string,expectedStatus:string,context:Context,model:{init():Promise<unknown>},update:(session:mongoose.ClientSession)=>Promise<T>):Promise<T> {
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing audit user',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 const audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  const row=await update(session);
  await audit.create([{userId:context.userId,companyId:row.companyId,branchId:row.branchId,action:'UPDATE',module,entityId:row.id,previousState:{status:expectedStatus},newState:{status:row.status},details:{previousStatus:expectedStatus,status:row.status,manual:true},ipAddress:context.ipAddress}],{session});return row;
 });}finally{await session.endSession();}
}
export function updateAuditedSaleStatus(id:string,companyId:string,branchId:string,expectedStatus:Parameters<typeof updateSaleStatus>[3],status:Parameters<typeof updateSaleStatus>[4],context:Context){return auditedStatus('ventas',expectedStatus,context,getSaleModel(),session=>updateSaleStatus(id,companyId,branchId,expectedStatus,status,session));}
export function updateAuditedPurchaseOrderStatus(id:string,companyId:string,branchId:string,expectedStatus:Parameters<typeof updatePurchaseOrderStatus>[3],status:Parameters<typeof updatePurchaseOrderStatus>[4],context:Context){return auditedStatus('compras',expectedStatus,context,getPurchaseOrderModel(),session=>updatePurchaseOrderStatus(id,companyId,branchId,expectedStatus,status,session));}
