import {useEffect,useRef,useState} from 'react';
import {ApiError} from './webApi';
import {ticketPage,type SupportTicket} from './ticketApi';
export function useTickets(base:string,token:string,co:string,br:string,onExpired?:()=>void){
 const [search,setSearch]=useState(''),[status,setStatus]=useState(''),[filter,setFilter]=useState({search:'',status:''}),[cursors,setCursors]=useState<Array<string|undefined>>([undefined]),[page,setPage]=useState<{items:SupportTicket[];nextCursor:string|null}>({items:[],nextCursor:null}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);const cursor=cursors[cursors.length-1];
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setPage({items:[],nextCursor:null});ticketPage(base,token,co,br,filter.search,filter.status,cursor,c.signal).then(p=>{if(!c.signal.aborted)setPage(p);}).catch(e=>{if(!c.signal.aborted){if(e instanceof ApiError&&e.status===401&&onExpired)onExpired();else setError(e instanceof Error?e.message:'No se pudo consultar.');}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[base,token,co,br,filter,cursor,revision,onExpired]);
 return {search,setSearch,status,setStatus,page,loading,error,pageNumber:cursors.length,apply:()=>{setFilter({search:search.trim(),status});setCursors([undefined]);setRevision(v=>v+1);},refresh:()=>{setCursors([undefined]);setRevision(v=>v+1);},previous:()=>setCursors(v=>v.length>1?v.slice(0,-1):v),next:()=>{if(page.nextCursor)setCursors(v=>[...v,page.nextCursor!]);}};
}
