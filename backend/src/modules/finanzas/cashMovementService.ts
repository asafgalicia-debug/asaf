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