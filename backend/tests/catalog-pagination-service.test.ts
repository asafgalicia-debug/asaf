import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => { const exec = vi.fn(), limit = vi.fn(() => ({ lean: () => ({ exec }) })), sort = vi.fn(() => ({ limit })), find = vi.fn(() => ({ sort })); return { exec, limit, sort, find }; });
vi.mock('../src/modules/clientes/models/Customer.js', () => ({ getCustomerModel: () => ({find:state.find}) }));
vi.mock('../src/modules/proveedores/models/Supplier.js', () => ({ getSupplierModel: () => ({find:state.find}) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({find:state.find}) }));
import { pageCustomers } from '../src/modules/clientes/customerService.js';
import { pageSuppliers } from '../src/modules/proveedores/supplierService.js';
import { pageProducts } from '../src/modules/productos/productService.js';
beforeEach(() => { vi.clearAllMocks(); });
describe.each([{kind:'customers',run:()=>pageCustomers('co','br',{limit:2,search:'Test',cursor:'a'.repeat(24)}),scope:{companyId:'co',branchId:'br'}},{kind:'suppliers',run:()=>pageSuppliers('co','br',{limit:2,search:'Test',cursor:'a'.repeat(24)}),scope:{companyId:'co',branchId:'br'}},{kind:'products',run:()=>pageProducts('co',{limit:2,search:'Test',cursor:'a'.repeat(24)}),scope:{companyId:'co'}}])('$kind service', entry => {
 it('queries only scoped page plus one row with stable ordering', async () => {
  state.exec.mockResolvedValue([{_id:'c',name:'C'},{_id:'b',name:'B'},{_id:'a',name:'A'}]);
  expect(await entry.run()).toEqual({items:[{id:'c',name:'C'},{id:'b',name:'B'}],nextCursor:'b'});
  expect(state.find).toHaveBeenCalledWith(expect.objectContaining({...entry.scope,_id:{$lt:'a'.repeat(24)}})); expect(state.sort).toHaveBeenCalledWith({_id:-1}); expect(state.limit).toHaveBeenCalledWith(3);
 });
});
