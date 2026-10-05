import {beforeAll,afterAll,beforeEach,it,expect,vi} from 'vitest';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
const state=vi.hoisted(()=>({find:vi.fn(),exec:vi.fn()}));
vi.mock('../src/middleware/authenticate.js',()=>({authenticate:(req:any,res:any,next:any)=>req.headers.authorization?next():res.sendStatus(401)}));
vi.mock('../src/middleware/tenant.js',()=>({tenant:(req:any,_:any,next:any)=>{req.tenant={companyId:'co',branchId:'br',userId:'user'};next();}}));
vi.mock('../src/middleware/authorize.js',()=>({authorize:(permission:string)=>(req:any,res:any,next:any)=>req.headers.authorization==='Bearer '+permission?next():res.sendStatus(403)}));
vi.mock('mongoose',async original=>{const actual=await original<any>();const model={findOne:state.find};return {...actual,default:{...actual.default,models:{...actual.default.models,CommercialSettlement:model}}};});
import {createSettlementRoutes} from '../src/modules/ventas/commercialSettlement.js';
let server:Server,base:string;const sourceId='a'.repeat(24);
beforeAll(async()=>{const app=express();app.use('/settlements',createSettlementRoutes());app.use((e:any,_:any,res:any,__:any)=>res.status(e.statusCode??500).json({error:e.code}));server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));base='http://127.0.0.1:'+(server.address() as AddressInfo).port;});
afterAll(()=>new Promise<void>(r=>server.close(()=>r())));
beforeEach(()=>{state.find.mockReset().mockReturnValue({lean:()=>({exec:state.exec})});state.exec.mockReset();});
const get=(query:string,auth='Bearer usuarios.ver')=>fetch(base+'/settlements?'+query,{headers:auth?{Authorization:auth}:{}});
it('receipt lookup requires read permission and rejects extra or repeated query values',async()=>{
 const query='kind=sales&sourceId='+sourceId;expect((await get(query,'')).status).toBe(401);expect((await get(query,'Bearer usuarios.editar')).status).toBe(403);
 for(const q of [query+'&companyId=foreign',query+'&kind=purchase-orders','kind=sales&sourceId=invalid',query+'&limit=20'])expect((await get(q)).status).toBe(400);
 expect(state.find).not.toHaveBeenCalled();
});
it('receipt lookup scopes by session and returns 404 for unavailable documents',async()=>{
 const query='kind=sales&sourceId='+sourceId;state.exec.mockResolvedValue(null);expect((await get(query)).status).toBe(404);
 expect(state.find).toHaveBeenCalledWith({kind:'sales',sourceId,companyId:'co',branchId:'br'});
 state.exec.mockResolvedValue({_id:'receipt',companyId:'co',branchId:'br',sourceId});const response=await get(query);expect(response.status).toBe(200);expect((await response.json()).data.id).toBe('receipt');
});
