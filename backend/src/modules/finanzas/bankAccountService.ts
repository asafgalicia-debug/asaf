import mongoose from 'mongoose';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { catalogFilter, catalogSlice, type CatalogQuery } from '../../core/catalogPagination.js';
import { AppError } from '../../errors/AppError.js';
import { getBankAccountModel } from './models/FinanceModels.js';
export type BankAccountRecord = { id: string; companyId: string; branchId: string; name: string; bankName: string; iban: string; status: 'ACTIVE' | 'INACTIVE' };
export async function listBankAccounts(companyId: string, branchId: string): Promise<BankAccountRecord[]> { const rows = await getBankAccountModel().find({ companyId, branchId }).sort({ name: 1 }).lean().exec(); return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row })); }
export async function createBankAccount(input: { companyId: string; branchId: string; name: string; bankName: string; iban: string }): Promise<BankAccountRecord> {
  try { const row = await getBankAccountModel().create({ ...input, name: input.name.trim(), bankName: input.bankName.trim(), iban: input.iban.replace(/\s+/g, '').toUpperCase(), status: 'ACTIVE' }); return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, bankName: row.bankName, iban: row.iban, status: row.status }; }
  catch (error) { if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate bank account', friendlyMessage: 'Esta cuenta bancaria ya esta registrada en la sucursal.', statusCode: 409 }); throw error; }
}
export async function pageBankAccounts(companyId:string,branchId:string,query:CatalogQuery) {
 const filter=catalogFilter({companyId,branchId},query,['name','bankName','iban']);
 
 const rows=await getBankAccountModel().find(filter).sort({_id:-1}).limit(query.limit+1).lean().exec();return catalogSlice(rows,query.limit);
}

export async function createAuditedBankAccount(input: Parameters<typeof createBankAccount>[0], context: { userId: string; ipAddress?: string }): Promise<BankAccountRecord> {
  if (!context.userId.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing audit user', friendlyMessage: 'La sesión no tiene un usuario activo.', statusCode: 401 });
  const accounts = getBankAccountModel(), audit = getAuditEventModel();
  await Promise.all([accounts.init(), audit.init()]);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const [row] = await accounts.create([{ ...input, name: input.name.trim(), bankName: input.bankName.trim(), iban: input.iban.replace(/\s+/g, '').toUpperCase(), status: 'ACTIVE' }], { session });
      const result: BankAccountRecord = { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, bankName: row.bankName, iban: row.iban, status: row.status };
      await audit.create([{ userId: context.userId, companyId: input.companyId, branchId: input.branchId, action: 'CREATE', module: 'finanzas.cuentas', entityId: result.id, newState: result, ipAddress: context.ipAddress }], { session });
      return result;
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate bank account', friendlyMessage: 'Esta cuenta bancaria ya está registrada en la sucursal.', statusCode: 409 });
    throw error;
  } finally { await session.endSession(); }
}
