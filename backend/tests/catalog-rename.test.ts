import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/modules/productos/models/Category.js', () => ({ getCategoryModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { renameCategory } from '../src/modules/productos/categoryService.js';
import { renameWarehouse } from '../src/modules/inventario/warehouseService.js';
const cases = [
 { name: 'category', run: () => renameCategory('id', 'co', 'Old', ' New '), filter: { _id: 'id', companyId: 'co', name: 'Old' } },
 { name: 'warehouse', run: () => renameWarehouse('id', 'co', 'br', 'Old', ' New '), filter: { _id: 'id', companyId: 'co', branchId: 'br', name: 'Old' } }
];
describe.each(cases)('$name rename', item => {
 beforeEach(() => { state.update.mockReset(); });
 it('scopes optimistic rename without changing identity, code or status', async () => {
  state.update.mockResolvedValue({ _id: 'id', companyId: 'co', branchId: 'br', name: 'New', code: 'ORIGINAL', status: 'INACTIVE' });
  const row = await item.run();
  expect(state.update).toHaveBeenCalledWith(item.filter, { $set: { name: 'New' } }, { new: true, runValidators: true });
  expect(row.id).toBe('id'); expect(row.code).toBe('ORIGINAL'); expect(row.status).toBe('INACTIVE');
 });
 it('rejects foreign records or stale names', async () => {
  state.update.mockResolvedValue(null); await expect(item.run()).rejects.toMatchObject({ statusCode: 409 });
 });
 it('permits only one concurrent rename of the same original name', async () => {
  let available = true; state.update.mockImplementation(() => { if (!available) return null; available = false; return { _id: 'id', name: 'New' }; });
  const rows = await Promise.allSettled([item.run(), item.run()]);
  expect(rows.filter(row => row.status === 'fulfilled')).toHaveLength(1);
  expect(rows.find(row => row.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
 });
});
