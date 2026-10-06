import {ApiError,requestData} from './api';
export type EmployeeOption={id:string;name:string;companyId:string;branchId:string;isActive?:boolean;status?:string};
export async function employeeOptions(base:string,token:string,companyId:string,branchId:string,kind:'users'|'departments',search:string,cursor:string|undefined,signal:AbortSignal,purpose:'create'|'edit'='create'){
 const q=new URLSearchParams({limit:'20',search:search.trim()});if(cursor)q.set('cursor',cursor);
 const raw:any=await requestData(base,(kind==='departments'&&purpose==='edit'?'/employees/department-options':'/employees/options/'+kind)+'?'+q,{headers:{Authorization:'Bearer '+token},signal});
 const invalid=()=>new ApiError('No se pudo validar el selector de empleados.');
 if(!raw||!Array.isArray(raw.items)||raw.items.length>20||!(raw.nextCursor===null||typeof raw.nextCursor==='string'))throw invalid();
 let previous=cursor;for(const r of raw.items){if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||(kind==='users'&&!/^[a-f0-9]{24}$/.test(r.id))||typeof r.name!=='string'||!r.name.trim()||r.companyId!==companyId||r.branchId!==branchId||(kind==='users'?r.isActive!==true:r.status!=='ACTIVE')||(previous&&r.id>=previous))throw invalid();previous=r.id;}
 if(raw.nextCursor!==null&&(raw.items.length!==20||raw.nextCursor!==raw.items[19]?.id))throw invalid();return raw as {items:EmployeeOption[];nextCursor:string|null};
}
export async function saveEmployee(base:string,token:string,companyId:string,branchId:string,input:{fullName:string;position:string;userId:string;departmentId:string}){
 const raw:any=await requestData(base,'/employees',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(input)});
 if(!raw||typeof raw.id!=='string'||!/^[a-f0-9]{24}$/.test(raw.id)||raw.companyId!==companyId||raw.branchId!==branchId||raw.status!=='ACTIVE'||Object.entries(input).some(([key,value])=>raw[key]!==value))throw new ApiError('No se pudo confirmar el alta. Revisa la lista de empleados antes de volver a guardar.');return raw;
}
