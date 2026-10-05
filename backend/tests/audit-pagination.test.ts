import {expect,it,vi} from 'vitest';
import {parseAuditQuery} from '../src/modules/auditoria/auditPagination.js';
const state=vi.hoisted(()=>({filter:undefined as unknown,sort:undefined as unknown,limit:0,rows:[] as any[]}));
vi.mock('../src/modules/auditoria/models/AuditEvent.js',()=>({getAuditEventModel:()=>({find:(filter:unknown)=>{state.filter=filter;const q:any={sort:(sort:unknown)=>{state.sort=sort;return q;},limit:(limit:number)=>{state.limit=limit;return q;},lean:()=>q,exec:async()=>state.rows};return q;}})}));
import {pageAuditEventsForTenant} from '../src/audit/auditLogger.js';
it('rejects malformed audit filters and caller scope overrides',()=>{
 for(const raw of [{companyId:'foreign'},{branchId:'foreign'},{cursor:'bad'},{limit:101},{limit:0},{module:['a','b']},{action:'INVALID'},{module:''}])expect(()=>parseAuditQuery(raw)).toThrow();expect(parseAuditQuery({})).toEqual({limit:20});
});
it('uses tenant scope, exact filters and a descending cursor with one lookahead row',async()=>{
 const ids=['c','b','a'].map(x=>x.repeat(24));state.rows=ids.map(_id=>({_id,module:'ventas',action:'CREATE'}));
 const page=await pageAuditEventsForTenant('co','br',parseAuditQuery({limit:2,cursor:'d'.repeat(24),module:'ventas',action:'CREATE'}));
 expect(state.filter).toEqual({companyId:'co',branchId:'br',_id:{$lt:'d'.repeat(24)},module:'ventas',action:'CREATE'});expect(state.sort).toEqual({_id:-1});expect(state.limit).toBe(3);expect(page.items.map(r=>r.id)).toEqual(ids.slice(0,2));expect(page.nextCursor).toBe(ids[1]);
});
