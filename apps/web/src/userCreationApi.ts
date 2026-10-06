import {ApiError,requestData} from './webApi';
export type AssignableRole={id:string;name:string;description:string;permissions:string[];companyId?:string;isSystem?:boolean;updatedAt?:string};
export function validUserDraft(name:string,email:string,password:string){const bytes=Array.from(password).reduce((n,c)=>{const v=c.codePointAt(0)!;return n+(v<=127?1:v<=2047?2:v<=65535?3:4);},0);return name.trim().length>=2&&name.trim().length<=100&&email.trim().length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())&&password.length>=12&&password.length<=72&&bytes<=72;}
export async function assignableRoles(base:string,token:string,companyId:string,permissions:string[],signal?:AbortSignal){
 const raw=await requestData(base,'/roles',{headers:{Authorization:'Bearer '+token},signal});const fail=()=>new ApiError('No se pudo confirmar la lista de roles.');
 if(!Array.isArray(raw)||raw.length>1000)throw fail();const seen=new Set<string>();const actor=new Set(permissions);
 for(const r of raw){if(!r||typeof r.id!=='string'||!r.id||r.id.length>100||seen.has(r.id)||typeof r.name!=='string'||!r.name.trim()||typeof r.description!=='string'||!Array.isArray(r.permissions)||r.permissions.some((p:unknown)=>typeof p!=='string')||(r.companyId!==undefined&&r.companyId!==companyId)||(!r.isSystem&&r.companyId!==companyId))throw fail();seen.add(r.id);}
 return (raw as AssignableRole[]).filter(r=>r.permissions.every(p=>actor.has(p)));
}
export async function saveUser(base:string,token:string,co:string,br:string,input:{name:string;email:string;password:string},role:AssignableRole,permissions:string[],signal?:AbortSignal){
 if(!validUserDraft(input.name,input.email,input.password))throw new ApiError('Revisa nombre, correo y contraseña de 12 caracteres como mínimo (máximo 72 bytes).',400);
 if(!role.id||role.permissions.some(p=>!permissions.includes(p))||(role.companyId!==undefined&&role.companyId!==co))throw new ApiError('Selecciona un rol que puedas asignar.',403);
 const body={name:input.name.trim(),email:input.email.trim().toLowerCase(),password:input.password,roleId:role.id};let raw:any;
 try{raw=await requestData(base,'/users',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal});}catch(e){if(e instanceof ApiError&&e.status===409)throw new ApiError('Ya existe una cuenta con ese correo.',409);throw e;}
 if(!raw||typeof raw.id!=='string'||!/^[a-f0-9]{24}$/i.test(raw.id)||raw.name!==body.name||raw.email!==body.email||raw.companyId!==co||raw.branchId!==br||raw.roleId!==role.id||raw.isActive!==true||!Array.isArray(raw.permissions)||raw.permissions.length!==role.permissions.length||raw.permissions.some((p:unknown)=>!role.permissions.includes(String(p)))||Object.keys(raw).some(k=>/password|verificationHash/i.test(k)))throw new ApiError('No se pudo confirmar el alta. Consulta la lista antes de volver a crear la cuenta.');return raw;
}
