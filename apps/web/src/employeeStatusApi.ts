import {ApiError,requestData} from './webApi';
import type {Employee} from './employeeApi';
export async function changeEmployeeStatus(base:string,token:string,original:Employee,signal?:AbortSignal):Promise<Employee>{
 if(!/^[a-f0-9]{24}$/i.test(original.id)||!['ACTIVE','INACTIVE'].includes(original.status))throw new ApiError('Selecciona un empleado válido.',400);
 const status=original.status==='ACTIVE'?'INACTIVE':'ACTIVE';
 let raw:unknown;
 try{raw=await requestData(base,'/employees/'+encodeURIComponent(original.id)+'/status',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({status,expectedStatus:original.status}),signal});}
 catch(error){if(error instanceof ApiError&&error.status===409)throw new ApiError('El estado cambió o el empleado ya no está disponible. Actualiza la lista.',409);throw error;}
 if(!raw||typeof raw!=='object')throw new ApiError('No se pudo confirmar el estado. Actualiza la lista antes de reintentar.');
 const row=raw as Employee;
 if(row.status!==status||(['id','companyId','branchId','userId','departmentId','fullName','position'] as const).some(key=>row[key]!==original[key]))throw new ApiError('No se pudo confirmar el estado. Actualiza la lista antes de reintentar.');
 return row;
}
