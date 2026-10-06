import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reportRequest} from '../src/reportApi';
test('reports validate tenant, periods, dates and metrics while allowing negative cash flow',async t=>{
 const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});
 const row={companyId:'c',branchId:'b',type:'cash-flow',period:'month',timezone:'UTC',basis:'movementDate',from:'2026-10-01T00:00:00.000Z',to:'2026-10-04T00:00:00.000Z',metrics:{income:1,expenses:2,balance:-1,incomeEntries:1,expenseEntries:1}};
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://example.test/reports/preview?type=cash-flow&period=month');assert.equal((options?.headers as Record<string,string>).Authorization,'Bearer test');return new Response(JSON.stringify({data:row}));};
 const request=()=>reportRequest('https://example.test','test','cash-flow','month',{companyId:'c',branchId:'b'},new AbortController().signal);
 assert.equal((await request()).metrics.balance,-1);
 for(const patch of [{companyId:'foreign'},{branchId:'foreign'},{period:'year'},{basis:'createdAt'},{from:'invalid'},{from:'2026-11-01'},{metrics:{...row.metrics,income:-1}},{metrics:{...row.metrics,balance:'-1'}}]){globalThis.fetch=async()=>new Response(JSON.stringify({data:{...row,...patch}}));await assert.rejects(request(),/reporte inesperada/);}
 globalThis.fetch=async()=>new Response('',{status:403});await assert.rejects(request(),/permiso/);
});
