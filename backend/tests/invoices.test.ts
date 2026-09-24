import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({ findOne: () => { const q: any = { lean: () => q, exec: async () => ({ customerId: 'cust-1', total: 1200, status: 'PENDIENTE' }) }; return q; } }) }));
vi.mock('../src/modules/clientes/models/Customer.js', () => ({ getCustomerModel: () => ({ exists: async () => true }) }));
vi.mock('../src/modules/facturacion/models/Invoice.js', () => ({ getInvoiceModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `invoice-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createInvoice, listInvoices } from '../src/modules/facturacion/invoiceService.js';
describe('invoice domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters invoice drafts by company and branch', async () => { await createInvoice({ companyId: 'co-1', branchId: 'br-1', saleId: 'sale-1', number: 'F-001', issueDate: '2026-09-22', dueDate: '2026-10-06', taxRate: 21 }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', number: 'F-002' }); expect(await listInvoices('co-1', 'br-1')).toHaveLength(1); });
  it('calculates draft tax and total from the sale total', async () => { const row = await createInvoice({ companyId: 'co-1', branchId: 'br-1', saleId: 'sale-1', number: 'f-001', issueDate: '2026-09-22', dueDate: '2026-10-06', taxRate: 21 }); expect(row.subtotal).toBe(1200); expect(row.tax).toBe(252); expect(row.total).toBe(1452); expect(row.status).toBe('BORRADOR'); });
});