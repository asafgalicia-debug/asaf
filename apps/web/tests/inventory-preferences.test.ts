import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inventoryAlerts,inventoryPreference,saveInventoryPreference} from '../src/inventoryPreferencesApi';
const signal=()=>new AbortController().signal;
test('inventory preference reads and writes validate company and version without tenant payload',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const result={companyId:'co',module:'inventario',version:2,config:{stockAlertThreshold:10}};
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://test/config/inventario');assert.equal((options?.headers as any).Authorization,'Bearer token');assert.deepEqual(JSON.parse(String(options?.body)),{expectedVersion:1,stockAlertThreshold:10});return new Response(JSON.stringify({data:result}));};assert.equal((await saveInventoryPreference('https://test','token','co',1,'10',signal())).version,2);
 for(const patch of [{companyId:'foreign'},{version:3},{config:{stockAlertThreshold:11}}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...result,...patch}}));await assert.rejects(saveInventoryPreference('https://test','token','co',1,'10',signal()),/confirmar/);}
 for(const value of ['-1','1.5','1000001',''])await assert.rejects(saveInventoryPreference('https://test','token','co',1,value,signal()),/entero/);
 globalThis.fetch=async()=>new Response('{}',{status:404});assert.equal(await inventoryPreference('https://test','token','co',signal()),null);
 globalThis.fetch=async()=>new Response('{}',{status:403});await assert.rejects(inventoryPreference('https://test','token','co',signal()),(e:any)=>e.status===403);
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{...result,companyId:'foreign'}}));await assert.rejects(inventoryPreference('https://test','token','co',signal()),/inesperada/);
});
test('inventory alerts validate threshold, strict lower boundary, ordering and cursor',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const row={productId:'a'.repeat(24),warehouseId:'b'.repeat(24),quantity:8};const page={configured:true,threshold:10,configVersion:1,items:[row],nextCursor:null};
 globalThis.fetch=async(url,options)=>{assert.equal(String(url),'https://test/stock/alerts?limit=20&search=A%26B');assert.equal(options?.body,undefined);return new Response(JSON.stringify({data:page}));};assert.equal((await inventoryAlerts('https://test','token',signal(),'A&B')).items[0].quantity,8);
 for(const data of [{...page,threshold:-1},{...page,configVersion:null},{...page,items:[{...row,quantity:10}]},{...page,items:[row,row]},{...page,nextCursor:row.warehouseId+':'+row.productId},{...page,configured:false}]){globalThis.fetch=async()=>new Response(JSON.stringify({data}));await assert.rejects(inventoryAlerts('https://test','token',signal()),/inesperad/);}
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{configured:false,threshold:null,configVersion:null,items:[],nextCursor:null}}));assert.equal((await inventoryAlerts('https://test','token',signal())).configured,false);
});
