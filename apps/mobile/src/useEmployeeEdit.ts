import {useEffect,useRef,useState} from 'react';
import {ApiError} from './api';
import {editEmployee} from './employeeEditApi';
import type {Employee} from './employeeApi';
export function useEmployeeEdit(base:string,token:string,employee:Employee,onSaved:()=>void,onExpired?:()=>void){
 const original=useRef({...employee}).current;const [fullName,setFullName]=useState(original.fullName),[position,setPosition]=useState(original.position),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const ready=!busy&&!blocked&&fullName.trim().length>=2&&fullName.trim().length<=120&&position.trim().length>=2&&position.trim().length<=100&&(fullName.trim()!==original.fullName||position.trim()!==original.position);
 async function save(){if(!ready||lock.current)return;lock.current=true;setBusy(true);setError('');try{await editEmployee(base,token,original,fullName,position);if(alive.current)onSaved();}catch(e){if(alive.current){if(e instanceof ApiError&&e.status===401)onExpired?.();setBlocked(!(e instanceof ApiError&&e.status===400));setError(e instanceof Error?e.message:'No se pudo confirmar la edición. Actualiza la lista antes de reintentar.');}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return {fullName,setFullName,position,setPosition,busy,blocked,error,ready,save};
}
