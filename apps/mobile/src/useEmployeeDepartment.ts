import {useEffect,useRef,useState} from 'react';
import {ApiError} from './api';
import {useEmployeeOptions} from './useEmployeeCreation';
import {changeEmployeeDepartment} from './employeeDepartmentApi';
import type {Employee} from './employeeApi';
export function useEmployeeDepartment(base:string,token:string,employee:Employee,onSaved:()=>void,onExpired?:()=>void){
 const [original]=useState(()=>({...employee}));const options=useEmployeeOptions(base,token,original.companyId,original.branchId,'departments',onExpired,'edit');
 const [busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');const controller=useRef<AbortController|null>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 const ready=!busy&&!blocked&&!options.loading&&!options.error&&!!options.selected&&options.selected.id!==original.departmentId;
 async function save(){if(!ready||controller.current)return;const c=new AbortController();controller.current=c;setBusy(true);setError('');
 try{await changeEmployeeDepartment(base,token,original,options.selected!.id,c.signal);if(alive.current&&!c.signal.aborted)onSaved();}
 catch(e){if(alive.current&&!c.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else{setError(e instanceof Error?e.message:'No se pudo confirmar. Actualiza la lista.');setBlocked(!(e instanceof ApiError&&[400,403].includes(e.status)));}}}
 finally{controller.current=null;if(alive.current)setBusy(false);}}
 return {options,busy,blocked,error,ready,save,original};
}
