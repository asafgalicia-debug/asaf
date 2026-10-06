import {ApiError,requestData} from './api';
export type Department={id:string;companyId:string;branchId:string;name:string;code:string;status:'ACTIVE'|'INACTIVE'};
function valid(raw:unknown,co:string,br:string):raw is Department{if(!raw||typeof raw!=='object')return false;const d=raw as Department;return typeof d.id==='string'&&!!d.id.trim()&&d.id.length<=100&&d.companyId===co&&d.branchId===br&&typeof d.name==='string'&&!!d.name.trim()&&d.name.length<=120&&typeof d.code==='string'&&!!d.code.trim()&&d.code.length<=32&&d.code===d.code.toUpperCase()&&['ACTIVE','INACTIVE'].includes(d.status);}
export async function departmentPage(base:string,token:string,co:string,br:string,search:string,status:string,cursor?:string,signal?:AbortSignal){
 const q=new URLSearchParams({limit:'20',search:search.trim()});if(status)q.set('status',status);if(cursor)q.set('cursor',cursor);
 const raw=await requestData(base,'/departments/page?'+q,{headers:{Authorization:'Bearer '+token},signal});const invalid=()=>new ApiError('No se pudo confirmar la lista de departamentos.');
 if(!raw||typeof raw!=='object')throw invalid();const p=raw as {items:Department[];nextCursor:string|null};
 if(!Array.isArray(p.items)||p.items.length>20||!(p.nextCursor===null||typeof p.nextCursor==='string'))throw invalid();let previous=cursor;
 for(const row of p.items){if(!valid(row,co,br)||(status&&row.status!==status)||(previous&&row.id>=previous))throw invalid();previous=row.id;}
 if(p.nextCursor!==null&&(p.items.length!==20||p.nextCursor!==p.items[19].id))throw invalid();return p;
}
export async function editDepartment(base:string,token:string,original:Department,name:string,code:string,status:Department['status'],signal?:AbortSignal){
 const input={name:name.trim(),code:code.trim().toUpperCase(),status};if(!input.name||input.name.length>120||!input.code||input.code.length>32||!['ACTIVE','INACTIVE'].includes(status))throw new ApiError('Revisa nombre, código y estado.',400);
 let raw:unknown;try{raw=await requestData(base,'/departments/'+encodeURIComponent(original.id),{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...input,expected:{name:original.name,code:original.code,status:original.status}}),signal});}
 catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('No se pudo guardar: el departamento cambió, el código ya existe o tiene empleados activos. Actualiza y revisa antes de desactivarlo.',409);throw e;}
 if(!valid(raw,original.companyId,original.branchId)||raw.id!==original.id||raw.name!==input.name||raw.code!==input.code||raw.status!==input.status)throw new ApiError('No se pudo confirmar el departamento. Actualiza antes de reintentar.');return raw;
}
