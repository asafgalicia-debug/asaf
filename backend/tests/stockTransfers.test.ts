import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter.branchId === 'br-1' && ['wh-1', 'wh-2'].includes(filter._id) }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'prod-1' }) }));
vi.mock('../src/modules/inventario/models/StockTransfer.js', () => ({
  getStockTransferModel: () => ({
    find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) }; return query; },
    create: async (input: any) => { const row = { ...input, _id: `transfer-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createTransfer, listTransfers } from '../src/modules/inventario/transferService.js';
describe('stock transfer domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters transfers by company and branch', async () => {
    await createTransfer({ companyId: 'co-1', branchId: 'br-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 25, status: 'PENDIENTE' });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 5, status: 'PENDIENTE' });
    const rows = await listTransfers('co-1', 'br-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].fromWarehouseId).toBe('wh-1');
  });
  it('creates only pending transfers', async () => {
    const row = await createTransfer({ companyId: 'co-1', branchId: 'br-1', fromWarehouseId: 'wh-1', toWarehouseId: 'wh-2', productId: 'prod-1', quantity: 25, status: 'PENDIENTE' });
    expect(row.quantity).toBe(25);
    expect(row.status).toBe('PENDIENTE');
  });
});