import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/modules/productos/models/Category.js', () => ({ getCategoryModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { updateCategoryStatus } from '../src/modules/productos/categoryService.js';
import { updateWarehouseStatus } from '../src/modules/inventario/warehouseService.js';
const cases = [
 { name: 'category', run: () => updateCategoryStatus('id', 'co', 'ACTIVE', 'INACTIVE'), filter: { _id: 'id', companyId: 'co', status: 'ACTIVE' } },
 { name: 'warehouse', run: () => updateWarehouseStatus('id', 'co', 'br', 'ACTIVE', 'INACTIVE'), filter: { _id: 'id', companyId: 'co', branchId: 'br', status: 'ACTIVE' } }
];
describe.each(cases)('$name status', item => {
 beforeEach(() => { state.update.mockReset(); });
 it('reactivates without changing catalog references', async () => {
  state.update.mockResolvedValue({ _id: 'id', companyId: 'co', branchId: 'br', name: 'Original', code: 'CODE', status: 'ACTIVE' });
  const row = item.name === 'category' ? await updateCategoryStatus('id', 'co', 'INACTIVE', 'ACTIVE') : await updateWarehouseStatus('id', 'co', 'br', 'INACTIVE', 'ACTIVE');
  expect(state.update).toHaveBeenCalledWith({ ...item.filter, status: 'INACTIVE' }, { $set: { status: 'ACTIVE' } }, { new: true, runValidators: true });
  expect(row).toMatchObject({ id: 'id', name: 'Original', code: 'CODE', status: 'ACTIVE' });
 });
 it('rejects unchanged states without updating records', async () => {
  const run = item.name === 'category' ? updateCategoryStatus('id', 'co', 'ACTIVE', 'ACTIVE') : updateWarehouseStatus('id', 'co', 'br', 'ACTIVE', 'ACTIVE');
  await expect(run).rejects.toMatchObject({ statusCode: 400 }); expect(state.update).not.toHaveBeenCalled();
 });
 it('scopes optimistic status change preserving identity, name and code', async () => {
  state.update.mockResolvedValue({ _id: 'id', companyId: 'co', branchId: 'br', name: 'New', code: 'ORIGINAL', status: 'INACTIVE' });
  const row = await item.run();
  expect(state.update).toHaveBeenCalledWith(item.filter, { $set: { status: 'INACTIVE' } }, { new: true, runValidators: true });
  expect(row.name).toBe('New'); expect(row.id).toBe('id'); expect(row.code).toBe('ORIGINAL'); expect(row.status).toBe('INACTIVE');
 });
 it('rejects foreign records or stale states', async () => {
  state.update.mockResolvedValue(null); await expect(item.run()).rejects.toMatchObject({ statusCode: 409 });
 });
 it('permits only one concurrent update of the same original state', async () => {
  let available = true; state.update.mockImplementation(() => { if (!available) return null; available = false; return { _id: 'id', name: 'New' }; });
  const rows = await Promise.allSettled([item.run(), item.run()]);
  expect(rows.filter(row => row.status === 'fulfilled')).toHaveLength(1);
  expect(rows.find(row => row.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
 });
});
