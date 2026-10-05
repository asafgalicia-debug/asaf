import {useEffect,useState} from 'react';
import {ApiError} from './webApi';
import {employeePage,type EmployeePage} from './employeeApi';
export function useEmployees(base:string,token:string,companyId:string,branchId:string,onExpired?:()=>void){
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[filter,setFilter]=useState({search:'',status:''}),[cursors,setCursors]=useState<Array<string|undefined>>([undefined]),[page,setPage]=useState<EmployeePage>({items:[],nextCursor:null}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const cursor=cursors[cursors.length-1];
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');setPage({items:[],nextCursor:null});employeePage(base,token,companyId,branchId,{...filter,cursor},controller.signal).then(result=>{if(!controller.signal.aborted)setPage(result);}).catch(e=>{if(!controller.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else setError(e instanceof Error?e.message:'No se pudo consultar empleados.');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[base,token,companyId,branchId,filter,cursor,revision,onExpired]);
 return {search,setSearch,status,setStatus,page,loading,error,pageNumber:cursors.length,apply:()=>{setFilter({search:search.trim(),status});setCursors([undefined]);},previous:()=>setCursors(c=>c.slice(0,-1)),next:()=>{if(page.nextCursor)setCursors(c=>[...c,page.nextCursor!]);},refresh:()=>{setCursors([undefined]);setRevision(r=>r+1);}};
}
