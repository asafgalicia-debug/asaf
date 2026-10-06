import {loadRolePage} from '../src/roleAdministrationApi';
import {assignableRoles} from '../src/userCreationApi';
import {saveRoleStatus} from '../src/roleAdministrationApi';
import {roleDocument} from '../src/operationsDocument';
import {test} from 'node:test';import assert from 'node:assert/strict';import {saveRoleChange,saveRole,validRoleDraft} from '../src/roleAdministrationApi';
test('role creation normalizes fields and sends only held grants',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const actor=['productos.ver','usuarios.ver'];assert.equal(validRoleDraft('Reader','Catalog reader',['usuarios.editar'],actor),false);assert.equal(validRoleDraft('Reader','Catalog reader',['productos.ver','productos.ver'],actor),false);globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'api/roles');assert.deepEqual(JSON.parse(String(opts?.body)),{name:'READER',description:'Catalog reader',permissions:['productos.ver']});return new Response(JSON.stringify({data:{id:'000000000000000000000003',name:'READER',description:'Catalog reader',companyId:'co',isSystem:false,permissions:['productos.ver']}}));};assert.equal((await saveRole('api','token','co',' Reader ','Catalog reader',['productos.ver'],actor)).name,'READER');});
test('role confirmation rejects foreign company and changed grants',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});for(const patch of [{companyId:'foreign'},{permissions:['usuarios.editar']},{isSystem:true}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{id:'000000000000000000000003',name:'READER',description:'Catalog reader',companyId:'co',isSystem:false,permissions:['productos.ver'],...patch}}));await assert.rejects(saveRole('api','token','co','Reader','Catalog reader',['productos.ver'],['productos.ver']));}});

test('role document lists actual grants without implying user access changes',()=>{const doc=roleDocument({id:'id',name:'READER',description:'Catalog reader',companyId:'co',isSystem:false,permissions:['productos.ver','usuarios.ver']},'co');assert.deepEqual(doc.rows,[['READER','Catalog reader','productos.ver'],['READER','Catalog reader','usuarios.ver']]);assert.equal(doc.company,'co');assert.match(doc.note!,/No modifica/);});

test('role edit sends snapshot and rejects changed identity, permissions and system roles',async t=>{const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const row={id:'000000000000000000000003',name:'READER',description:'Catalog reader',companyId:'co',isSystem:false,permissions:['productos.ver','usuarios.ver'],updatedAt:'2026-10-06T00:00:00Z'};globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'api/roles/'+row.id);assert.deepEqual(JSON.parse(String(opts?.body)),{description:'Reduced access',permissions:['productos.ver'],expectedUpdatedAt:row.updatedAt});return new Response(JSON.stringify({data:{...row,description:'Reduced access',permissions:['productos.ver']}}));};assert.equal((await saveRoleChange('api','token','co',row,'Reduced access',['productos.ver'],row.permissions)).name,'READER');await assert.rejects(saveRoleChange('api','token','co',{...row,isSystem:true},'Reduced access',['productos.ver'],row.permissions));for(const patch of [{name:'OTHER'},{companyId:'foreign'},{permissions:['usuarios.ver']}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...row,description:'Reduced access',permissions:['productos.ver'],...patch}}));await assert.rejects(saveRoleChange('api','token','co',row,'Reduced access',['productos.ver'],row.permissions));}});

test('inactive roles are available to administration but excluded from assignment',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 const row={id:'000000000000000000000003',name:'READER',description:'Reader role',companyId:'co',isSystem:false,permissions:['productos.ver'],isActive:false};
 globalThis.fetch=async()=>new Response(JSON.stringify({data:[row]}));
 assert.equal((await assignableRoles('api','token','co',row.permissions)).length,0);
 assert.equal((await assignableRoles('api','token','co',row.permissions,undefined,true)).length,1);
});
test('status changes send a snapshot and require a newer matching confirmation',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 const row={id:'000000000000000000000003',name:'READER',description:'Reader role',companyId:'co',isSystem:false,permissions:['productos.ver'],isActive:true,updatedAt:'2026-10-06T00:00:00Z'};
 const updated={...row,isActive:false,updatedAt:'2026-10-06T00:00:01Z'};
 globalThis.fetch=async(url,opts)=>{assert.equal(String(url),'api/roles/'+row.id+'/status');assert.deepEqual(JSON.parse(String(opts?.body)),{isActive:false,expectedUpdatedAt:row.updatedAt});return new Response(JSON.stringify({data:updated}));};
 assert.equal((await saveRoleStatus('api','token','co',row,row.permissions)).isActive,false);
 for(const patch of [{companyId:'foreign'},{isActive:true},{updatedAt:row.updatedAt},{permissions:['usuarios.editar']}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...updated,...patch}}));await assert.rejects(saveRoleStatus('api','token','co',row,row.permissions));}
 await assert.rejects(saveRoleStatus('api','token','co',{...row,isSystem:true},row.permissions));
});

test('role pagination validates totals, identities and permissions before displaying records',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});
 const row={id:'000000000000000000000003',name:'READER',description:'Reader role',companyId:'co',isSystem:false,permissions:['productos.ver'],isActive:false,updatedAt:'2026-10-06T00:00:00Z'};
 const page={items:[row],page:1,limit:20,total:1,totalPages:1};
 globalThis.fetch=async(url)=>{assert.equal(String(url),'api/roles/page?page=1&limit=20&search=A%2BB');return new Response(JSON.stringify({data:page}));};
 assert.equal((await loadRolePage('api','token','co',row.permissions,1,'A+B')).items[0].isActive,false);
 for(const patch of [{total:-1},{totalPages:2},{items:[row,row]},{items:[{...row,companyId:'foreign'}]},{items:[{...row,permissions:['usuarios.editar']}]}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...page,...patch}}));await assert.rejects(loadRolePage('api','token','co',row.permissions,1,''));}
});
