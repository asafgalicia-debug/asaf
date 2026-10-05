import {useEffect,useState} from 'react';
import {ApiError} from './webApi';
import {receiptRequest,type CommercialReceipt} from './settlementApi';
import type {Transaction,TransactionKind} from './transactionApi';
export function ReceiptView({base,token,kind,row,companyId,branchId,onClose}:{base:string;token:string;kind:TransactionKind;row:Transaction;companyId:string;branchId:string;onClose:()=>void}){
 const [data,setData]=useState<CommercialReceipt|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[revision,setRevision]=useState(0);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setData(null);receiptRequest(base,token,kind,row,{companyId,branchId},c.signal).then(v=>{if(!c.signal.aborted)setData(v);}).catch(e=>{if(!c.signal.aborted)setError(e instanceof ApiError&&e.status===404?'Este documento no tiene comprobante de operación conjunta. Puede haberse cambiado de estado manualmente.':e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[base,token,kind,row,companyId,branchId,revision]);
 return <section className="panel"><h3>Comprobante de operación conjunta</h3><p>Documento: {row.id}</p>{loading?<p>Consultando…</p>:error?<p role="alert">{error}</p>:data&&<dl>{Object.entries(data).map(([k,v])=><div key={k}><dt>{({id:'Comprobante',warehouseId:'Almacén',accountId:'Cuenta',stockMovementId:'Movimiento de inventario',cashMovementId:'Movimiento de caja',date:'Fecha de caja',quantity:'Cantidad',total:'Importe (moneda no informada)',status:'Estado'} as Record<string,string>)[k]}</dt><dd>{v}</dd></div>)}</dl>}<button disabled={loading} onClick={()=>setRevision(v=>v+1)}>Actualizar comprobante</button><button onClick={onClose}>Cerrar comprobante</button></section>;
}
