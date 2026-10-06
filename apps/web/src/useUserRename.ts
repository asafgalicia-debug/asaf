import {useEffect,useRef,useState} from 'react';
import {ApiError} from './webApi';
import {renameUser} from './userRenameApi';
import type {DirectoryUser} from './userDirectoryApi';
export function useUserRename(base:string,token:string,row:DirectoryUser,onSaved:()=>void,onExpired?:()=>void){const [original]=useState(()=>({...row,permissions:[...row.permissions]})),[name,setName]=useState(row.name),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');const lock=useRef(false),alive=useRef(true),controller=useRef<AbortController|null>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 const ready=!busy&&!blocked&&name.trim().length>=2&&name.trim().length<=100&&name.trim()!==original.name;
 async function save(){if(!ready||lock.current)return;lock.current=true;controller.current=new AbortController();setBusy(true);setError('');try{await renameUser(base,token,original,name,controller.current.signal);if(alive.current)onSaved();}catch(e){if(alive.current){if(e instanceof ApiError&&e.status===401)onExpired?.();setBlocked(!(e instanceof ApiError&&e.status===400));setError(e instanceof Error?e.message:'No se pudo confirmar. Actualiza la lista.');}}finally{controller.current=null;lock.current=false;if(alive.current)setBusy(false);}}
 return {name,setName,busy,blocked,error,ready,save};}
