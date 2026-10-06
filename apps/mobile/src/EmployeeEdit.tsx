import {useState} from 'react';
import {Alert,Pressable,Text,TextInput,View} from 'react-native';
import {useEmployeeEdit} from './useEmployeeEdit';
import type {Employee} from './employeeApi';
type Props={base:string;token:string;employee:Employee;onSaved:()=>void;accent:string;onExpired:()=>void};
export function EmployeeEdit(p:Props){const [open,setOpen]=useState(false);return open?<Form {...p} onClose={()=>{setOpen(false);p.onSaved();}}/>:<Pressable accessibilityRole="button" onPress={()=>setOpen(true)}><Text style={{color:p.accent,paddingVertical:12}}>Editar nombre y puesto</Text></Pressable>;}
function Form({base,token,employee,onSaved,onClose,accent,onExpired}:Props&{onClose:()=>void}){
 const s=useEmployeeEdit(base,token,employee,onSaved,onExpired);const input={color:'#F1F5F9',backgroundColor:'#0B1118',padding:12,borderRadius:12};const note={color:'#8B99A8',marginVertical:8};
 return <View><Text style={note}>Editar nombre completo</Text><TextInput accessibilityLabel="Editar nombre completo" editable={!s.busy&&!s.blocked} maxLength={120} value={s.fullName} onChangeText={s.setFullName} style={input}/><Text style={note}>Editar puesto</Text><TextInput accessibilityLabel="Editar puesto" editable={!s.busy&&!s.blocked} maxLength={100} value={s.position} onChangeText={s.setPosition} style={input}/>{s.error&&<Text accessibilityRole="alert" style={{color:'#F87171'}}>{s.error}</Text>}<Pressable accessibilityRole="button" disabled={!s.ready} onPress={()=>Alert.alert('Confirmar edición',`Nombre: ${s.fullName.trim()}\nPuesto: ${s.position.trim()}`,[{text:'Cancelar',style:'cancel'},{text:'Guardar',onPress:()=>void s.save()}])}><Text style={{color:s.ready?accent:'#8B99A8',paddingVertical:12}}>Guardar cambios</Text></Pressable><Pressable accessibilityRole="button" disabled={s.busy} onPress={onClose}><Text style={{color:s.busy?'#8B99A8':accent,paddingVertical:12}}>Cerrar edición y actualizar</Text></Pressable></View>;
}
