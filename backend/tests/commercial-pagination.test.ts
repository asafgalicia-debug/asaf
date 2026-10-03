import { expect,it,describe } from 'vitest';
import { parseCommercialQuery, commercialFilter } from '../src/core/commercialPagination.js';
describe.each(['sales','purchase-orders'] as const)('%s pagination', kind => {
 it('bounds pages and uses session scope with state and cursor',()=>{const q=parseCommercialQuery({limit:'20',cursor:'a'.repeat(24),status:'PENDIENTE'},kind);expect(commercialFilter('co','br',q)).toEqual({companyId:'co',branchId:'br',status:'PENDIENTE',_id:{$lt:'a'.repeat(24)}});expect(parseCommercialQuery({},kind)).toEqual({limit:20});});
 it('rejects tenant overrides, invalid states, cursors and limits',()=>{for(const q of [{limit:51},{limit:0},{cursor:'bad'},{companyId:'other'},{branchId:'other'},{status:'INVALID'},{status:kind==='sales'?'RECIBIDA':'PAGADA'}])expect(()=>parseCommercialQuery(q,kind)).toThrow();});
});
