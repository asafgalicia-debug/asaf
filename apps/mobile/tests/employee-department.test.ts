import {test} from 'node:test';
import assert from 'node:assert/strict';
import {changeEmployeeDepartment} from '../src/employeeDepartmentApi';
import {employeeOptions} from '../src/employeeCreationApi';
const original={id:'a'.repeat(24),companyId:'co',branchId:'br',userId:'linked',departmentId:'old',fullName:'Employee Name',position:'Role',status:'ACTIVE' as const};
test('department assignment sends original department and status, preserving employee identity',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,init)=>{assert.equal(String(url),'api/employees/'+original.id+'/department');assert.equal(init?.method,'PATCH');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer token');assert.deepEqual(JSON.parse(String(init?.body)),{departmentId:'new',expectedDepartmentId:'old',expectedStatus:'ACTIVE'});return new Response(JSON.stringify({data:{...original,departmentId:'new'}}));};
 assert.equal((await changeEmployeeDepartment('api','token',original,'new')).departmentId,'new');
 for(const patch of [{userId:'foreign'},{branchId:'foreign'},{status:'INACTIVE'},{departmentId:'other'},{position:'different'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...original,departmentId:'new',...patch}}));await assert.rejects(changeEmployeeDepartment('api','token',original,'new'));}
 globalThis.fetch=async()=>new Response('{}',{status:409});await assert.rejects(changeEmployeeDepartment('api','token',original,'new'),(e:any)=>e.status===409&&e.message.includes('Actualiza'));
 await assert.rejects(changeEmployeeDepartment('api','token',original,'old'),(e:any)=>e.status===400);
});
test('edit department selector uses its edit-only endpoint and rejects inactive or foreign choices',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const row={id:'new',name:'Operations',companyId:'co',branchId:'br',status:'ACTIVE'};
 globalThis.fetch=async url=>{assert.match(String(url),/employees\/department-options\?limit=20&search=Ops/);return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.equal((await employeeOptions('api','token','co','br','departments','Ops',undefined,new AbortController().signal,'edit')).items[0].id,'new');
 for(const patch of [{status:'INACTIVE'},{branchId:'other'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[{...row,...patch}],nextCursor:null}}));await assert.rejects(employeeOptions('api','token','co','br','departments','',undefined,new AbortController().signal,'edit'));}
});
