import {test} from 'node:test';
import assert from 'node:assert/strict';
import {auditPage} from '../src/auditApi';
const row=(id:string)=>({id,companyId:'co',branchId:'br',action:'CREATE',module:'ventas',createdAt:'2026-10-05T12:00:00Z'});
test('audit request sends filters and cursor without caller tenant fields',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});globalThis.fetch=async(url,options)=>{const parsed=new URL(String(url));assert.equal(parsed.pathname,'/audit/page');assert.equal(parsed.searchParams.get('module'),'ventas');assert.equal(parsed.searchParams.get('action'),'CREATE');assert.equal(parsed.searchParams.get('cursor'),'f'.repeat(24));assert.equal(parsed.searchParams.has('companyId'),false);assert.equal((options?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row('e'.repeat(24))],nextCursor:null}}),{status:200});};
 assert.equal((await auditPage('https://test','token','co','br',{module:' ventas ',action:'CREATE',cursor:'f'.repeat(24)},new AbortController().signal)).items.length,1);
});
test('audit response rejects foreign scope, mismatched filters, duplicates and unsafe cursor',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 for(const data of [{items:[{...row('e'.repeat(24)),companyId:'foreign'}],nextCursor:null},{items:[{...row('e'.repeat(24)),branchId:'foreign'}],nextCursor:null},{items:[{...row('e'.repeat(24)),action:'DELETE'}],nextCursor:null},{items:[{...row('e'.repeat(24)),module:'compras'}],nextCursor:null},{items:[row('e'.repeat(24)),row('e'.repeat(24))],nextCursor:null},{items:[row('e'.repeat(24))],nextCursor:'e'.repeat(24)},{items:[{...row('e'.repeat(24)),createdAt:'bad'}],nextCursor:null}]){
 globalThis.fetch=async()=>new Response(JSON.stringify({data}),{status:200});await assert.rejects(auditPage('https://test','token','co','br',{module:'ventas',action:'CREATE'},new AbortController().signal));}
});
