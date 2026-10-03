import { AppError } from '../../errors/AppError.js';
import { getWarehouseModel } from './models/Warehouse.js';
export type WarehouseRecord = { id: string; companyId: string; branchId: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' };
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
