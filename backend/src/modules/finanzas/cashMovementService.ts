import mongoose from 'mongoose';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import type { CashQuery } from './cashPagination.js';
import { catalogFilter, catalogSlice, type CatalogQuery } from '../../core/catalogPagination.js';
import { AppError } from '../../errors/AppError.js';
import { getBankAccountModel, getCashMovementModel } from './models/FinanceModels.js';
export type CashMovementType = 'INFLOW' | 'OUTFLOW';
export type CashMovementRecord = { id: string; companyId: string; branchId: string; accountId: string; concept: string; type: CashMovementType; amount: number; date: string };
export async function listCashMovements(companyId: string, branchId: string): Promise<CashMovementRecord[]> { const rows = await getCashMovementModel().find({ companyId, branchId }).sort({ date: -1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row, type: row.type as CashMovementType, date: row.date ?? '' })); }
export async function createCashMovement(input: { companyId: string; branchId: string; accountId: string; concept: string; type: CashMovementType; amount: number; date: string }): Promise<CashMovementRecord> {
  const account = await getBankAccountModel().exists({ _id: input.accountId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' });
  if (!account) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Cash account not found', friendlyMessage: 'La cuenta debe estar activa y pertenecer a tu empresa y sucursal.', statusCode: 400 });
  const row = await getCashMovementModel().create({ ...input, concept: input.concept.trim(), amount: Math.round(input.amount * 100) / 100 });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, accountId: row.accountId, concept: row.concept, type: row.type as CashMovementType, amount: row.amount, date: row.date ?? input.date };
}
export async function pageCashMovements(companyId:string,branchId:string,query:CashQuery) {
 const filter=catalogFilter({companyId,branchId},query,['concept','date']);
 if(query.type)filter.type=query.type; if(query.accountId)filter.accountId=query.accountId;
 const rows=await getCashMovementModel().find(filter).sort({_id:-1}).limit(query.limit+1).lean().exec();return catalogSlice(rows,query.limit);
}

export async function createAuditedCashMovement(input: Parameters<typeof createCashMovement>[0], context: { userId: string; ipAddress?: string }): Promise<CashMovementRecord> {
  if (!context.userId.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing audit user', friendlyMessage: 'La sesión no tiene un usuario activo.', statusCode: 401 });
  const accounts = getBankAccountModel(), movements = getCashMovementModel(), audit = getAuditEventModel();
  await Promise.all([accounts.init(), movements.init(), audit.init()]);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const account = await accounts.exists({ _id: input.accountId, companyId: input.companyId, branchId: input.branchId, status: 'ACTIVE' }).session(session);
      if (!account) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Cash account not found', friendlyMessage: 'La cuenta debe estar activa y pertenecer a tu empresa y sucursal.', statusCode: 400 });
      const [row] = await movements.create([{ ...input, concept: input.concept.trim(), amount: Math.round(input.amount * 100) / 100 }], { session });
      const result = { id: String(row._id), companyId: row.companyId, branchId: row.branchId, accountId: row.accountId, concept: row.concept, type: row.type as CashMovementType, amount: row.amount, date: row.date ?? input.date };
      await audit.create([{ userId: context.userId, companyId: input.companyId, branchId: input.branchId, action: 'CREATE', module: 'finanzas.movimientos', entityId: result.id, newState: result, ipAddress: context.ipAddress }], { session });
      return result;
    });
  } finally { await session.endSession(); }
}
