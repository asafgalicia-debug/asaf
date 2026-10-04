import {beforeAll,afterAll,beforeEach,it,expect,vi} from 'vitest';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
const state=vi.hoisted(()=>({create:vi.fn(),preview:vi.fn(),audit:vi.fn()}));
vi.mock('../src/middleware/authenticate.js',()=>({authenticate:(req:any,res:any,next:any)=>req.headers.authorization?next():res.sendStatus(401)}));
vi.mock('../src/middleware/tenant.js',()=>({tenant:(req:any,_:any,next:any)=>{req.tenant={companyId:'co',branchId:'br',userId:'user'};next();}}));
vi.mock('../src/middleware/authorize.js',()=>({authorize:()=> (req:any,res:any,next:any)=>req.headers.authorization==='Bearer allowed'?next():res.sendStatus(403)}));
vi.mock('../src/audit/auditLogger.js',()=>({logAuditEvent:state.audit}));
vi.mock('../src/modules/reportes/reportService.js',()=>({createReport:state.create,listReports:vi.fn()}));
vi.mock('../src/modules/reportes/reportPreview.js',()=>({previewReport:state.preview}));
import {createReportRoutes} from '../src/modules/reportes/reportRoutes.js';
let server:Server,base:string;
beforeAll(async()=>{const app=express();app.use(express.json());app.use('/reports',createReportRoutes());app.use((e:any,_:any,res:any,__:any)=>res.status(e.statusCode??500).json({error:e.code}));server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));base='http://127.0.0.1:'+(server.address() as AddressInfo).port;});
afterAll(()=>new Promise<void>(r=>server.close(()=>r())));
beforeEach(()=>{state.create.mockReset();state.preview.mockReset();state.audit.mockReset();});
const body={name:'Report',type:'cash-flow',period:'month'};
const post=(value:unknown,auth='Bearer allowed')=>fetch(base+'/reports',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:auth}:{})},body:JSON.stringify(value)});
it('rejects tenant overrides, ignored filters and missing permissions',async()=>{
 expect((await post(body,'')).status).toBe(401);expect((await post(body,'Bearer denied')).status).toBe(403);
 for(const value of [{...body,companyId:'foreign'},{...body,filters:{accountId:'x'}},{...body,name:' '},{...body,period:'custom'}])expect((await post(value)).status).toBe(400);
 expect(state.create).not.toHaveBeenCalled();
});
it('saves using session scope and audits confirmed identity',async()=>{
 state.create.mockResolvedValue({id:'id',...body});expect((await post(body)).status).toBe(201);
 expect(state.create).toHaveBeenCalledWith({...body,companyId:'co',branchId:'br',userId:'user'});
 expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({entityId:'id',companyId:'co',branchId:'br'}));
});
it('preview rejects repeated query values and scope overrides without persistence',async()=>{
 for(const query of ['type=sales&type=cash-flow&period=day','type=sales&period=month&companyId=foreign','type=financial&period=day'])expect((await fetch(base+'/reports/preview?'+query,{headers:{Authorization:'Bearer allowed'}})).status).toBe(400);
 state.preview.mockResolvedValue({metrics:{total:0}});expect((await fetch(base+'/reports/preview?type=sales&period=day',{headers:{Authorization:'Bearer allowed'}})).status).toBe(200);
 expect(state.preview).toHaveBeenCalledWith('co','br','sales','day');expect(state.create).not.toHaveBeenCalled();
});
