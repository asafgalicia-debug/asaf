import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({
  getWarehouseModel: () => ({
    find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) }; return query; },
    create: async (input: any) => { const row = { ...input, _id: `warehouse-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createWarehouse, listWarehouses } from '../src/modules/inventario/warehouseService.js';
describe('warehouse domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters warehouses by company and branch', async () => {
    await createWarehouse({ companyId: 'co-1', branchId: 'br-1', name: 'North Depot', code: 'DEP-N' });
    await createWarehouse({ companyId: 'co-1', branchId: 'br-2', name: 'South Depot', code: 'DEP-S' });
    const rows = await listWarehouses('co-1', 'br-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('North Depot');
  });
  it('normalizes warehouse code', async () => {
    const row = await createWarehouse({ companyId: 'co-1', branchId: 'br-1', name: 'North Depot', code: 'dep-n' });
    expect(row.code).toBe('DEP-N');
  });
});