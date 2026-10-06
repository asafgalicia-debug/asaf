import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updatePartner,updateProductRequest} from '../src/api';
test('edits send the original snapshot rather than the modified draft',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const id='a'.repeat(24),categoryId='b'.repeat(24),signal=new AbortController().signal;
 const original={id,name:'Original',taxId:'OLD',email:'old@example.com',status:'ACTIVE' as const};
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(String(options?.body));assert.deepEqual(body.expected,{name:'Original',taxId:'OLD',email:'old@example.com'});return new Response(JSON.stringify({data:{id,...body,status:'ACTIVE'}}));};
 await updatePartner('https://test','customers','token',id,{name:'Changed',taxId:'NEW',email:'new@example.com'},signal,original);
 const product={id,name:'Original',categoryId,sku:'SKU',price:1,status:'ACTIVE' as const};
 globalThis.fetch=async(_url,options)=>{const body=JSON.parse(String(options?.body));assert.deepEqual(body.expected,{name:'Original',categoryId,sku:'SKU',price:1});assert.equal(body.sku,undefined);return new Response(JSON.stringify({data:{id,...body,sku:'SKU',status:'ACTIVE'}}));};
 await updateProductRequest('https://test','token',id,{name:'Changed',categoryId,sku:'SKU',price:'2'},signal,product);
 globalThis.fetch=async()=>new Response('{}',{status:409});
 await assert.rejects(updateProductRequest('https://test','token',id,{name:'Changed',categoryId,sku:'SKU',price:'2'},signal,product),(e:any)=>e.status===409);
});
