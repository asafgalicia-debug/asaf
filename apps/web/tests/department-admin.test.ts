import {test} from 'node:test';import assert from 'node:assert/strict';
import {departmentPage,editDepartment} from '../src/departmentAdminApi';
const row={id:'department-z',name:'Operations',code:'OPS',status:'ACTIVE' as const,companyId:'co',branchId:'br'};
test('department pages enforce scope, status, descending IDs and bounded cursors',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,options)=>{assert.match(String(url),/departments\/page\?limit=20&search=A%2BB&status=ACTIVE/);assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.equal((await departmentPage('api','token','co','br','A+B','ACTIVE')).items.length,1);
 for(const data of [{items:[{...row,branchId:'other'}],nextCursor:null},{items:[{...row,status:'INACTIVE'}],nextCursor:null},{items:[row,row],nextCursor:null},{items:[row],nextCursor:row.id}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(departmentPage('api','token','co','br','','ACTIVE'));}
});
test('department edits send original values and validate exact confirmed result',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'api/departments/'+row.id);assert.deepEqual(JSON.parse(String(options?.body)),{name:'New Operations',code:'NEW',status:'INACTIVE',expected:{name:row.name,code:row.code,status:row.status}});return new Response(JSON.stringify({data:{...row,name:'New Operations',code:'NEW',status:'INACTIVE'}}));};
 assert.equal((await editDepartment('api','token',row,' New Operations ',' new ','INACTIVE')).status,'INACTIVE');
 for(const change of [{id:'other'},{branchId:'other'},{status:'ACTIVE'},{code:'WRONG'}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...row,name:'New Operations',code:'NEW',status:'INACTIVE',...change}}));await assert.rejects(editDepartment('api','token',row,'New Operations','NEW','INACTIVE'));}
 globalThis.fetch=async()=>new Response('{}',{status:409});await assert.rejects(editDepartment('api','token',row,'New Operations','NEW','INACTIVE'),(e:any)=>e.status===409&&e.message.includes('empleados activos'));
});
