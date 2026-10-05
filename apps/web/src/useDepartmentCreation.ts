import {useEffect,useRef,useState} from 'react';
import {ApiError} from './webApi';
import {saveDepartment,type CreatedDepartment} from './departmentCreationApi';
export function useDepartmentCreation(base:string,token:string,companyId:string,branchId:string,onCreated:(row:CreatedDepartment)=>void,onExpired?:()=>void){
 const [name,setName]=useState(''),[code,setCode]=useState(''),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[message,setMessage]=useState('');const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const ready=!busy&&!blocked&&!!name.trim()&&name.trim().length<=120&&!!code.trim()&&code.trim().length<=32;
 async function save(){if(!ready||lock.current)return;lock.current=true;setBusy(true);setMessage('');try{const row=await saveDepartment(base,token,companyId,branchId,name,code);if(alive.current){setName('');setCode('');setMessage('Departamento creado y seleccionado.');onCreated(row);}}catch(e){if(alive.current){if(e instanceof ApiError&&e.status===401)onExpired?.();const known=e instanceof ApiError&&[400,401,403,409].includes(e.status);setBlocked(!known);setMessage(known?(e as Error).message:'No se pudo confirmar el departamento. Revisa el selector antes de volver a guardar.');}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return {name,setName,code,setCode,busy,blocked,message,ready,save};
}
