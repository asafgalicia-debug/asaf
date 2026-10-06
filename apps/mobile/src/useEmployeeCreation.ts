import {useEffect,useRef,useState} from 'react';
import {ApiError} from './api';
import {employeeOptions,saveEmployee,type EmployeeOption} from './employeeCreationApi';
export function useEmployeeOptions(base:string,token:string,companyId:string,branchId:string,kind:'users'|'departments',onExpired?:()=>void,purpose:'create'|'edit'='create'){
 const [search,setSearch]=useState(''),[query,setQuery]=useState(''),[cursors,setCursors]=useState<Array<string|undefined>>([undefined]),[items,setItems]=useState<EmployeeOption[]>([]),[nextCursor,setNext]=useState<string|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState<EmployeeOption|null>(null),[revision,setRevision]=useState(0);
 const cursor=cursors[cursors.length-1];
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setItems([]);setNext(null);employeeOptions(base,token,companyId,branchId,kind,query,cursor,c.signal,purpose).then(p=>{if(!c.signal.aborted){setItems(p.items);setNext(p.nextCursor);}}).catch(e=>{if(!c.signal.aborted){if(e instanceof ApiError&&e.status===401)onExpired?.();setError(e instanceof Error?e.message:'No se pudo consultar el selector.');}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[base,token,companyId,branchId,kind,query,cursor,revision,onExpired,purpose]);
 return {search,setSearch,items,loading,error,selected,setSelected,page:cursors.length,apply:()=>{setQuery(search.trim());setCursors([undefined]);setRevision(r=>r+1);},previous:()=>setCursors(c=>c.slice(0,-1)),next:()=>{if(nextCursor)setCursors(c=>[...c,nextCursor]);},hasNext:!!nextCursor};
}
export function useEmployeeCreation(base:string,token:string,companyId:string,branchId:string,onSaved:()=>void,onExpired?:()=>void){
 const users=useEmployeeOptions(base,token,companyId,branchId,'users',onExpired),departments=useEmployeeOptions(base,token,companyId,branchId,'departments',onExpired);
 const [fullName,setFullName]=useState(''),[position,setPosition]=useState(''),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[message,setMessage]=useState('');const lock=useRef(false),alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const input={fullName:fullName.trim(),position:position.trim(),userId:users.selected?.id??'',departmentId:departments.selected?.id??''};
 const ready=!busy&&!blocked&&input.fullName.length>=2&&input.fullName.length<=120&&input.position.length>=2&&input.position.length<=100&&!!input.userId&&!!input.departmentId;
 async function save(){if(!ready||lock.current)return;lock.current=true;setBusy(true);setMessage('');try{await saveEmployee(base,token,companyId,branchId,input);if(alive.current){setFullName('');setPosition('');users.setSelected(null);departments.setSelected(null);setMessage('Empleado creado correctamente.');onSaved();}}catch(e){if(alive.current){if(e instanceof ApiError&&e.status===401)onExpired?.();const known=e instanceof ApiError&&[400,401,403,409].includes(e.status);setBlocked(!known);setMessage(known?(e as Error).message:'No se pudo confirmar el alta. Revisa la lista de empleados antes de intentar otra alta.');}}finally{lock.current=false;if(alive.current)setBusy(false);}}
 return {users,departments,fullName,setFullName,position,setPosition,busy,blocked,message,ready,save};
}
