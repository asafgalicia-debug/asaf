import {useEffect,useRef,useState} from 'react';
import {ApiError} from './api';
import {noticePage,readNotice,type Notice,type NoticePage} from './notificationApi';
export function useNotifications(base:string,token:string,companyId:string,branchId:string,onExpired?:()=>void,userId?:string){
 const [status,setStatus]=useState(''),[cursors,setCursors]=useState<Array<string|undefined>>([undefined]),[page,setPage]=useState<NoticePage>({items:[],nextCursor:null}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false);
 const writer=useRef<AbortController|null>(null);const cursor=cursors[cursors.length-1];
 useEffect(()=>()=>{writer.current?.abort();},[base,token,companyId,branchId,userId]);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setBlocked(false);setPage({items:[],nextCursor:null});
 noticePage(base,token,companyId,branchId,status,cursor,c.signal,userId).then(data=>{if(!c.signal.aborted)setPage(data);}).catch(e=>{if(!c.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else setError(e instanceof Error?e.message:'No se pudo consultar avisos.');}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[base,token,companyId,branchId,userId,status,cursor,revision,onExpired]);
 function refresh(){setCursors([undefined]);setRevision(x=>x+1);}
 async function mark(row:Notice){if(writer.current||loading||blocked)return;const c=new AbortController();writer.current=c;setBusy(true);setError('');
 try{await readNotice(base,token,row,c.signal);if(!c.signal.aborted)refresh();}catch(e){if(!c.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else{setError(e instanceof Error?e.message:'No se pudo confirmar la lectura. Actualiza.');setBlocked(true);}}}finally{writer.current=null;if(!c.signal.aborted)setBusy(false);}}
 return {status,page,loading,error,busy,blocked,pageNumber:cursors.length,mark,refresh,filter:(value:string)=>{setStatus(value);setCursors([undefined]);},previous:()=>setCursors(c=>c.length>1?c.slice(0,-1):c),next:()=>{if(page.nextCursor)setCursors(c=>[...c,page.nextCursor!]);}};
}
