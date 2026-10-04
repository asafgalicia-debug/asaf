import { catalogFilter, catalogSlice, type CatalogQuery } from '../../core/catalogPagination.js';
import { AppError } from '../../errors/AppError.js';
import { getSupplierModel } from './models/Supplier.js';

export type SupplierRecord = {
  id: string; companyId: string; branchId: string; name: string; taxId: string; email: string; status: 'ACTIVE' | 'INACTIVE';
};
type PartnerInput = { companyId: string; branchId: string; name: string; taxId: string; email: string };

export async function listSuppliers(companyId: string, branchId: string): Promise<SupplierRecord[]> {
  const rows = await getSupplierModel().find({ companyId, branchId }).sort({ name: 1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}

export async function createSupplier(input: PartnerInput): Promise<SupplierRecord> {
  try {
    const row = await getSupplierModel().create({ ...input, name: input.name.trim(), taxId: input.taxId.trim().toUpperCase(), email: input.email.trim().toLowerCase(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, taxId: row.taxId, email: row.email, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'Duplicate supplier tax id', friendlyMessage: 'Ya existe un proveedor con ese identificador fiscal en la empresa.', statusCode: 409 });
    }
    throw error;
  }
}
export async function updateSupplier(id: string, input: PartnerInput & { expected?: {name:string;taxId:string;email:string} }): Promise<SupplierRecord> {
  try {
    const row = await getSupplierModel().findOneAndUpdate(
      { _id: id, companyId: input.companyId, branchId: input.branchId, ...(input.expected ? {name: input.expected.name, taxId: input.expected.taxId, email: input.expected.email} : {}) },
      { $set: { name: input.name.trim(), taxId: input.taxId.trim().toUpperCase(), email: input.email.trim().toLowerCase() } },
      { new: true, runValidators: true }
    ).exec();
    if (!row && input.expected) throw new AppError({code:'CONFLICT',message:'Stale contact snapshot',friendlyMessage:'El contacto cambió o no está disponible. Actualiza el catálogo.',statusCode:409});
    if (!row) throw new AppError({ code: 'NOT_FOUND', message: 'Contact not found in tenant', friendlyMessage: 'El contacto no está disponible en esta sucursal.', statusCode: 404 });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, taxId: row.taxId, email: row.email, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate contact tax id', friendlyMessage: 'Ya existe un contacto con ese identificador fiscal en la empresa.', statusCode: 409 });
    throw error;
  }
}

export async function pageSuppliers(companyId: string, branchId: string, query: CatalogQuery) {
 const rows = await getSupplierModel().find(catalogFilter({ companyId, branchId }, query, ['name', 'taxId', 'email'])).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
 return catalogSlice(rows, query.limit);
}
