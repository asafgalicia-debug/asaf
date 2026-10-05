import {ApiError,requestData} from './webApi';
export type CreatedDepartment={id:string;name:string;code:string;companyId:string;branchId:string;status:'ACTIVE'};
export async function saveDepartment(base:string,token:string,companyId:string,branchId:string,name:string,code:string):Promise<CreatedDepartment>{
 const input={name:name.trim(),code:code.trim().toUpperCase()};
 if(!input.name||input.name.length>120||!input.code||input.code.length>32)throw new ApiError('Indica un nombre y código válidos.',400);
 let raw:any;try{raw=await requestData(base,'/departments',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(input)});}catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('Ya existe un departamento con ese código en esta sucursal.',409);throw e;}
 if(!raw||typeof raw.id!=='string'||!/^department-[a-f0-9-]{36}$/.test(raw.id)||raw.companyId!==companyId||raw.branchId!==branchId||raw.status!=='ACTIVE'||raw.name!==input.name||raw.code!==input.code)throw new ApiError('No se pudo confirmar el departamento. Revisa el selector antes de volver a guardar.');return raw;
}
