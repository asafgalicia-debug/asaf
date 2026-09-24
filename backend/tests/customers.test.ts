import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/clientes/models/Customer.js', () => ({
  getCustomerModel: () => ({
    find: (filter: any) => {
      const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) };
      return query;
    },
    create: async (input: any) => { const row = { ...input, _id: `customer-${state.rows.length + 1}` }; state.rows.push(row); return row; }
  })
}));
import { createCustomer, listCustomers } from '../src/modules/clientes/customerService.js';

describe('customer domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('lists only records in the requested company and branch', async () => {
    await createCustomer({ companyId: 'co-1', branchId: 'br-1', name: 'North Store', taxId: 'TAX-1', email: 'NORTH@example.com' });
    await createCustomer({ companyId: 'co-2', branchId: 'br-1', name: 'Other Store', taxId: 'TAX-2', email: 'OTHER@example.com' });
    const customers = await listCustomers('co-1', 'br-1');
    expect(customers).toHaveLength(1);
    expect(customers[0].name).toBe('North Store');
  });
  it('normalizes email and tax identifier on creation', async () => {
    const customer = await createCustomer({ companyId: 'co-1', branchId: 'br-1', name: 'North Store', taxId: 'tax-1', email: 'NORTH@example.com' });
    expect(customer.taxId).toBe('TAX-1');
    expect(customer.email).toBe('north@example.com');
  });
});