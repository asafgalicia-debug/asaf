import {useRef,useState} from 'react';
import { downloadDocument } from './downloadDocument';
import type { ExportDocument } from './exportDocument';
export function DocumentExportButtons({ document }: { document: ExportDocument }) {
 const lock=useRef(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function exportFile(format:'pdf'|'xlsx'){
  if(lock.current)return;lock.current=true;setBusy(true);setMessage('Preparando archivo…');
  try{await downloadDocument(document,format);setMessage(format==='pdf'?'Documento preparado. Elige Guardar como PDF en el diálogo.':'Archivo Excel preparado para descargar.');}
  catch(error){setMessage(error instanceof Error?error.message:'No se pudo exportar el documento.');}
  finally{lock.current=false;setBusy(false);}
 }
 return <div><button disabled={busy} type="button" onClick={()=>void exportFile('pdf')}>PDF / Imprimir</button><button disabled={busy} type="button" onClick={()=>void exportFile('xlsx')}>Exportar Excel</button><p>Para PDF, elige Guardar como PDF en el diálogo de impresión.</p>{message&&<p role="status">{message}</p>}</div>;
}
