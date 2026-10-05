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

import {requestData} from '../src/webApi';
import {validateCashMovement} from '../src/financeValidation';
test('web financial requests preserve authorization errors and do not expose server internals',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 for(const status of [401,403,409,500]){globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'PRIVATE STACK'}}),{status});await assert.rejects(requestData('https://test','/cash-movements'),(e:any)=>e.status===status&&!e.message.includes('PRIVATE'));}
 globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}));await assert.rejects(requestData('https://test','/cash-movements'),/confirmar/);
});
test('web cash validation rejects missing accounts, impossible dates and unsafe amounts',()=>{
 const account={id,status:'ACTIVE'};const valid={accountId:id,concept:'Cash',type:'INFLOW',amount:'1.25',date:'2026-10-04'};
 assert.equal(validateCashMovement(valid,[account]).amount,1.25);
 for(const value of [{...valid,date:'2026-02-30'},{...valid,amount:'0.001'},{...valid,amount:'99999999999999999999'}])assert.throws(()=>validateCashMovement(value,[account]));
 assert.throws(()=>validateCashMovement(valid,[{id,status:'INACTIVE'}]));
});
