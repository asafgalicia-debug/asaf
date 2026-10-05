import {useState} from 'react';
import {useEmployeeEdit} from './useEmployeeEdit';
import type {Employee} from './employeeApi';
type Props={base:string;token:string;employee:Employee;onSaved:()=>void};
export function EmployeeEdit(p:Props){const [open,setOpen]=useState(false);return open?<Form {...p} onClose={()=>{setOpen(false);p.onSaved();}}/>:<button onClick={()=>setOpen(true)}>Editar nombre y puesto</button>;}
function Form({base,token,employee,onSaved,onClose}:Props&{onClose:()=>void}){
 const s=useEmployeeEdit(base,token,employee,onSaved);
 return <fieldset><legend>Editar empleado</legend><label>Nombre completo<input disabled={s.busy||s.blocked} maxLength={120} value={s.fullName} onChange={e=>s.setFullName(e.target.value)}/></label><label>Puesto<input disabled={s.busy||s.blocked} maxLength={100} value={s.position} onChange={e=>s.setPosition(e.target.value)}/></label>{s.error&&<p role="alert">{s.error}</p>}<button disabled={!s.ready} onClick={()=>{if(window.confirm(`Guardar el nombre ${s.fullName.trim()} y puesto ${s.position.trim()}?`))void s.save();}}>Guardar cambios</button><button disabled={s.busy} onClick={onClose}>Cerrar edición y actualizar</button></fieldset>;
}
