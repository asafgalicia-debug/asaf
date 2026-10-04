import { describe, it, expect, vi, beforeEach } from 'vitest';
const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/modules/clientes/models/Customer.js', () => ({ getCustomerModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
vi.mock('../src/modules/proveedores/models/Supplier.js', () => ({ getSupplierModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { updateCustomer } from '../src/modules/clientes/customerService.js';
import { updateSupplier } from '../src/modules/proveedores/supplierService.js';
const input = { companyId: 'company', branchId: 'branch', name: ' Contact ', taxId: ' tax-1 ', email: ' TEST@example.com ' };
describe.each([['customer', updateCustomer], ['supplier', updateSupplier]] as const)('%s update', (_, update) => {
  beforeEach(() => { state.update.mockReset(); });
  it('scopes atomic update and preserves status and tenant', async () => {
    state.update.mockResolvedValue({ _id: 'id', ...input, name: 'Contact', taxId: 'TAX-1', email: 'test@example.com', status: 'INACTIVE' });
    const row = await update('id', input);
    expect(state.update).toHaveBeenCalledWith({ _id: 'id', companyId: 'company', branchId: 'branch' }, { $set: { name: 'Contact', taxId: 'TAX-1', email: 'test@example.com' } }, { new: true, runValidators: true });
    expect(row.status).toBe('INACTIVE');
  });
  it('does not update missing or foreign records', async () => {
    state.update.mockResolvedValue(null);
    await expect(update('foreign', input)).rejects.toMatchObject({ statusCode: 404 });
  });
  it('handles duplicate identifiers', async () => {
    state.update.mockRejectedValue({ code: 11000 });
    await expect(update('id', input)).rejects.toMatchObject({ statusCode: 409 });
  });
  it('atomically compares snapshot and reports stale records as conflict', async () => {
    const expected={name:'Original',taxId:'OLD',email:'old@example.com'};
    state.update.mockResolvedValue(null);
    await expect(update('id',{...input,expected})).rejects.toMatchObject({statusCode:409});
    expect(state.update.mock.calls[0][0]).toEqual({_id:'id',companyId:'company',branchId:'branch',...expected});
  });
});
