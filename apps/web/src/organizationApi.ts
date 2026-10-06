import {ApiError,requestData} from './webApi';
import type {ExportDocument} from './exportDocument';
export type CompanyInfo={id:string;name:string;taxId:string;status:'ACTIVE'|'INACTIVE';updatedAt:string};
export type BranchInfo={id:string;companyId:string;name:string;code:string;city:string;isActive:boolean;updatedAt:string};
export type BranchDraft={name:string;code:string;city:string};
export const validBranch=(d:BranchDraft)=>d.name.trim().length>=2&&d.name.trim().length<=120&&d.code.trim().length>=2&&d.code.trim().length<=32&&d.city.trim().length>=2&&d.city.trim().length<=120;
const timestamp=(v:unknown)=>typeof v==='string'&&Number.isFinite(Date.parse(v));
const companyValid=(r:any,co:string)=>r&&r.id===co&&typeof r.name==='string'&&typeof r.taxId==='string'&&['ACTIVE','INACTIVE'].includes(r.status)&&timestamp(r.updatedAt);
const branchValid=(r:any,co:string)=>r&&typeof r.id==='string'&&r.id.length>0&&r.companyId===co&&typeof r.name==='string'&&typeof r.code==='string'&&typeof r.city==='string'&&typeof r.isActive==='boolean'&&timestamp(r.updatedAt);
export async function loadCompany(base:string,token:string,co:string,signal?:AbortSignal):Promise<CompanyInfo>{const r:any=await requestData(base,'/companies/current',{headers:{Authorization:'Bearer '+token},signal});if(!companyValid(r,co))throw new ApiError('No se pudo confirmar la empresa.');return r;}
export async function loadBranches(base:string,token:string,co:string,page:number,search:string,signal?:AbortSignal):Promise<{items:BranchInfo[];page:number;limit:number;total:number;totalPages:number}>{
 const r:any=await requestData(base,'/branches/page?page='+page+'&limit=20&search='+encodeURIComponent(search.trim()),{headers:{Authorization:'Bearer '+token},signal});
 if(!r||r.page!==page||r.limit!==20||!Number.isSafeInteger(r.total)||r.total<0||r.totalPages!==Math.max(1,Math.ceil(r.total/20))||!Array.isArray(r.items)||r.items.length>20||r.items.length>r.total||r.items.some((v:any)=>!branchValid(v,co))||new Set(r.items.map((v:any)=>v.id)).size!==r.items.length)throw new ApiError('No se pudo confirmar la página de sucursales.');return r;
}
export async function saveCompany(base:string,token:string,original:CompanyInfo,name:string,taxId:string,signal?:AbortSignal):Promise<CompanyInfo>{
 if(name.trim().length<2||name.trim().length>160||taxId.trim().length<3||taxId.trim().length>32||original.status!=='ACTIVE')throw new ApiError('Revisa el nombre y el identificador fiscal.',400);
 const body={name:name.trim(),taxId:taxId.trim().toUpperCase(),expectedUpdatedAt:original.updatedAt};
 const r:any=await requestData(base,'/companies/current',{method:'PATCH',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 if(!companyValid(r,original.id)||r.name!==body.name||r.taxId!==body.taxId||r.status!==original.status||Date.parse(r.updatedAt)<=Date.parse(original.updatedAt))throw new ApiError('No se pudo confirmar el cambio. Actualiza antes de reintentar.');return r;
}
export async function saveBranch(base:string,token:string,co:string,draft:BranchDraft,original?:BranchInfo,signal?:AbortSignal):Promise<BranchInfo>{
 if(!validBranch(draft)||(original&&(original.companyId!==co||!original.isActive)))throw new ApiError('Revisa los datos de la sucursal.',400);
 const body={name:draft.name.trim(),code:draft.code.trim().toUpperCase(),city:draft.city.trim(),...(original?{expectedUpdatedAt:original.updatedAt}:{})};
 const r:any=await requestData(base,'/branches'+(original?'/'+encodeURIComponent(original.id):''),{method:original?'PATCH':'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body),signal});
 if(!branchValid(r,co)||r.name!==body.name||r.code!==body.code||r.city!==body.city||!r.isActive||(original&&(r.id!==original.id||Date.parse(r.updatedAt)<=Date.parse(original.updatedAt))))throw new ApiError('No se pudo confirmar la sucursal. Actualiza antes de reintentar.');return r;
}
export function companyDocument(r:CompanyInfo):ExportDocument{return {title:'Empresa: '+r.name,company:r.id,note:'Datos administrativos. No acredita validación fiscal.',columns:['Nombre','Identificador fiscal','Estado'],rows:[[r.name,r.taxId,r.status]]};}
export function branchDocument(r:BranchInfo):ExportDocument{return {title:'Sucursal: '+r.name,company:r.companyId,branch:r.id,note:'Datos administrativos; no cambia la sucursal de la sesión.',columns:['Nombre','Código','Ciudad','Estado'],rows:[[r.name,r.code,r.city,r.isActive?'Activa':'Inactiva']]};}
