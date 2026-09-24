import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/proveedores/models/Supplier.js', () => ({ getSupplierModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'sup-1' }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'prod-1' }) }));
vi.mock('../src/modules/compras/models/PurchaseOrder.js', () => ({ getPurchaseOrderModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: `order-${state.rows.length + 1}` }; state.rows.push(row); return row; }
}) }));
import { createPurchaseOrder, listPurchaseOrders } from '../src/modules/compras/purchaseOrderService.js';
describe('purchase order domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters orders by company and branch', async () => {
    await createPurchaseOrder({ companyId: 'co-1', branchId: 'br-1', supplierId: 'sup-1', productId: 'prod-1', quantity: 5, unitCost: 100 });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', supplierId: 'sup-1', productId: 'prod-1', quantity: 1, unitCost: 100, total: 100, status: 'PENDIENTE' });
    const rows = await listPurchaseOrders('co-1', 'br-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].supplierId).toBe('sup-1');
  });
  it('calculates total from quantity and unit cost', async () => {
    const row = await createPurchaseOrder({ companyId: 'co-1', branchId: 'br-1', supplierId: 'sup-1', productId: 'prod-1', quantity: 5, unitCost: 129.99 });
    expect(row.total).toBe(649.95);
    expect(row.status).toBe('PENDIENTE');
  });
});