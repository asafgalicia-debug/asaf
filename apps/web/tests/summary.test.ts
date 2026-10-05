import {test} from 'node:test';
import assert from 'node:assert/strict';
import {summaryRequest,summaryCsv} from '../src/summaryApi';
test('summary validates tenant, dates and metrics, preserving negative cash',async t=>{
 const old=globalThis.fetch;t.after(()=>{globalThis.fetch=old;});const data={companyId:'co',branchId:'br',lastUpdated:'2026-10-04T12:00:00Z',metrics:{sales:10,purchases:5,cash:-3,employees:1,inventory:2}};
 globalThis.fetch=async(_url,options)=>{assert.equal((options?.headers as any).Authorization,'Bearer token');return new Response(JSON.stringify({data}));};
 assert.deepEqual(await summaryRequest('https://test','token','co','br',new AbortController().signal),data);
 for(const invalid of [{...data,branchId:'foreign'},{...data,lastUpdated:'bad'},{...data,metrics:{...data.metrics,inventory:1.5}},{...data,metrics:{...data.metrics,sales:'10'}}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:invalid}));await assert.rejects(summaryRequest('https://test','token','co','br',new AbortController().signal));}
 const csv=summaryCsv(data);assert.match(csv,/Ventas no canceladas/);assert.match(csv,/"-3"/);assert.ok(csv.startsWith('\ufeff'));
});
