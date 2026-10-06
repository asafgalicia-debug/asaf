import {test} from 'node:test';
import assert from 'node:assert/strict';
import {financePage} from '../src/financeApi';
const id='a'.repeat(24),signal=new AbortController().signal;
test('financial pages encode search and type and reject unrelated or malformed pages',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 globalThis.fetch=async(url,options)=>{assert.match(String(url),/cash-movements\/page\?search=A%26B&limit=20&type=INFLOW/);assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[{id,accountId:id,concept:'A&B',type:'INFLOW',amount:10,date:'2026-10-04'}],nextCursor:null}}));};
 assert.equal((await financePage('https://test','token','cash-movements',signal,'A&B','','INFLOW')).items.length,1);
 for(const row of [{id,accountId:id,concept:'Cash',type:'OUTFLOW',amount:1,date:'2026-10-04'},{id,accountId:id,concept:'Cash',type:'INFLOW',amount:1,date:'2026-02-30'}]){
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));await assert.rejects(financePage('https://test','token','cash-movements',signal,'','','INFLOW'));
 }
});
test('account pages keep inactive records and enforce ordering, page size and cursors',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={id,name:'Account',bankName:'Bank',iban:'TEST-001',status:'INACTIVE'};
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));assert.equal((await financePage('https://test','token','bank-accounts',signal)).items.length,1);
 for(const data of [{items:[row,row],nextCursor:null},{items:Array.from({length:21},()=>row),nextCursor:null},{items:[row],nextCursor:id}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(financePage('https://test','token','bank-accounts',signal));}
});
