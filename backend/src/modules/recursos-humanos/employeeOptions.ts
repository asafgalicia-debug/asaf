import {z} from 'zod';
import {AppError} from '../../errors/AppError.js';
import {getUserModel} from '../usuarios/models/User.js';
import {getDepartmentModel} from '../empresas/models/Department.js';
import {catalogSlice} from '../../core/catalogPagination.js';
const schema=z.object({search:z.string().trim().max(100).default(''),limit:z.coerce.number().int().min(1).max(50).default(20),cursor:z.string().trim().min(1).max(100).optional()}).strict();
export function parseEmployeeOptionQuery(raw:unknown,kind:'users'|'departments'){
 const parsed=schema.safeParse(raw);if(!parsed.success||(kind==='users'&&parsed.data.cursor&&!/^[a-f0-9]{24}$/i.test(parsed.data.cursor)))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid employee selector query',friendlyMessage:'Revisa la búsqueda y página del selector.',statusCode:400});return parsed.data;
}
export async function pageEmployeeOptions(companyId:string,branchId:string,kind:'users'|'departments',query:ReturnType<typeof parseEmployeeOptionQuery>){
 const filter:Record<string,unknown>={companyId,branchId,...(kind==='users'?{isActive:true}:{status:'ACTIVE'})};if(query.cursor)filter._id={$lt:query.cursor};
 if(query.search)filter.name={$regex:query.search.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'};
 const fields='name companyId branchId '+(kind==='users'?'isActive':'status');
 const rows=kind==='users'?await getUserModel().find(filter).select(fields).sort({_id:-1}).limit(query.limit+1).lean().exec():await getDepartmentModel().find(filter).select(fields).sort({_id:-1}).limit(query.limit+1).lean().exec();
 return catalogSlice(rows.map(row=>({_id:row._id,name:row.name,companyId:row.companyId,branchId:row.branchId,...(kind==='users'?{isActive:true}:{status:'ACTIVE' as const})})),query.limit);
}
