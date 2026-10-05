vi.mock('../src/modules/recursos-humanos/employeeOptions.js',async(importOriginal)=>{const actual:any=await importOriginal();return {...actual,pageEmployeeOptions:state.options};});
import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
const state=vi.hoisted(()=>({create:vi.fn(),options:vi.fn()}));
vi.mock('../src/middleware/authenticate.js',()=>({authenticate:(req:any,res:any,next:any)=>req.headers.authorization?next():res.sendStatus(401)}));
vi.mock('../src/middleware/tenant.js',()=>({tenant:(req:any,_:any,next:any)=>{req.tenant={companyId:'co',branchId:'br',userId:'actor'};next();}}));
vi.mock('../src/middleware/authorize.js',()=>({authorize:()=> (req:any,res:any,next:any)=>req.headers.authorization==='Bearer writer'?next():res.sendStatus(403)}));
vi.mock('../src/modules/recursos-humanos/employeeService.js',()=>({createAuditedEmployee:state.create,listEmployees:vi.fn(),pageEmployees:vi.fn()}));
import {createEmployeeRoutes} from '../src/modules/recursos-humanos/employeeRoutes.js';
let server:Server,base:string;const input={departmentId:'department-valid',userId:'a'.repeat(24),fullName:'Employee',position:'Operations'};
beforeAll(async()=>{const app=express();app.use(express.json());app.use('/employees',createEmployeeRoutes());app.use((error:any,_:any,res:any,__:any)=>res.status(error.statusCode??500).json({error:error.code}));server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));base='http://127.0.0.1:'+(server.address() as AddressInfo).port;});
afterAll(async()=>{await new Promise<void>(r=>server.close(()=>r()));});beforeEach(()=>state.create.mockReset());
const send=(body:unknown,auth='Bearer writer')=>fetch(base+'/employees',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:auth}:{})},body:JSON.stringify(body)});
it('employee creation requires authentication and permission before persistence',async()=>{expect((await send(input,'')).status).toBe(401);expect((await send(input,'Bearer reader')).status).toBe(403);expect(state.create).not.toHaveBeenCalled();});
it('employee creation rejects caller scope and invalid user identifiers',async()=>{for(const body of [{...input,companyId:'foreign'},{...input,branchId:'foreign'},{...input,userId:'invalid'}])expect((await send(body)).status).toBe(400);expect(state.create).not.toHaveBeenCalled();});
it('employee creation keeps linked user distinct from authenticated audit actor',async()=>{state.create.mockResolvedValue({id:'employee'});expect((await send(input)).status).toBe(201);expect(state.create).toHaveBeenCalledWith({...input,companyId:'co',branchId:'br'},expect.objectContaining({userId:'actor'}));});

it('employee selectors require write permission and enforce session scope',async()=>{
 state.options.mockReset();state.options.mockResolvedValue({items:[],nextCursor:null});
 for(const kind of ['users','departments']){
 expect((await fetch(base+'/employees/options/'+kind,{headers:{Authorization:'Bearer reader'}})).status).toBe(403);
 expect((await fetch(base+'/employees/options/'+kind+'?companyId=foreign',{headers:{Authorization:'Bearer writer'}})).status).toBe(400);
 expect((await fetch(base+'/employees/options/'+kind+'?search=Ana',{headers:{Authorization:'Bearer writer'}})).status).toBe(200);
 expect(state.options).toHaveBeenCalledWith('co','br',kind,{search:'Ana',limit:20});
 }
});
