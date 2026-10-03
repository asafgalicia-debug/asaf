import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => { const exec = vi.fn(), limit = vi.fn(() => ({ lean: () => ({ exec }) })), sort = vi.fn(() => ({ limit })), find = vi.fn(() => ({ sort })); return { exec, limit, sort, find }; });
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({find:state.find}) }));
vi.mock('../src/modules/compras/models/PurchaseOrder.js', () => ({ getPurchaseOrderModel: () => ({find:state.find}) }));
import { pageSales } from '../src/modules/ventas/saleService.js';
import { pagePurchaseOrders } from '../src/modules/compras/purchaseOrderService.js';
beforeEach(() => { vi.clearAllMocks(); });
describe.each([{kind:'sales',run:()=>pageSales('co','br',{limit:2,status:'PENDIENTE',cursor:'a'.repeat(24)}),scope:{companyId:'co',branchId:'br',status:'PENDIENTE'}},{kind:'purchase-orders',run:()=>pagePurchaseOrders('co','br',{limit:2,status:'PENDIENTE',cursor:'a'.repeat(24)}),scope:{companyId:'co',branchId:'br',status:'PENDIENTE'}}
])('$kind service', entry => {
 it('reads scoped status-filtered page with one extra row',async()=>{state.exec.mockResolvedValue([{_id:'c',name:'C'},{_id:'b',name:'B'},{_id:'a',name:'A'}]);expect(await entry.run()).toEqual({items:[{id:'c',name:'C'},{id:'b',name:'B'}],nextCursor:'b'});expect(state.find).toHaveBeenCalledWith(expect.objectContaining({...entry.scope,_id:{$lt:'a'.repeat(24)}}));expect(state.sort).toHaveBeenCalledWith({_id:-1});expect(state.limit).toHaveBeenCalledWith(3);});
});
