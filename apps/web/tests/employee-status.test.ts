import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changeEmployeeStatus} from '../src/employeeStatusApi';
const original={id:'a'.repeat(24),companyId:'co',branchId:'br',userId:'u',departmentId:'d',fullName:'Nombre de prueba',position:'Puesto de prueba',status:'ACTIVE' as const};
test('employee status sends expected state without changing identity or tenant and supports reactivation',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});
 globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://test/employees/'+original.id+'/status');assert.equal(init?.method,'PATCH');assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer token');assert.deepEqual(JSON.parse(String(init?.body)),{status:'INACTIVE',expectedStatus:'ACTIVE'});return new Response(JSON.stringify({data:{...original,status:'INACTIVE'}}));};
 const inactive=await changeEmployeeStatus('https://test','token',original);assert.equal(inactive.status,'INACTIVE');
 globalThis.fetch=async(_url,init)=>{assert.deepEqual(JSON.parse(String(init?.body)),{status:'ACTIVE',expectedStatus:'INACTIVE'});return new Response(JSON.stringify({data:original}));};
 assert.equal((await changeEmployeeStatus('https://test','token',inactive)).status,'ACTIVE');
});
test('employee status rejects mismatched confirmations, stale status and denied permission',async t=>{
 const saved=globalThis.fetch;t.after(()=>{globalThis.fetch=saved;});
 for(const change of [{id:'b'.repeat(24)},{companyId:'foreign'},{branchId:'foreign'},{userId:'other'},{departmentId:'other'},{fullName:'different'},{position:'different'},{status:'ACTIVE'}]){
  globalThis.fetch=async()=>new Response(JSON.stringify({data:{...original,status:'INACTIVE',...change}}));
  await assert.rejects(changeEmployeeStatus('https://test','token',original),/confirmar el estado/);
 }
 globalThis.fetch=async()=>new Response('',{status:409});await assert.rejects(changeEmployeeStatus('https://test','token',original),(error:any)=>error.status===409&&error.message.includes('Actualiza'));
 globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(changeEmployeeStatus('https://test','token',original),(error:any)=>error.status===403);
 globalThis.fetch=async()=>{throw new Error('Must not call API');};await assert.rejects(changeEmployeeStatus('https://test','token',{...original,id:'invalid'}),(error:any)=>error.status===400);
});
