import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
const state=vi.hoisted(()=>({create:vi.fn(),page:vi.fn(),update:vi.fn()}));
vi.mock('../src/middleware/authenticate.js',()=>({authenticate:(req:any,res:any,next:any)=>req.headers.authorization?next():res.sendStatus(401)}));
vi.mock('../src/middleware/tenant.js',()=>({tenant:(req:any,_:any,next:any)=>{req.tenant={companyId:'co',branchId:'br',userId:'actor'};next();}}));
vi.mock('../src/middleware/authorize.js',()=>({authorize:()=> (req:any,res:any,next:any)=>req.headers.authorization==='Bearer writer'?next():res.sendStatus(403)}));
vi.mock('../src/modules/empresas/departmentService.js',()=>({createAuditedDepartment:state.create,listDepartments:vi.fn(),pageDepartments:state.page,updateAuditedDepartment:state.update,parseDepartmentQuery:(q:any)=>{if(q.companyId||q.branchId)throw Object.assign(new Error(),{statusCode:400});return {...q,limit:20,search:q.search??''};}}));
import {createDepartmentRoutes} from '../src/modules/empresas/departmentRoutes.js';
let server:Server,base:string;const input={name:'Operations',code:'OPS'};
beforeAll(async()=>{const app=express();app.use(express.json());app.use('/departments',createDepartmentRoutes());app.use((error:any,_:any,res:any,__:any)=>res.status(error.statusCode??500).json({error:error.code}));server=app.listen(0);await new Promise<void>(r=>server.once('listening',r));base='http://127.0.0.1:'+(server.address() as AddressInfo).port;});
afterAll(async()=>{await new Promise<void>(r=>server.close(()=>r()));});beforeEach(()=>state.create.mockReset());
const send=(body:unknown,auth='Bearer writer')=>fetch(base+'/departments',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{Authorization:auth}:{})},body:JSON.stringify(body)});
it('department writes require authentication and edit permission',async()=>{expect((await send(input,'')).status).toBe(401);expect((await send(input,'Bearer reader')).status).toBe(403);expect(state.create).not.toHaveBeenCalled();});
it('department writes reject scope overrides and unsupported fields',async()=>{for(const body of [{...input,companyId:'foreign'},{...input,branchId:'foreign'},{...input,status:'INACTIVE'},{...input,name:' '},{...input,code:'X'.repeat(33)}])expect((await send(body)).status).toBe(400);expect(state.create).not.toHaveBeenCalled();});
it('department writes pass only authenticated scope and actor to audited persistence',async()=>{state.create.mockResolvedValue({id:'department-test'});expect((await send(input)).status).toBe(201);expect(state.create).toHaveBeenCalledWith({...input,companyId:'co',branchId:'br'},expect.objectContaining({userId:'actor'}));});

it('department edits reject tenant overrides and preserve original snapshot with session actor',async()=>{
 state.update.mockReset();state.update.mockResolvedValue({id:'dept'});const body={name:'Renamed',code:'NEW',status:'ACTIVE',expected:{name:'Original',code:'OLD',status:'ACTIVE'}};
 const edit=(value:unknown,auth='Bearer writer')=>fetch(base+'/departments/dept',{method:'PATCH',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(value)});
 expect((await edit(body,'Bearer reader')).status).toBe(403);
 for(const data of [{...body,companyId:'foreign'},{...body,status:'DELETED'},{...body,expected:undefined}])expect((await edit(data)).status).toBe(400);
 expect(state.update).not.toHaveBeenCalled();expect((await edit(body)).status).toBe(200);
 expect(state.update).toHaveBeenCalledWith({...body,id:'dept',companyId:'co',branchId:'br'},expect.objectContaining({userId:'actor'}));
});
