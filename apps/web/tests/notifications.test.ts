import {test} from 'node:test';
import assert from 'node:assert/strict';
import {noticePage,readNotice,type Notice} from '../src/notificationApi';
const row:Notice={id:'b'.repeat(24),companyId:'co',branchId:'br',userId:'owner',title:'Aviso',message:'Mensaje <script>',channel:'IN_APP',status:'SENT',isRead:false,createdAt:'2026-10-05T00:00:00.000Z'};
const reply=(data:unknown)=>new Response(JSON.stringify({ok:true,data}),{status:200});
test('inbox requests only filter and cursor, validates owner scope, state and pagination',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async(url,options)=>{assert.match(String(url),/notifications\/page\?limit=20&status=SENT&cursor=cccc/);assert.equal(new Headers(options?.headers).get('Authorization'),'Bearer token');assert.doesNotMatch(String(url),/companyId|branchId|userId/);return reply({items:[row],nextCursor:null});};
 assert.equal((await noticePage('api','token','co','br','SENT','c'.repeat(24),undefined,'owner')).items.length,1);
 for(const data of [{items:[{...row,companyId:'foreign'}],nextCursor:null},{items:[{...row,userId:'other'}],nextCursor:null},{items:[{...row,channel:'EMAIL'}],nextCursor:null},{items:[{...row,isRead:true}],nextCursor:null},{items:[row,row],nextCursor:null},{items:[row],nextCursor:row.id},{items:[{...row,status:'READ',isRead:true}],nextCursor:null}]){
 globalThis.fetch=async()=>reply(data);await assert.rejects(noticePage('api','token','co','br','SENT',undefined,undefined,'owner'));}
 }finally{globalThis.fetch=original;}
});
test('marking read verifies immutable content and owner and does not send caller scope',async()=>{
 const original=globalThis.fetch;
 try{globalThis.fetch=async(url,options)=>{assert.equal(String(url),'api/notifications/'+row.id+'/read');assert.equal(options?.method,'PATCH');assert.equal(options?.body,undefined);return reply({...row,status:'READ',isRead:true});};
 assert.equal((await readNotice('api','token',row)).isRead,true);
 for(const changed of [{...row,status:'READ',isRead:true,userId:'other'},{...row,status:'READ',isRead:true,message:'changed'},row]){globalThis.fetch=async()=>reply(changed);await assert.rejects(readNotice('api','token',row));}
 globalThis.fetch=async()=>new Response('{}',{status:403});await assert.rejects(readNotice('api','token',row));
 }finally{globalThis.fetch=original;}
});
