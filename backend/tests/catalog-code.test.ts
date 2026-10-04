import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/modules/productos/models/Category.js', () => ({ getCategoryModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { updateCategoryCode } from '../src/modules/productos/categoryService.js';
import { updateWarehouseCode } from '../src/modules/inventario/warehouseService.js';
const cases = [
 { name: 'category', run: () => updateCategoryCode('id', 'co', 'OLD', ' new '), filter: { _id: 'id', companyId: 'co', code: 'OLD' } },
 { name: 'warehouse', run: () => updateWarehouseCode('id', 'co', 'br', 'OLD', ' new '), filter: { _id: 'id', companyId: 'co', branchId: 'br', code: 'OLD' } }
];
describe.each(cases)('$name code update', item => {
 beforeEach(() => { state.update.mockReset(); });
 it('scopes optimistic code update without changing identity, name or status', async () => {
  state.update.mockResolvedValue({ _id: 'id', companyId: 'co', branchId: 'br', name: 'New', code: 'NEW', status: 'INACTIVE' });
  const row = await item.run();
  expect(state.update).toHaveBeenCalledWith(item.filter, { $set: { code: 'NEW' } }, { new: true, runValidators: true });
  expect(row.id).toBe('id'); expect(row.code).toBe('NEW'); expect(row.status).toBe('INACTIVE');
 });
 it('reports duplicate codes', async () => {
  state.update.mockRejectedValue({ code: 11000 }); await expect(item.run()).rejects.toMatchObject({ statusCode: 409 });
 });
 it('rejects foreign records or stale codes', async () => {
  state.update.mockResolvedValue(null); await expect(item.run()).rejects.toMatchObject({ statusCode: 409 });
 });
 it('permits only one concurrent code update of the same original code', async () => {
  let available = true; state.update.mockImplementation(() => { if (!available) return null; available = false; return { _id: 'id', name: 'New' }; });
  const rows = await Promise.allSettled([item.run(), item.run()]);
  expect(rows.filter(row => row.status === 'fulfilled')).toHaveLength(1);
  expect(rows.find(row => row.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
 });
});

it('rejects unchanged codes before database access', async () => {
 state.update.mockReset(); await expect(updateCategoryCode('id','co','OLD',' old ')).rejects.toMatchObject({statusCode:400}); await expect(updateWarehouseCode('id','co','br','OLD','OLD')).rejects.toMatchObject({statusCode:400}); expect(state.update).not.toHaveBeenCalled();
});
