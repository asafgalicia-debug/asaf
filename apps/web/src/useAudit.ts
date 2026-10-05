import {useEffect,useState} from 'react';
import {ApiError} from './webApi';
import {auditPage,type AuditPage} from './auditApi';
export function useAudit(base:string,token:string,companyId:string,branchId:string,onExpired?:()=>void){
 const [module,setModule]=useState(''),[action,setAction]=useState(''),[filter,setFilter]=useState({module:'',action:''}),[cursors,setCursors]=useState<Array<string|undefined>>([undefined]),[page,setPage]=useState<AuditPage>({items:[],nextCursor:null}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const cursor=cursors[cursors.length-1];
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setPage({items:[],nextCursor:null});auditPage(base,token,companyId,branchId,{...filter,cursor},controller.signal).then(result=>{if(!controller.signal.aborted)setPage(result);}).catch(e=>{if(!controller.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else setError(e instanceof Error?e.message:'No se pudo consultar auditoría.');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[base,token,companyId,branchId,filter,cursor,revision,onExpired]);
 return {module,setModule,action,setAction,page,loading,error,pageNumber:cursors.length,apply:()=>{setFilter({module:module.trim(),action});setCursors([undefined]);},previous:()=>setCursors(c=>c.slice(0,-1)),next:()=>{if(page.nextCursor)setCursors(c=>[...c,page.nextCursor!]);},refresh:()=>{setCursors([undefined]);setRevision(r=>r+1);}};
}
