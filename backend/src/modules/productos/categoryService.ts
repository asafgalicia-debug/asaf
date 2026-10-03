import { AppError } from '../../errors/AppError.js';
import { getCategoryModel } from './models/Category.js';
export type CategoryRecord = { id: string; companyId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' };
export async function listCategories(companyId: string): Promise<CategoryRecord[]> {
  const rows = await getCategoryModel().find({ companyId }).sort({ name: 1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createCategory(input: { companyId: string; name: string; code: string }): Promise<CategoryRecord> {
  try {
    const row = await getCategoryModel().create({ ...input, name: input.name.trim(), code: input.code.trim().toUpperCase(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, name: row.name, code: row.code, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate category code', friendlyMessage: 'Ya existe una categoria con ese codigo en la empresa.', statusCode: 409 });
    throw error;
  }
}
export async function renameCategory(id: string, companyId: string, expectedName: string, name: string): Promise<CategoryRecord> {
  const row = await getCategoryModel().findOneAndUpdate(
    { _id: id, companyId, name: expectedName },
    { $set: { name: name.trim() } }, { new: true, runValidators: true }
  ).exec();
  if (!row) throw new AppError({ code: 'CONFLICT', message: 'Catalog record unavailable or name changed', friendlyMessage: 'El registro cambió o no está disponible. Actualiza el catálogo.', statusCode: 409 });
  return { id: String(row._id), companyId: row.companyId, name: row.name, code: row.code, status: row.status };
}
