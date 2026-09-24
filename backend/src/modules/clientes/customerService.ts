import { AppError } from '../../errors/AppError.js';
import { getCustomerModel } from './models/Customer.js';

export type CustomerRecord = {
  id: string; companyId: string; branchId: string; name: string; taxId: string; email: string; status: 'ACTIVE' | 'INACTIVE';
};
type PartnerInput = { companyId: string; branchId: string; name: string; taxId: string; email: string };

export async function listCustomers(companyId: string, branchId: string): Promise<CustomerRecord[]> {
  const rows = await getCustomerModel().find({ companyId, branchId }).sort({ name: 1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}

export async function createCustomer(input: PartnerInput): Promise<CustomerRecord> {
  try {
    const row = await getCustomerModel().create({ ...input, name: input.name.trim(), taxId: input.taxId.trim().toUpperCase(), email: input.email.trim().toLowerCase(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, taxId: row.taxId, email: row.email, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Duplicate customer tax id', friendlyMessage: 'Ya existe un cliente con ese identificador fiscal en la empresa.', statusCode: 409 });
    }
    throw error;
  }
}