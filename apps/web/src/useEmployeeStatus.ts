import {useEffect,useRef,useState} from 'react';
import {ApiError} from './webApi';
import {changeEmployeeStatus} from './employeeStatusApi';
import type {Employee} from './employeeApi';
export function useEmployeeStatus(base:string,token:string,employee:Employee,onSaved:()=>void,onExpired?:()=>void){
 const [busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 async function save(){if(controller.current||blocked)return;const current=new AbortController();controller.current=current;setBusy(true);setError('');
 try{await changeEmployeeStatus(base,token,employee,current.signal);if(alive.current&&!current.signal.aborted)onSaved();}
 catch(failure){if(alive.current&&!current.signal.aborted){if(failure instanceof ApiError&&failure.status===401&&onExpired)onExpired();else{setError(failure instanceof Error?failure.message:'No se pudo confirmar el estado. Actualiza antes de reintentar.');setBlocked(!(failure instanceof ApiError&&[400,403].includes(failure.status)));}}}
 finally{controller.current=null;if(alive.current)setBusy(false);}}
 return {busy,blocked,error,save};
}
