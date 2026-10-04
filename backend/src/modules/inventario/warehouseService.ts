import { AppError } from '../../errors/AppError.js';
import { catalogFilter, catalogSlice, type CatalogQuery } from '../../core/catalogPagination.js';
import { getWarehouseModel } from './models/Warehouse.js';
export type WarehouseRecord = { id: string; companyId: string; branchId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' };
export async function pageWarehouses(companyId: string, branchId: string, query: CatalogQuery) {
  const rows = await getWarehouseModel().find(catalogFilter({ companyId, branchId }, query, ['name', 'code'])).sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  return catalogSlice(rows, query.limit);
}
export async function listWarehouses(companyId: string, branchId: string): Promise<WarehouseRecord[]> {
  const rows = await getWarehouseModel().find({ companyId, branchId }).sort({ name: 1 }).lean().exec();
  return rows.map(({ _id, ...row }) => ({ id: String(_id), ...row }));
}
export async function createWarehouse(input: { companyId: string; branchId: string; name: string; code: string }): Promise<WarehouseRecord> {
  try {
    const row = await getWarehouseModel().create({ ...input, name: input.name.trim(), code: input.code.trim().toUpperCase(), status: 'ACTIVE' });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, code: row.code, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate warehouse code', friendlyMessage: 'Ya existe un almacen con ese codigo en la sucursal.', statusCode: 409 });
    throw error;
  }
}
export async function renameWarehouse(id: string, companyId: string, branchId: string, expectedName: string, name: string): Promise<WarehouseRecord> {
  const row = await getWarehouseModel().findOneAndUpdate(
    { _id: id, companyId, branchId, name: expectedName },
    { $set: { name: name.trim() } }, { new: true, runValidators: true }
  ).exec();
  if (!row) throw new AppError({ code: 'CONFLICT', message: 'Catalog record unavailable or name changed', friendlyMessage: 'El registro cambió o no está disponible. Actualiza el catálogo.', statusCode: 409 });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, code: row.code, status: row.status };
}

export async function updateWarehouseStatus(id: string, companyId: string, branchId: string, expectedStatus: 'ACTIVE' | 'INACTIVE', status: 'ACTIVE' | 'INACTIVE'): Promise<WarehouseRecord> {
  if (expectedStatus === status) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unchanged catalog status', friendlyMessage: 'Selecciona un estado diferente del actual.', statusCode: 400 });
  const row = await getWarehouseModel().findOneAndUpdate(
    { _id: id, companyId, branchId, status: expectedStatus },
    { $set: { status } }, { new: true, runValidators: true }
  ).exec();
  if (!row) throw new AppError({ code: 'CONFLICT', message: 'Catalog state changed or unavailable', friendlyMessage: 'El estado cambió o el registro no está disponible. Actualiza el catálogo.', statusCode: 409 });
  return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, code: row.code, status: row.status };
}

export async function updateWarehouseCode(id: string, companyId: string, branchId: string, expectedCode: string, code: string): Promise<WarehouseRecord> {
  const normalized = code.trim().toUpperCase();
  if (normalized === expectedCode) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unchanged code', friendlyMessage: 'Escribe un código diferente del actual.', statusCode: 400 });
  try {
    const row = await getWarehouseModel().findOneAndUpdate(
      { _id: id, companyId, branchId, code: expectedCode }, { $set: { code: normalized } }, { new: true, runValidators: true }
    ).exec();
    if (!row) throw new AppError({ code: 'CONFLICT', message: 'Code changed or unavailable', friendlyMessage: 'El código cambió o el registro no está disponible. Actualiza el catálogo.', statusCode: 409 });
    return { id: String(row._id), companyId: row.companyId, branchId: row.branchId, name: row.name, code: row.code, status: row.status };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) throw new AppError({ code: 'CONFLICT', message: 'Duplicate code', friendlyMessage: 'Ya existe un registro con ese código. Usa otro código.', statusCode: 409 });
    throw error;
  }
}
