import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ApiError } from './api';
import { CodeEditor } from './CodeEditor';
import { NameEditor } from './NameEditor';
import { StatusEditor } from './StatusEditor';
import { warehousePageRequest, type WarehouseEntry } from './inventoryApi';
export function WarehouseDirectory({ base, token, disabled, accent, canCreate, onBusy, onChanged, onExpired }: { base:string; token:string; disabled:boolean; accent:string; canCreate:boolean; onBusy:(busy:boolean)=>void; onChanged:()=>void; onExpired:()=>void }) {
 const [search,setSearch]=useState(''),[applied,setApplied]=useState(''),[cursors,setCursors]=useState(['']),[next,setNext]=useState<string|null>(null),[rows,setRows]=useState<WarehouseEntry[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[revision,setRevision]=useState(0);
 const cursor=cursors[cursors.length-1];
 useEffect(()=>{const controller=new AbortController();setLoading(true);setRows([]);setNext(null);setError('');warehousePageRequest(base,token,controller.signal,applied,cursor).then(page=>{if(!controller.signal.aborted){setRows(page.items);setNext(page.nextCursor);}}).catch(failure=>{if(!controller.signal.aborted){if(failure instanceof ApiError&&failure.status===401)onExpired();else setError(failure instanceof Error?failure.message:'No se pudo consultar.');}}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[base,token,applied,cursor,revision,onExpired]);
 const locked=disabled||loading;
 function action(label:string,blocked:boolean,fn:()=>void){return <Pressable accessibilityRole="button" disabled={blocked} onPress={fn}><Text style={{color:blocked?'#718096':accent,paddingVertical:12}}>{label}</Text></Pressable>;}
 return <View>
 <Text style={{color:'#F1F5F9',fontWeight:'700',marginTop:12}}>Almacenes de la sucursal</Text>
 <TextInput accessibilityLabel="Buscar almacenes" maxLength={100} editable={!disabled} value={search} onChangeText={setSearch} placeholder="Buscar nombre o código" placeholderTextColor="#8B99A8" style={{backgroundColor:'#0B1119',color:'#F1F5F9',padding:12,borderRadius:12,marginVertical:8}}/>
 <View style={{flexDirection:'row',justifyContent:'space-between'}}>{action('Buscar',locked,()=>{setApplied(search.trim());setCursors(['']);setRevision(v=>v+1);})}{action('Ver todos',locked,()=>{setSearch('');setApplied('');setCursors(['']);setRevision(v=>v+1);})}</View>
 {loading?<Text style={{color:'#8B99A8'}}>Consultando…</Text>:error?<><Text accessibilityRole="alert" style={{color:'#F87171'}}>{error}</Text>{action('Reintentar',disabled,()=>setRevision(v=>v+1))}</>:<>
 <Text style={{color:'#8B99A8',fontSize:12}}>Página {cursors.length} · {rows.length} registros</Text>
 {!rows.length?<Text style={{color:'#8B99A8'}}>No hay registros para esta búsqueda.</Text>:null}
 {rows.map(row=><View key={row.id} style={{paddingVertical:10}}><Text style={{color:'#8B99A8'}}>{row.name} · {row.code} · {row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</Text>{canCreate ? <><NameEditor base={base} token={token} kind="warehouses" entry={row} accent={accent} disabled={disabled || loading} onBusy={onBusy} onExpired={onExpired} onSaved={(name)=>{setRows(v=>v.map(item=>item.id===row.id?{...item,name}:item));onChanged();}}/><CodeEditor base={base} token={token} kind="warehouses" entry={row} accent={accent} disabled={disabled || loading} onBusy={onBusy} onExpired={onExpired} onSaved={(code)=>{setRows(v=>v.map(item=>item.id===row.id?{...item,code}:item));onChanged();}}/><StatusEditor base={base} token={token} kind="warehouses" entry={row} accent={accent} disabled={disabled || loading} onBusy={onBusy} onExpired={onExpired} onSaved={(status)=>{setRows(v=>v.map(item=>item.id===row.id?{...item,status}:item));onChanged();}}/></> : null}</View>)}
 <View style={{flexDirection:'row',justifyContent:'space-between'}}>{action('Anterior',locked||cursors.length===1,()=>setCursors(v=>v.slice(0,-1)))}{action('Siguiente',locked||!next,()=>{if(next)setCursors(v=>[...v,next]);})}</View></>}
 </View>;
}
