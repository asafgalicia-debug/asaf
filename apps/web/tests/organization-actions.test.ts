import {test} from 'node:test';import assert from 'node:assert/strict';
import {saveCompany,saveBranch,loadBranches,companyDocument,branchDocument} from '../src/organizationApi';
test('company edits send only administrative data and reject stale confirmations',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const row={id:'co',name:'Original',taxId:'QA-OLD',status:'ACTIVE' as const,updatedAt:'2026-10-06T00:00:00Z'};const updated={...row,name:'Updated',taxId:'QA-NEW',updatedAt:'2026-10-06T00:00:01Z'};
 globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'api/companies/current');assert.deepEqual(JSON.parse(String(opts?.body)),{name:'Updated',taxId:'QA-NEW',expectedUpdatedAt:row.updatedAt});return new Response(JSON.stringify({data:updated}));};assert.equal((await saveCompany('api','token',row,'Updated',' qa-new ')).taxId,'QA-NEW');
 for(const patch of [{id:'foreign'},{updatedAt:row.updatedAt},{status:'INACTIVE'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...updated,...patch}}));await assert.rejects(saveCompany('api','token',row,'Updated','qa-new'));}assert.match(companyDocument(updated).note,/No acredita/);
});
test('branches normalize codes, confirm scope and reject duplicate page records',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const row={id:'branch-id',companyId:'co',name:'Branch A+B',code:'QA-01',city:'City',isActive:true,updatedAt:'2026-10-06T00:00:00Z'};
 globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'api/branches');assert.deepEqual(JSON.parse(String(opts?.body)),{name:row.name,code:row.code,city:row.city});return new Response(JSON.stringify({data:row}));};assert.equal((await saveBranch('api','token','co',{name:row.name,code:' qa-01 ',city:row.city})).id,row.id);
 const page={items:[row],page:1,limit:20,total:1,totalPages:1};globalThis.fetch=async()=>new Response(JSON.stringify({data:page}));assert.equal((await loadBranches('api','token','co',1,'A+B')).total,1);
 for(const patch of [{items:[row,row]},{items:[{...row,companyId:'foreign'}]},{total:-1},{totalPages:2}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...page,...patch}}));await assert.rejects(loadBranches('api','token','co',1,''));}assert.equal(branchDocument(row).branch,row.id);
});
