import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/clientes/models/Customer.js', () => ({ getCustomerModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'cust-1' }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ findOne: () => { const query: any = { select: () => query, lean: () => query, exec: async () => ({ price: 1299.99 }) }; return query; } }) }));
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: `sale-${state.rows.length + 1}` }; state.rows.push(row); return row; }
}) }));
import { createSale, listSales } from '../src/modules/ventas/saleService.js';
describe('sale domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters sales by company and branch', async () => {
    await createSale({ companyId: 'co-1', branchId: 'br-1', customerId: 'cust-1', productId: 'prod-1', quantity: 2 });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', customerId: 'cust-1', productId: 'prod-1', quantity: 1, unitPrice: 1299.99, total: 1299.99, status: 'PENDIENTE' });
    const rows = await listSales('co-1', 'br-1');
    expect(rows).toHaveLength(1);
    expect(rows[0].customerId).toBe('cust-1');
  });
  it('calculates total from the active catalog price', async () => {
    const row = await createSale({ companyId: 'co-1', branchId: 'br-1', customerId: 'cust-1', productId: 'prod-1', quantity: 2 });
    expect(row.quantity).toBe(2);
    expect(row.total).toBe(2599.98);
    expect(row.status).toBe('PENDIENTE');
  });
});