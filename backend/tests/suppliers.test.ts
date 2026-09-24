import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/proveedores/models/Supplier.js', () => ({
  getSupplierModel: () => ({
    find: (filter: any) => {
      const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) };
      return query;
    },
    create: async (input: any) => { const row = { ...input, _id: `supplier-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createSupplier, listSuppliers } from '../src/modules/proveedores/supplierService.js';

describe('supplier domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('lists only records in the requested company and branch', async () => {
    await createSupplier({ companyId: 'co-1', branchId: 'br-1', name: 'Central Supply', taxId: 'TAX-1', email: 'CENTRAL@example.com' });
    await createSupplier({ companyId: 'co-2', branchId: 'br-1', name: 'Other Supply', taxId: 'TAX-2', email: 'OTHER@example.com' });
    const suppliers = await listSuppliers('co-1', 'br-1');
    expect(suppliers).toHaveLength(1);
    expect(suppliers[0].name).toBe('Central Supply');
  });
  it('normalizes email and tax identifier on creation', async () => {
    const supplier = await createSupplier({ companyId: 'co-1', branchId: 'br-1', name: 'Central Supply', taxId: 'tax-1', email: 'CENTRAL@example.com' });
    expect(supplier.taxId).toBe('TAX-1');
    expect(supplier.email).toBe('central@example.com');
  });
});