import {ApiError,requestData} from './api';
import type {Employee} from './employeeApi';
export async function changeEmployeeDepartment(base:string,token:string,original:Employee,departmentId:string,signal?:AbortSignal):Promise<Employee>{
 if(!/^[a-f0-9]{24}$/i.test(original.id)||!departmentId.trim()||departmentId.length>100||departmentId!==departmentId.trim()||departmentId===original.departmentId)throw new ApiError('Selecciona un departamento distinto del actual.',400);
 let raw:unknown;
 try{raw=await requestData(base,'/employees/'+original.id+'/department',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({departmentId,expectedDepartmentId:original.departmentId,expectedStatus:original.status}),signal});}
 catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('El empleado cambió. Actualiza antes de reasignar.',409);throw e;}
 if(!raw||typeof raw!=='object')throw new ApiError('No se pudo confirmar el departamento. Actualiza la lista.');
 const row=raw as Employee;if(row.departmentId!==departmentId||(['id','companyId','branchId','userId','fullName','position','status'] as const).some(key=>row[key]!==original[key]))throw new ApiError('No se pudo confirmar el departamento. Actualiza la lista.');return row;
}
