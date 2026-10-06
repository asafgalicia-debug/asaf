import {z} from 'zod';
import {catalogSlice} from '../../core/catalogPagination.js';
import {getEmployeeModel} from '../recursos-humanos/models/Employee.js';
import mongoose, {type ClientSession} from 'mongoose';
import {getAuditEventModel} from '../auditoria/models/AuditEvent.js';
import { randomUUID } from 'node:crypto';

import { AppError } from '../../errors/AppError.js';
import { getBranchModel } from './models/Branch.js';
import { getDepartmentModel, type DepartmentDocument } from './models/Department.js';

export type DepartmentRecord = {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

function serialize(row: DepartmentDocument): DepartmentRecord {
  const { _id, assignmentRevision: _revision, ...department } = row;
  return { id: String(_id), ...department };
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

export async function listDepartments(companyId: string, branchId: string): Promise<DepartmentRecord[]> {
  const normalizedCompanyId = companyId.trim();
  const normalizedBranchId = branchId.trim();
  if (!normalizedCompanyId || !normalizedBranchId) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Company and branch are required', friendlyMessage: 'La empresa y sucursal son obligatorias.', statusCode: 400 });
  }
  const rows = await getDepartmentModel().find({ companyId: normalizedCompanyId, branchId: normalizedBranchId }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => serialize(row as DepartmentDocument));
}

export async function createDepartment(input: { companyId: string; branchId: string; name: string; code: string }, session?: ClientSession): Promise<DepartmentRecord> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  if (!companyId || !branchId || !name || !code || name.length > 120 || code.length > 32) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid department data', friendlyMessage: 'Completa empresa, sucursal, nombre y c\u00f3digo v\u00e1lidos.', statusCode: 400 });
  }
  const branch = await getBranchModel().exists({ _id: branchId, companyId, isActive: true }).session(session ?? null);
  if (!branch) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Branch does not belong to the company or is inactive', friendlyMessage: 'La sucursal no existe, est\u00e1 inactiva o no pertenece a la empresa.', statusCode: 400 });
  }
  try {
    const value = { _id: `department-${randomUUID()}`, companyId, branchId, name, code, status: 'ACTIVE' as const };
    const row = session ? (await getDepartmentModel().create([value], {session}))[0] : await getDepartmentModel().create(value);
    return serialize(row.toObject() as DepartmentDocument);
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError({ code: 'CONFLICT', message: 'Department code already exists for branch', friendlyMessage: 'Ya existe un departamento con ese c\u00f3digo en esta sucursal.', statusCode: 409 });
    }
    throw error;
  }
}

export async function createAuditedDepartment(input: Parameters<typeof createDepartment>[0], context: {userId: string; ipAddress?: string}) {
  if (!context.userId.trim()) throw new AppError({code:'UNAUTHORIZED',message:'Missing department audit actor',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
  await Promise.all([getDepartmentModel().init(),getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      const row = await createDepartment(input,session);
      await getAuditEventModel().create([{companyId:row.companyId,branchId:row.branchId,userId:context.userId,action:'CREATE',module:'empresas.departamentos',entityId:row.id,details:{code:row.code},ipAddress:context.ipAddress}],{session});
      return row;
    });
  } finally { await session.endSession(); }
}

const pageSchema=z.object({search:z.string().trim().max(100).default(''),status:z.enum(['ACTIVE','INACTIVE']).optional(),cursor:z.string().min(1).max(100).optional(),limit:z.coerce.number().int().min(1).max(50).default(20)}).strict();
export function parseDepartmentQuery(raw:unknown){const result=pageSchema.safeParse(raw);if(!result.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid department query',friendlyMessage:'Revisa la búsqueda y página de departamentos.',statusCode:400});return result.data;}
export async function pageDepartments(companyId:string,branchId:string,query:ReturnType<typeof parseDepartmentQuery>){
 const filter:Record<string,unknown>={companyId,branchId};if(query.status)filter.status=query.status;if(query.cursor)filter._id={$lt:query.cursor};
 if(query.search){const literal=query.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');filter.$or=[{name:{$regex:literal,$options:'i'}},{code:{$regex:literal,$options:'i'}}];}
 const rows=await getDepartmentModel().find(filter).sort({_id:-1}).limit(query.limit+1).lean().exec();return catalogSlice(rows,query.limit);
}
// Employee assignment and department deactivation write the same document within
// their transaction, preventing a new active assignment from racing the check.
export async function lockActiveDepartment(companyId:string,branchId:string,id:string,session?:ClientSession){
 const row=await getDepartmentModel().findOneAndUpdate({_id:id,companyId,branchId,status:'ACTIVE'},{$inc:{assignmentRevision:1}},{new:true,session}).lean().exec();
 if(!row)throw new AppError({code:'VALIDATION_ERROR',message:'Inactive or foreign department',friendlyMessage:'Selecciona un departamento activo de esta sucursal.',statusCode:400});
}
export type DepartmentEdit={name:string;code:string;status:'ACTIVE'|'INACTIVE'};
export async function updateAuditedDepartment(input:{companyId:string;branchId:string;id:string;name:string;code:string;status:'ACTIVE'|'INACTIVE';expected:DepartmentEdit},context:{userId:string;ipAddress?:string}){
 if(!context.userId.trim())throw new AppError({code:'UNAUTHORIZED',message:'Missing department actor',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
 const model=getDepartmentModel(),audit=getAuditEventModel();await Promise.all([model.init(),audit.init()]);const session=await mongoose.startSession();
 try{return await session.withTransaction(async()=>{
  if(input.status==='ACTIVE'&&!await getBranchModel().exists({_id:input.branchId,companyId:input.companyId,isActive:true}).session(session))throw new AppError({code:'VALIDATION_ERROR',message:'Inactive department branch',friendlyMessage:'La sucursal debe estar activa para activar este departamento.',statusCode:400});
  const values={name:input.name.trim(),code:input.code.trim().toUpperCase(),status:input.status};
  const row=await model.findOneAndUpdate({_id:input.id,companyId:input.companyId,branchId:input.branchId,...input.expected},{$set:values},{new:true,runValidators:true,session}).lean().exec();
  if(!row)throw new AppError({code:'CONFLICT',message:'Department changed',friendlyMessage:'El departamento cambió. Actualiza antes de editar.',statusCode:409});
  if(input.status==='INACTIVE'&&await getEmployeeModel().exists({companyId:input.companyId,branchId:input.branchId,departmentId:input.id,status:'ACTIVE'}).session(session))throw new AppError({code:'CONFLICT',message:'Active employees in department',friendlyMessage:'Reasigna o desactiva los empleados activos antes de desactivar el departamento.',statusCode:409});
  await audit.create([{companyId:input.companyId,branchId:input.branchId,userId:context.userId,action:'UPDATE',module:'empresas.departamentos',entityId:input.id,details:{previousCode:input.expected.code,code:values.code,previousStatus:input.expected.status,status:values.status,fields:['name','code','status'].filter(key=>values[key as keyof DepartmentEdit]!==input.expected[key as keyof DepartmentEdit])},ipAddress:context.ipAddress}],{session});
  return serialize(row as DepartmentDocument);
 });}catch(error){if(isDuplicateKey(error))throw new AppError({code:'CONFLICT',message:'Duplicate department code',friendlyMessage:'Ya existe un departamento con ese código en esta sucursal.',statusCode:409});throw error;}finally{await session.endSession();}
}
