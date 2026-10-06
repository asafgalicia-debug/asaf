import mongoose from 'mongoose';
import { getWarehouseModel } from '../inventario/models/Warehouse.js';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { catalogSlice, catalogFilter } from '../../core/catalogPagination.js';
import { getProductionOrderModel } from './models/ProductionOrder.js';
import { getProductModel } from '../productos/models/Product.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { getStockMovementModel } from '../inventario/models/StockMovement.js';
import { getStockLockModel } from '../inventario/models/StockLock.js';
import { recordCommercialStock } from '../inventario/stockService.js';

const id = z.string().regex(/^[a-f0-9]{24}$/i);
const quantity = z.number().finite().min(0.000001).max(1000000000).refine(n => Math.abs(n * 1e6 - Math.round(n * 1e6)) < 0.001);
export const productionCreateSchema = z.object({ productId: id, plannedQuantity: quantity, materials: z.array(z.object({ productId: id, warehouseId: id, quantity }).strict()).max(20).default([]) }).strict().superRefine((v,ctx)=>{ const pairs=new Set<string>(); for(const m of v.materials){const key=m.productId+':'+m.warehouseId;if(m.productId===v.productId||pairs.has(key))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Invalid or duplicate material'});pairs.add(key);} });
export const productionStateSchema = z.object({ expectedStatus: z.enum(['planned', 'running']), status: z.enum(['running', 'cancelled']) }).strict();
export const productionCompleteSchema = z.object({ warehouseId: id, expectedQuantity: quantity, deliveredQuantity: quantity.optional(), expectedCompletedQuantity: z.number().finite().min(0).max(1e9).optional(), expectedUpdatedAt: z.string().datetime().optional(), cost: z.number().finite().min(0).max(1e9).refine(n=>Math.abs(n*100-Math.round(n*100))<0.001).optional(), currency: z.string().regex(/^[A-Z]{3}$/).optional() }).strict().superRefine((v,ctx)=>{if((v.cost===undefined)!==(v.currency===undefined))ctx.addIssue({code:z.ZodIssueCode.custom,message:'Cost and currency required together'});});
const pageSchema = z.object({ status: z.enum(['planned', 'running', 'completed', 'cancelled']).optional(), cursor: id.optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export function parseProductionPage(raw: unknown) { const p = pageSchema.safeParse(raw); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid production page', friendlyMessage: 'Revisa la página de producción.', statusCode: 400 }); return p.data; }
const productPageSchema = pageSchema.omit({ status: true }).extend({ search: z.string().trim().max(100).default('') }).strict();
export function parseProductionProductPage(raw: unknown) { const p = productPageSchema.safeParse(raw); if (!p.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid product selector', friendlyMessage: 'Revisa la búsqueda de productos.', statusCode: 400 }); return p.data; }
type Scope = { companyId: string; branchId: string; userId: string; ipAddress?: string };
export async function pageProductionProducts(scope: Scope, query: z.infer<typeof productPageSchema>) {
  const filter = catalogFilter({ companyId: scope.companyId }, { ...query, status: 'ACTIVE' }, ['name', 'sku']);
  return catalogSlice(await getProductModel().find(filter).select('name sku companyId status').sort({ _id: -1 }).limit(query.limit + 1).lean().exec(), query.limit);
}
export async function pageProductionOrders(scope: Scope, query: z.infer<typeof pageSchema>) {
  const filter: Record<string, unknown> = { companyId: scope.companyId, branchId: scope.branchId };
  if (query.status) filter.status = query.status;
  if (query.cursor) filter._id = { $lt: query.cursor };
  const rows = await getProductionOrderModel().find(filter).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  const ids = rows.flatMap(row => [row.productId,...(row.materials??[]).map(m=>m.productId)]).filter(value => /^[a-f0-9]{24}$/i.test(value));
  const warehouseIds = rows.flatMap(row => [row.completionWarehouseId,...(row.materials??[]).map(m=>m.warehouseId),...(row.deliveries??[]).map(d=>d.warehouseId)]).filter((value): value is string => !!value && /^[a-f0-9]{24}$/i.test(value));
  const [products, warehouses] = await Promise.all([getProductModel().find({ companyId: scope.companyId, _id: { $in: ids } }).select('name sku').lean().exec(), getWarehouseModel().find({ companyId: scope.companyId, branchId: scope.branchId, _id: { $in: warehouseIds } }).select('name').lean().exec()]);
  const names = new Map(products.map(row => [String(row._id), row]));
  const warehouseNames = new Map(warehouses.map(row => [String(row._id), row.name]));
  return catalogSlice(rows.map(row => ({ ...row, deliveries:row.deliveries?.length?row.deliveries.map(d=>({...d,warehouseName:warehouseNames.get(d.warehouseId)})):row.completedQuantity===0?[]:undefined, materials: (row.materials??[]).map(m=>({...m,productName:names.get(m.productId)?.name,warehouseName:warehouseNames.get(m.warehouseId)})), productName: names.get(row.productId)?.name, productSku: names.get(row.productId)?.sku, completionWarehouseName: warehouseNames.get(row.completionWarehouseId ?? '') })), query.limit);
}
export async function administerProduction(scope: Scope, operation: 'create' | 'state' | 'complete', payload: unknown, orderId?: string) {
  const parsed = operation === 'create' ? productionCreateSchema.safeParse(payload) : operation === 'state' ? productionStateSchema.safeParse(payload) : productionCompleteSchema.safeParse(payload);
  const invalid = () => new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid production operation', friendlyMessage: 'Revisa producto, cantidad, estado y almacén de producción.', statusCode: 400 });
  if (!scope.userId || !parsed.success || (operation !== 'create' && !id.safeParse(orderId).success)) throw invalid();
  await Promise.all([getProductionOrderModel().init(), getAuditEventModel().init(), getStockMovementModel().init(), getStockLockModel().init()]);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      let row;
      if (operation === 'create') {
        const input = parsed.data as z.infer<typeof productionCreateSchema>;
        if (!await getProductModel().exists({ _id: input.productId, companyId: scope.companyId, status: 'ACTIVE' }).session(session)) throw invalid();
        for (const material of input.materials) {
          if (!await getProductModel().exists({ _id: material.productId, companyId: scope.companyId, status: 'ACTIVE' }).session(session) || !await getWarehouseModel().exists({ _id: material.warehouseId, companyId: scope.companyId, branchId: scope.branchId, status: 'ACTIVE' }).session(session)) throw invalid();
        }
        const [created] = await getProductionOrderModel().create([{ ...input, companyId: scope.companyId, branchId: scope.branchId, status: 'planned', completedQuantity: 0 }], { session });
        row = created.toObject();
      } else if (operation === 'state') {
        const input = parsed.data as z.infer<typeof productionStateSchema>;
        if (input.status === input.expectedStatus || (input.status === 'running' && input.expectedStatus !== 'planned')) throw invalid();
        row = await getProductionOrderModel().findOneAndUpdate({ _id: orderId, companyId: scope.companyId, branchId: scope.branchId, status: input.expectedStatus, completedQuantity: 0 }, { $set: { status: input.status } }, { new: true, session }).lean().exec();
      } else {
        const input = parsed.data as z.infer<typeof productionCompleteSchema>;
        const previous = await getProductionOrderModel().findOne({ _id: orderId, companyId: scope.companyId, branchId: scope.branchId, status: 'running', plannedQuantity: input.expectedQuantity }).session(session).lean().exec();
        if (previous) {
          const partial = input.deliveredQuantity !== undefined;
          if (partial && (input.expectedCompletedQuantity !== previous.completedQuantity || !input.expectedUpdatedAt || new Date(input.expectedUpdatedAt).getTime() !== previous.updatedAt.getTime())) throw new AppError({ code:'CONFLICT',message:'Production progress changed',friendlyMessage:'La producción cambió. Actualiza antes de registrar otra entrega.',statusCode:409 });
          if (!partial && previous.completedQuantity !== 0) throw new AppError({ code:'CONFLICT',message:'Partial production requires a progress snapshot',friendlyMessage:'Actualiza para revisar las entregas parciales de esta orden.',statusCode:409 });
          if (input.currency && previous.costCurrency && input.currency!==previous.costCurrency) throw invalid();
          const totalCost=Number(BigInt(Math.round((previous.productionCost??0)*100))+BigInt(Math.round((input.cost??0)*100)))/100;
          if(totalCost>1e12)throw invalid();
          const delivered = input.deliveredQuantity ?? previous.plannedQuantity;
          const micros = (n:number)=>BigInt(Math.round(n*1e6));
          const completed = micros(previous.completedQuantity)+micros(delivered), planned=micros(previous.plannedQuantity);
          if(completed>planned || ((previous.deliveries?.length??0)>=49 && completed!==planned) || (previous.deliveries?.length??0)>=50) throw invalid();
          const nextQuantity=Number(completed)/1e6, batch=previous.deliveries?.length??0;
          row = await getProductionOrderModel().findOneAndUpdate({ _id:orderId, companyId:scope.companyId,branchId:scope.branchId,status:'running',updatedAt:previous.updatedAt,completedQuantity:previous.completedQuantity },{$set:{ status:completed===planned?'completed':'running',completedQuantity:nextQuantity,completionWarehouseId:input.warehouseId,...(input.currency?{costCurrency:input.currency,productionCost:totalCost}:{}),updatedAt:new Date(Math.max(Date.now(),previous.updatedAt.getTime()+1)) }},{new:true,session,timestamps:false}).lean().exec();
          if (row) {
            const materials = [...(row.materials??[])].sort((a,b)=>(a.warehouseId+':'+a.productId).localeCompare(b.warehouseId+':'+b.productId));
            const consumed=[];
            const reference='PRODUCTION-'+orderId+(batch?'-B'+batch:'');
            for(const [index,material] of materials.entries()){
              // Round cumulative consumption once at six decimals so the final batch consumes the exact recipe.
              const cumulative=(micros(material.quantity)*completed+planned/2n)/planned;
              const delta=Number(cumulative-micros(material.consumedQuantity??0))/1e6;
              if(delta>0){const issued=await recordCommercialStock({companyId:scope.companyId,branchId:scope.branchId,productId:material.productId,warehouseId:material.warehouseId,quantity:delta,reference:reference+'-M'+index,userId:scope.userId},'ISSUE',session);material.movementId=issued.id;consumed.push({productId:material.productId,warehouseId:material.warehouseId,quantity:delta,movementId:issued.id});}
              material.consumedQuantity=Number(cumulative)/1e6;
            }
            const movement=await recordCommercialStock({companyId:scope.companyId,branchId:scope.branchId,productId:row.productId,warehouseId:input.warehouseId,quantity:delivered,reference,userId:scope.userId},'RECEIPT',session);
            row=await getProductionOrderModel().findByIdAndUpdate(orderId,{$set:{completionMovementId:movement.id,materials},$push:{deliveries:{...(input.cost===undefined?{}:{cost:input.cost}),quantity:delivered,warehouseId:input.warehouseId,movementId:movement.id,materials:consumed}}},{new:true,session,timestamps:false}).lean().exec();
          }
        }
      }
      if (!row) throw new AppError({ code: 'CONFLICT', message: 'Production order changed', friendlyMessage: 'La orden cambió o ya fue completada. Actualiza y revisa su movimiento antes de reintentar.', statusCode: 409 });
      await getAuditEventModel().create([{ userId: scope.userId, companyId: scope.companyId, branchId: scope.branchId, action: operation === 'create' ? 'CREATE' : 'UPDATE', module: 'produccion', entityId: String(row._id), details: { status: row.status, productId: row.productId, plannedQuantity: row.plannedQuantity, completedQuantity: row.completedQuantity, movementId: row.completionMovementId, materials: row.materials, costCurrency: row.costCurrency, productionCost: row.productionCost }, ipAddress: scope.ipAddress }], { session });
      const { _id, ...rest } = row;
      result = { id: String(_id), ...rest };
    });
    return result!;
  } finally { await session.endSession(); }
}
