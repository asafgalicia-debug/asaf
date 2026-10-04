import {expect,it} from 'vitest';
import {settlementInput} from '../src/modules/ventas/commercialSettlement.js';
const body={kind:'sales',sourceId:'a'.repeat(24),warehouseId:'b'.repeat(24),accountId:'c'.repeat(24),date:'2026-10-04'};
it('settlement rejects tenant overrides, client amounts and impossible dates',()=>{
 for(const bad of [{...body,companyId:'foreign'},{...body,total:1},{...body,quantity:1},{...body,date:'2026-02-30'},{...body,date:'2026-2-3'},{...body,kind:'transfers'},{...body,accountId:'bad'}])expect(settlementInput.safeParse(bad).success).toBe(false);
});
it('settlement normalizes identities and supports both commercial sources',()=>{
 expect(settlementInput.parse({...body,sourceId:'A'.repeat(24)}).sourceId).toBe('a'.repeat(24));
 expect(settlementInput.parse({...body,kind:'purchase-orders'}).kind).toBe('purchase-orders');
});
