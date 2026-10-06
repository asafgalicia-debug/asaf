import {ApiError,requestData} from './api';
export type Employee={id:string;companyId:string;branchId:string;fullName:string;position:string;departmentId:string;userId:string;status:'ACTIVE'|'INACTIVE'};
export type EmployeePage={items:Employee[];nextCursor:string|null};
export async function employeePage(base:string,token:string,companyId:string,branchId:string,query:{search:string;status:string;cursor?:string},signal:AbortSignal):Promise<EmployeePage>{
 const params=new URLSearchParams({limit:'20',search:query.search.trim()});if(query.status)params.set('status',query.status);if(query.cursor)params.set('cursor',query.cursor);
 const raw=await requestData(base,'/employees/page?'+params,{headers:{Authorization:'Bearer '+token},signal});const invalid=()=>new ApiError('La API devolvió una página de empleados inesperada.');
 if(!raw||typeof raw!=='object')throw invalid();const page=raw as EmployeePage;if(!Array.isArray(page.items)||page.items.length>20||!(page.nextCursor===null||typeof page.nextCursor==='string'))throw invalid();
 let previous=query.cursor?.toLowerCase();for(const row of page.items){if(!row||typeof row.id!=='string'||!/^[a-f0-9]{24}$/i.test(row.id)||row.companyId!==companyId||row.branchId!==branchId||!['ACTIVE','INACTIVE'].includes(row.status)||(query.status&&row.status!==query.status)||!['fullName','position','departmentId','userId'].every(key=>typeof row[key as keyof Employee]==='string'&&String(row[key as keyof Employee]).trim()))throw invalid();const id=row.id.toLowerCase();if(previous&&id>=previous)throw invalid();previous=id;}
 if(page.nextCursor!==null&&(page.items.length!==20||page.nextCursor!==page.items[19]?.id))throw invalid();return page;
}
