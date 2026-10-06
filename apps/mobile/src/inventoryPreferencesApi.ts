import {ApiError,requestData} from './api';
export type InventoryPreference={version:number;threshold:number|null};
export type AlertRow={productId:string;warehouseId:string;quantity:number;productName?:string;warehouseName?:string};
export type AlertPage={configured:boolean;threshold:number|null;configVersion:number|null;items:AlertRow[];nextCursor:string|null};
const hex=/^[a-f0-9]{24}$/i, cursorPattern=/^[a-f0-9]{24}:[a-f0-9]{24}$/i;
const integer=(v:unknown):v is number=>typeof v==='number'&&Number.isSafeInteger(v)&&v>=0;
export async function inventoryPreference(base:string,token:string,companyId:string,signal:AbortSignal):Promise<InventoryPreference|null>{
 try{const v=await requestData(base,'/config/inventario',{headers:{Authorization:'Bearer '+token},signal}) as any;
 const threshold=v?.config?.stockAlertThreshold;if(!v||v.companyId!==companyId||v.module!=='inventario'||!integer(v.version)||(threshold!==undefined&&(!integer(threshold)||threshold>1000000)))throw new ApiError('Configuración de inventario inesperada.');return {version:v.version,threshold:threshold??null};
 }catch(e){if(e instanceof ApiError&&e.status===404)return null;throw e;}
}
export async function saveInventoryPreference(base:string,token:string,companyId:string,expectedVersion:number|null,thresholdText:string,signal:AbortSignal):Promise<InventoryPreference>{
 if(!/^\d{1,7}$/.test(thresholdText.trim())||Number(thresholdText)>1000000||(expectedVersion!==null&&!integer(expectedVersion)))throw new ApiError('Escribe un umbral entero entre 0 y 1000000.');const threshold=Number(thresholdText);
 const v=await requestData(base,'/config/inventario',{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({expectedVersion,stockAlertThreshold:threshold}),signal}) as any;
 if(!v||v.companyId!==companyId||v.module!=='inventario'||v.version!==(expectedVersion??0)+1||v.config?.stockAlertThreshold!==threshold)throw new ApiError('No se pudo confirmar el ajuste. Actualiza antes de volver a guardar.');return {version:v.version,threshold};
}
export async function inventoryAlerts(base:string,token:string,signal:AbortSignal,search='',cursor=''):Promise<AlertPage>{
 if(search.length>100||(cursor&&!cursorPattern.test(cursor)))throw new ApiError('Revisa la búsqueda o página.');const query=new URLSearchParams({limit:'20',search:search.trim()});if(cursor)query.set('cursor',cursor);
 const v=await requestData(base,'/stock/alerts?'+query,{headers:{Authorization:'Bearer '+token},signal}) as any;
 if(!v||typeof v.configured!=='boolean'||!Array.isArray(v.items)||v.items.length>20||(v.configVersion!==null&&!integer(v.configVersion)))throw new ApiError('Página de avisos inesperada.');
 if(v.configured?(!integer(v.threshold)||v.threshold>1000000||!integer(v.configVersion)):(v.threshold!==null||v.items.length||v.nextCursor!==null))throw new ApiError('Umbral de avisos inesperado.');
 const key=(r:AlertRow)=>r.warehouseId+':'+r.productId;
 const items:AlertRow[]=v.items.map((r:any)=>{if(!r||typeof r.productId!=='string'||!hex.test(r.productId)||typeof r.warehouseId!=='string'||!hex.test(r.warehouseId)||typeof r.quantity!=='number'||!Number.isFinite(r.quantity)||r.quantity>=v.threshold||['productName','warehouseName'].some(k=>r[k]!==undefined&&(typeof r[k]!=='string'||!r[k])))throw new ApiError('Existencias de aviso inesperadas.');return {productId:r.productId,warehouseId:r.warehouseId,quantity:r.quantity,productName:r.productName,warehouseName:r.warehouseName};});
 if(items.some((r,i)=>(cursor&&key(r)<=cursor)||(i>0&&key(r)<=key(items[i-1])))||(v.nextCursor!==null&&(typeof v.nextCursor!=='string'||!cursorPattern.test(v.nextCursor)||items.length!==20||v.nextCursor!==key(items[items.length-1]))))throw new ApiError('Cursor de avisos inesperado.');
 return {configured:v.configured,threshold:v.threshold,configVersion:v.configVersion,items,nextCursor:v.nextCursor};
}
