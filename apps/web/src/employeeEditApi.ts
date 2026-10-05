import {ApiError,requestData} from './webApi';
import type {Employee} from './employeeApi';
export async function editEmployee(base:string,token:string,original:Employee,fullName:string,position:string):Promise<Employee>{
 const values={fullName:fullName.trim(),position:position.trim()};
 if(values.fullName.length<2||values.fullName.length>120||values.position.length<2||values.position.length>100)throw new ApiError('Revisa nombre y puesto.',400);
 let raw:any;try{raw=await requestData(base,'/employees/'+encodeURIComponent(original.id),{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...values,expected:{fullName:original.fullName,position:original.position}})});}catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('El empleado cambió o ya no está disponible. Cierra la edición y actualiza la lista.',409);throw e;}
 if(!raw||raw.id!==original.id||raw.companyId!==original.companyId||raw.branchId!==original.branchId||raw.userId!==original.userId||raw.departmentId!==original.departmentId||raw.status!==original.status||raw.fullName!==values.fullName||raw.position!==values.position)throw new ApiError('No se pudo confirmar la edición. Actualiza la lista antes de reintentar.');return raw;
}
