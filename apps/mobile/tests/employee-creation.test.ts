import {test} from 'node:test';
import assert from 'node:assert/strict';
import {employeeOptions,saveEmployee} from '../src/employeeCreationApi';
const option={id:'e'.repeat(24),name:'Ana',companyId:'co',branchId:'br',isActive:true};
test('employee selectors enforce scope, active state and pagination',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url)=>{const q=new URL(String(url));assert.equal(q.pathname,'/employees/options/users');assert.equal(q.searchParams.get('search'),'Ana');assert.equal(q.searchParams.has('companyId'),false);return new Response(JSON.stringify({data:{items:[option],nextCursor:null}}));};
 assert.equal((await employeeOptions('https://test','token','co','br','users',' Ana ',undefined,new AbortController().signal)).items[0].name,'Ana');
 for(const data of [{items:[{...option,branchId:'other'}],nextCursor:null},{items:[{...option,isActive:false}],nextCursor:null},{items:[option,option],nextCursor:null},{items:[option],nextCursor:option.id}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(employeeOptions('https://test','token','co','br','users','',undefined,new AbortController().signal));}
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[{id:'department-uuid',name:'Operations',companyId:'co',branchId:'br',status:'ACTIVE'}],nextCursor:null}}));assert.equal((await employeeOptions('https://test','token','co','br','departments','',undefined,new AbortController().signal)).items.length,1);
});
test('employee creation submits only form fields and validates confirmation',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const input={fullName:'Ana',position:'Operations',userId:option.id,departmentId:'department-uuid'};
 globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://test/employees');assert.equal(init?.method,'POST');assert.deepEqual(JSON.parse(String(init?.body)),input);return new Response(JSON.stringify({data:{...input,id:'a'.repeat(24),companyId:'co',branchId:'br',status:'ACTIVE'}}),{status:201});};assert.equal((await saveEmployee('https://test','token','co','br',input)).fullName,'Ana');
 for(const change of [{branchId:'other'},{userId:'f'.repeat(24)},{status:'INACTIVE'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...input,id:'a'.repeat(24),companyId:'co',branchId:'br',status:'ACTIVE',...change}}));await assert.rejects(saveEmployee('https://test','token','co','br',input));}
});
