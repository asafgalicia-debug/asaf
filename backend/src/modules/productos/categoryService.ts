import { AppError } from '../../errors/AppError.js';
import { catalogFilter, catalogSlice, type CatalogQuery } from '../../core/catalogPagination.js';
import { getCategoryModel } from './models/Category.js';
export type CategoryRecord = { id: string; companyId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' };
export async function pageCategories(companyId: string, query: CatalogQuery) {
  const rows = await getCategoryModel().find(catalogFilter({ companyId }, query, ['name', 'code'])).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  return catalogSlice(rows, query.limit);
}
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

export async function updateCategoryStatus(id: string, companyId: string, expectedStatus: 'ACTIVE' | 'INACTIVE', status: 'ACTIVE' | 'INACTIVE'): Promise<CategoryRecord> {
  if (expectedStatus === status) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unchanged catalog status', friendlyMessage: 'Selecciona un estado diferente del actual.', statusCode: 400 });
  const row = await getCategoryModel().findOneAndUpdate(
    { _id: id, companyId, status: expectedStatus },
    { $set: { status } }, { new: true, runValidators: true }
  ).exec();
  if (!row) throw new AppError({ code: 'CONFLICT', message: 'Catalog state changed or unavailable', friendlyMessage: 'El estado cambió o el registro no está disponible. Actualiza el catálogo.', statusCode: 409 });
  return { id: String(row._id), companyId: row.companyId, name: row.name, code: row.code, status: row.status };
}

export async function updateCategoryCode(id: string, companyId: string, expectedCode: string, code: string): Promise<CategoryRecord> {
  const normalized = code.trim().toUpperCase();
  if (normalized === expectedCode) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unchanged code', friendlyMessage: 'Escribe un código diferente del actual.', statusCode: 400 });
  try {
    const row = await getCategoryModel().findOneAndUpdate(
      { _id: id, companyId, code: expectedCode }, { $set: { code: normalized } }, { new: true, runValidators: true }
    ).exec();
    if (!row) throw new AppError({ code: 'CONFLICT', message: 'Code changed or unavailable', friendlyMessage: 'El código cambió o el registro no está disponible. Actualiza el catálogo.', statusCode: 409 });
    return { id: String(row._id), companyId: row.companyId, name: row.name, code: row.code, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate code', friendlyMessage: 'Ya existe un registro con ese código. Usa otro código.', statusCode: 409 });
    throw error;
  }
}
