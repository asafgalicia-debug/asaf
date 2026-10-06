import {ApiError,requestData} from './api';
import type {DirectoryUser} from './userDirectoryApi';
export async function renameUser(base:string,token:string,original:DirectoryUser,name:string,signal?:AbortSignal):Promise<DirectoryUser>{
 const value=name.trim();if(value.length<2||value.length>100||value===original.name)throw new ApiError('Indica un nombre distinto de entre 2 y 100 caracteres.',400);
 let raw:any;try{raw=await requestData(base,'/users/'+encodeURIComponent(original.id)+'/name',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({name:value,expectedName:original.name}),signal});}catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('El usuario cambió o ya no está disponible. Cierra y actualiza la lista.',409);throw e;}
 if(!raw||raw.id!==original.id||raw.companyId!==original.companyId||raw.branchId!==original.branchId||raw.name!==value||raw.email!==original.email||raw.roleId!==original.roleId||raw.isActive!==original.isActive||!Array.isArray(raw.permissions)||JSON.stringify([...raw.permissions].sort())!==JSON.stringify([...original.permissions].sort())||Object.keys(raw).some(k=>/password|verificationHash/i.test(k)))throw new ApiError('No se pudo confirmar la edición. Consulta la lista antes de reintentar.');return raw;
}
