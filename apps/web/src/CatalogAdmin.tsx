import {useEffect,useRef,useState} from 'react';
import {AdminSelector} from './AdminSelector';
import {renameCatalogEntry,updateCatalogStatus,type RenameKind} from './catalogAdminApi';
import {updateCatalogCode} from './codeApi';
import type {WarehouseEntry} from './inventoryApi';
export function CatalogAdmin({apiUrl,token,kind,canEdit,disabled=false,onChanged}:{apiUrl:string;token:string;kind:RenameKind;canEdit:boolean;disabled?:boolean;onChanged:()=>void}) {
 const [entry,setEntry]=useState<WarehouseEntry|null>(null),[name,setName]=useState(''),[code,setCode]=useState(''),[saving,setSaving]=useState(false),[revision,setRevision]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState('');const write=useRef<AbortController|null>(null);
 useEffect(()=>()=>write.current?.abort(),[]);
 async function save(field:'name'|'code'|'status') {
  if(!entry||write.current||disabled||!canEdit)return;
  const target=field==='name'?name.trim():field==='code'?code.trim().toUpperCase():entry.status==='ACTIVE'?'INACTIVE':'ACTIVE';
  if(!window.confirm(`Actualizar ${field==='name'?'nombre':field==='code'?'código':'estado'} de ${entry.name}: ${target}. Se conservan los registros e historial.`))return;
  const c=new AbortController();write.current=c;setSaving(true);setError('');setNotice('');
  try {const value=field==='name'?await renameCatalogEntry(apiUrl,token,kind,entry.id,entry.name,name,c.signal):field==='code'?await updateCatalogCode(apiUrl,token,kind,entry,code,c.signal):await updateCatalogStatus(apiUrl,token,kind,entry,c.signal);if(c.signal.aborted)return;setEntry(null);setRevision(v=>v+1);setNotice('Cambio confirmado. Selecciona el registro actualizado para editarlo.');onChanged();}
  catch(e){if(!c.signal.aborted)setError(e instanceof Error?e.message:'Actualiza el catálogo antes de repetir.');}
  finally{write.current=null;if(!c.signal.aborted)setSaving(false);}
 }
 return <section className="panel"><h3>Administrar {kind==='categories'?'categorías':'almacenes'}</h3><AdminSelector key={revision} apiUrl={apiUrl} token={token} kind={kind} label={kind==='categories'?'Categorías':'Almacenes'} selected={entry} disabled={disabled||saving} onSelect={row=>{setEntry(row);setName(row.name);setCode(row.code);setError('');setNotice('');}}/>{entry&&canEdit&&<fieldset disabled={disabled||saving}><legend>{entry.name} · {entry.status}</legend><div className="field"><label htmlFor={kind+'-edit-name'}>Nombre</label><input id={kind+'-edit-name'} maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></div><button type="button" onClick={()=>void save('name')}>Guardar nombre</button><div className="field"><label htmlFor={kind+'-edit-code'}>Código</label><input id={kind+'-edit-code'} maxLength={kind==='categories'?24:32} value={code} onChange={e=>setCode(e.target.value)}/></div><button type="button" onClick={()=>void save('code')}>Guardar código</button><button type="button" onClick={()=>void save('status')}>{entry.status==='ACTIVE'?'Desactivar':'Activar'}</button></fieldset>}{error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}</section>;
}
