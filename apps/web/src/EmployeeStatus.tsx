import type {Employee} from './employeeApi';
import {useEmployeeStatus} from './useEmployeeStatus';
export function EmployeeStatus({base,token,employee,onSaved}:{base:string;token:string;employee:Employee;onSaved:()=>void}){
 const s=useEmployeeStatus(base,token,employee,onSaved);
 const label=employee.status==='ACTIVE'?'Desactivar empleado':'Reactivar empleado';
 return <div><button disabled={s.busy||s.blocked} onClick={()=>{if(window.confirm(`${label}: ${employee.fullName}. El registro laboral conserva su historial. Esto no cambia el acceso de su cuenta al ERP. Para reactivar, el usuario y departamento deben estar activos.`))void s.save();}}>{s.busy?'Guardando estado…':label}</button>{s.error&&<p role="alert">{s.error}</p>}{s.blocked&&<button onClick={onSaved}>Actualizar estado desde el servidor</button>}</div>;
}
