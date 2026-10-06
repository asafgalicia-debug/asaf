import {test} from 'node:test';
import assert from 'node:assert/strict';
import {employeePage} from '../src/employeeApi';
const row={id:'e'.repeat(24),companyId:'co',branchId:'br',fullName:'Ana',position:'Operations',departmentId:'department',userId:'user',status:'ACTIVE'};
test('employee pages encode search, status and cursor without tenant overrides',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});globalThis.fetch=async(url,options)=>{const parsed=new URL(String(url));assert.equal(parsed.pathname,'/employees/page');assert.equal(parsed.searchParams.get('search'),'Ana');assert.equal(parsed.searchParams.get('status'),'ACTIVE');assert.equal(parsed.searchParams.get('limit'),'20');assert.equal(parsed.searchParams.get('cursor'),'f'.repeat(24));assert.equal(parsed.searchParams.has('companyId'),false);assert.equal((options?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}),{status:200});};
 assert.equal((await employeePage('https://test','token','co','br',{search:' Ana ',status:'ACTIVE',cursor:'f'.repeat(24)},new AbortController().signal)).items[0].fullName,'Ana');
});
test('employee pages reject foreign scope, inconsistent status and malformed pagination',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 for(const data of [{items:[{...row,companyId:'foreign'}],nextCursor:null},{items:[{...row,branchId:'foreign'}],nextCursor:null},{items:[{...row,status:'INACTIVE'}],nextCursor:null},{items:[row,row],nextCursor:null},{items:[row],nextCursor:row.id},{items:[{...row,fullName:''}],nextCursor:null}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}),{status:200});await assert.rejects(employeePage('https://test','token','co','br',{search:'',status:'ACTIVE'},new AbortController().signal));}
 globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(employeePage('https://test','token','co','br',{search:'',status:''},new AbortController().signal),(error:any)=>error.status===403);
});
