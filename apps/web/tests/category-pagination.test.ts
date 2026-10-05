import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categoryPageRequest, categoryLookup } from '../src/categoryApi';
test('category pages encode literal search and keep inactive administration entries',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const row={id:'e'.repeat(24),name:'Old',code:'OLD',status:'INACTIVE'};
 globalThis.fetch=async(url,opts)=>{const u=new URL(String(url));assert.equal(u.pathname,'/categories/page');assert.equal(u.searchParams.get('search'),'A&B');assert.equal(u.searchParams.get('limit'),'20');assert.equal((opts?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.deepEqual(await categoryPageRequest('https://test','token',new AbortController().signal,'A&B'),{items:[row],nextCursor:null});
});
test('category lookup requests only selected identifiers and pages reject invalid boundaries',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});const id='a'.repeat(24),row={id,name:'Category',code:'CAT',status:'ACTIVE'};
 globalThis.fetch=async url=>{assert.equal(new URL(String(url)).searchParams.get('ids'),id);return new Response(JSON.stringify({data:{items:[row],nextCursor:null}}));};
 assert.deepEqual(await categoryLookup('https://test','token',new AbortController().signal,[id,id]),[row]);
 globalThis.fetch=async()=>new Response(JSON.stringify({data:{items:[{...row,id:'b'.repeat(24)}],nextCursor:null}}));await assert.rejects(categoryLookup('https://test','token',new AbortController().signal,[id]));
 for(const items of [[row,row],Array.from({length:21},()=>row)]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{items,nextCursor:null}}));await assert.rejects(categoryPageRequest('https://test','token',new AbortController().signal));}
});
