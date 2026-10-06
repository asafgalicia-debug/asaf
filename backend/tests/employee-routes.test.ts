vi.mock('../src/modules/recursos-humanos/employeeOptions.js',async(importOriginal)=>{const actual:any=await importOriginal();return {...actual,pageEmployeeOptions:state.options};});
import {afterAll,beforeAll,beforeEach,expect,it,vi} from 'vitest';
import express from 'express';
import type {Server} from 'node:http';
import type {AddressInfo} from 'node:net';
const state=vi.hoisted(()=>({create:vi.fn(),options:vi.fn(),update:vi.fn(),status:vi.fn(),department:vi.fn()}));
vi.mock('../src/middleware/authenticate.js',()=>({authenticate:(req:any,res:any,next:any)=>req.headers.authorization?next():res.sendStatus(401)}));
vi.mock('../src/middleware/tenant.js',()=>({tenant:(req:any,_:any,next:any)=>{req.tenant={companyId:'co',branchId:'br',userId:'actor'};next();}}));
vi.mock('../src/middleware/authorize.js',()=>({authorize:()=> (req:any,res:any,next:any)=>req.headers.authorization==='Bearer writer'?next():res.sendStatus(403)}));
vi.mock('../src/modules/recursos-humanos/employeeService.js',()=>({createAuditedEmployee:state.create,updateAuditedEmployee:state.update,updateAuditedEmployeeStatus:state.status,updateAuditedEmployeeDepartment:state.department,listEmployees:vi.fn(),pageEmployees:vi.fn()}));
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

it('employee edits authorize, reject linked identities and pass original snapshot',async()=>{
 state.update.mockReset();const body={fullName:'New Name',position:'New Role',expected:{fullName:'Old Name',position:'Old Role'}};
 const edit=(value:unknown,auth='Bearer writer')=>fetch(base+'/employees/'+'a'.repeat(24),{method:'PATCH',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(value)});
 expect((await edit(body,'Bearer reader')).status).toBe(403);expect((await edit({...body,userId:'other'})).status).toBe(400);expect(state.update).not.toHaveBeenCalled();
 state.update.mockResolvedValue({id:'a'.repeat(24)});expect((await edit(body)).status).toBe(200);expect(state.update).toHaveBeenCalledWith(expect.objectContaining({...body,companyId:'co',branchId:'br',id:'a'.repeat(24)}),expect.objectContaining({userId:'actor'}));
});

it('employee status requires edit permission and rejects caller scope',async()=>{
 state.status.mockReset();state.status.mockResolvedValue({id:'employee'});const body={status:'INACTIVE',expectedStatus:'ACTIVE'};
 const sendStatus=(data:unknown,auth='Bearer writer')=>fetch(base+'/employees/'+'a'.repeat(24)+'/status',{method:'PATCH',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(data)});
 expect((await sendStatus(body,'Bearer reader')).status).toBe(403);
 for(const data of [{...body,companyId:'foreign'},{...body,userId:'other'},{...body,status:'DELETED'}])expect((await sendStatus(data)).status).toBe(400);
 expect(state.status).not.toHaveBeenCalled();expect((await sendStatus(body)).status).toBe(200);expect(state.status).toHaveBeenCalledWith({...body,companyId:'co',branchId:'br',id:'a'.repeat(24)},expect.objectContaining({userId:'actor'}));
});

it('department reassignment requires edit authorization and rejects caller scope or user links',async()=>{
 state.department.mockReset();state.department.mockResolvedValue({id:'employee'});const body={departmentId:'new',expectedDepartmentId:'old',expectedStatus:'ACTIVE'};
 const send=(data:unknown,auth='Bearer writer')=>fetch(base+'/employees/'+'a'.repeat(24)+'/department',{method:'PATCH',headers:{Authorization:auth,'Content-Type':'application/json'},body:JSON.stringify(data)});
 expect((await send(body,'Bearer reader')).status).toBe(403);
 for(const data of [{...body,companyId:'foreign'},{...body,userId:'other'},{...body,expectedStatus:'invalid'},{...body,departmentId:''}])expect((await send(data)).status).toBe(400);
 expect(state.department).not.toHaveBeenCalled();expect((await send(body)).status).toBe(200);
 expect(state.department).toHaveBeenCalledWith({...body,companyId:'co',branchId:'br',id:'a'.repeat(24)},expect.objectContaining({userId:'actor'}));
});
it('edit-only department selector uses session scope and forbids caller tenant overrides',async()=>{
 state.options.mockReset();state.options.mockResolvedValue({items:[],nextCursor:null});
 expect((await fetch(base+'/employees/department-options',{headers:{Authorization:'Bearer reader'}})).status).toBe(403);
 expect((await fetch(base+'/employees/department-options?branchId=foreign',{headers:{Authorization:'Bearer writer'}})).status).toBe(400);
 expect(state.options).not.toHaveBeenCalled();
 expect((await fetch(base+'/employees/department-options?search=Ops',{headers:{Authorization:'Bearer writer'}})).status).toBe(200);
 expect(state.options).toHaveBeenCalledWith('co','br','departments',{limit:20,search:'Ops'});
});
