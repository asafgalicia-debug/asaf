import { ApiError, requestData } from './webApi';
export type TransactionKind = 'sales' | 'purchase-orders';
export type TransactionDraft = { partnerId: string; productId: string; quantity: string; unitCost: string };
export type Transaction = { id: string; partnerId: string; productId: string; quantity: number; unitPrice: number; total: number; status: string };
export function validateTransaction(kind: TransactionKind, draft: TransactionDraft) {
  const id = /^[a-f\d]{24}$/i;
  if (!id.test(draft.partnerId) || !id.test(draft.productId)) throw new ApiError('Selecciona un contacto y producto activos.');
  const quantity = Number(draft.quantity.trim());
  if (!/^\d+(?:\.\d{1,6})?$/.test(draft.quantity.trim()) || !Number.isFinite(quantity) || quantity < 0.000001) throw new ApiError('Escribe una cantidad positiva con hasta seis decimales.');
  const unitCost = Number(draft.unitCost.trim());
  if (kind === 'purchase-orders' && (!/^\d+(?:\.\d{1,2})?$/.test(draft.unitCost.trim()) || !Number.isFinite(unitCost) || unitCost < 0 || !Number.isFinite(unitCost * quantity))) throw new ApiError('Escribe un costo no negativo con hasta dos decimales.');
  return kind === 'sales' ? { customerId: draft.partnerId, productId: draft.productId, quantity } : { supplierId: draft.partnerId, productId: draft.productId, quantity, unitCost };
}
function parseTransaction(value: unknown, kind: TransactionKind): Transaction {
  if (!value || typeof value !== 'object') throw new ApiError('La API devolvió un registro inesperado.');
  const row = value as Record<string, unknown>;
  const partnerId = row[kind === 'sales' ? 'customerId' : 'supplierId'];
  const unitPrice = row[kind === 'sales' ? 'unitPrice' : 'unitCost'];
  const statuses = kind === 'sales' ? ['PENDIENTE', 'PAGADA', 'CANCELADA'] : ['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA'];
  if (typeof row.id !== 'string' || !row.id || typeof partnerId !== 'string' || !partnerId || typeof row.productId !== 'string' || !row.productId || typeof row.quantity !== 'number' || !Number.isFinite(row.quantity) || row.quantity <= 0 || typeof unitPrice !== 'number' || !Number.isFinite(unitPrice) || unitPrice < 0 || typeof row.total !== 'number' || !Number.isFinite(row.total) || row.total < 0 || !statuses.includes(String(row.status))) throw new ApiError('La API devolvió un registro inesperado.');
  if (row.total !== Math.round(unitPrice * row.quantity * 100) / 100) throw new ApiError('La API devolvió un importe inconsistente.');
  return { id: row.id, partnerId, productId: row.productId, quantity: row.quantity, unitPrice, total: row.total, status: String(row.status) };
}
export async function transactionsRequest(base: string, token: string, kind: TransactionKind, signal: AbortSignal): Promise<Transaction[]> {
  const data = await requestData(base, `/${kind}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!Array.isArray(data)) throw new ApiError('La API devolvió un listado inesperado.');
  const rows = data.map((row) => parseTransaction(row, kind));
  if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new ApiError('La API devolvió registros duplicados.');
  return rows;
}
export async function createTransactionRequest(base: string, token: string, kind: TransactionKind, draft: TransactionDraft, signal: AbortSignal) {
  const payload = validateTransaction(kind, draft);
  try {
    const row = parseTransaction(await requestData(base, `/${kind}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal }), kind);
    if (row.partnerId !== draft.partnerId || row.productId !== draft.productId || row.quantity !== payload.quantity || row.status !== 'PENDIENTE' || (kind === 'purchase-orders' && row.unitPrice !== Number(draft.unitCost))) throw new ApiError('No se pudo confirmar el registro.');
    return row;
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Revisa el listado antes de repetir; podría haberse registrado.');
  }
}

export function transactionStatusOptions(kind: TransactionKind, status: string): string[] {
  if (kind === 'sales') return status === 'PENDIENTE' ? ['PAGADA', 'CANCELADA'] : [];
  return status === 'PENDIENTE' ? ['APROBADA', 'CANCELADA'] : status === 'APROBADA' ? ['RECIBIDA', 'CANCELADA'] : [];
}
export async function updateTransactionStatusRequest(base: string, token: string, kind: TransactionKind, current: Transaction, status: string, signal: AbortSignal): Promise<Transaction> {
  if (!/^[a-f0-9]{24}$/i.test(current.id) || !transactionStatusOptions(kind, current.status).includes(status)) throw new ApiError('Este cambio de estado no está permitido.');
  try {
    const row = parseTransaction(await requestData(base, '/' + kind + '/' + current.id + '/status', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedStatus: current.status, status }), signal }), kind);
    if (row.id !== current.id || row.status !== status || row.partnerId !== current.partnerId || row.productId !== current.productId || row.quantity !== current.quantity || row.unitPrice !== current.unitPrice || row.total !== current.total) throw new ApiError('No se pudo confirmar el cambio de estado.');
    return row;
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new ApiError('El estado cambió o el registro no está disponible. Actualiza el listado.', 409);
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el estado. Actualiza el listado antes de repetir el cambio.');
  }
}

export async function transactionPageRequest(base: string, token: string, kind: TransactionKind, signal: AbortSignal, cursor = '', status = ''): Promise<{ items: Transaction[]; nextCursor: string | null }> {
 const statuses = kind === 'sales' ? ['PENDIENTE','PAGADA','CANCELADA'] : ['PENDIENTE','APROBADA','RECIBIDA','CANCELADA'];
 if ((cursor && !/^[a-f0-9]{24}$/i.test(cursor)) || (status && !statuses.includes(status))) throw new ApiError('Revisa el estado y la página solicitada.');
 const params = new URLSearchParams({limit:'20'}); if(cursor) params.set('cursor',cursor); if(status) params.set('status',status);
 const data = await requestData(base, '/' + kind + '/page?' + params.toString(), {headers:{Authorization:'Bearer '+token},signal});
 if (!data || typeof data !== 'object' || !('items' in data) || !Array.isArray(data.items) || !('nextCursor' in data)) throw new ApiError('La API devolvió una página inesperada.');
 const items = data.items.map(row => parseTransaction(row,kind));
 if(items.length > 20 || items.some((row,index)=> !/^[a-f0-9]{24}$/i.test(row.id) || (status && row.status !== status) || (cursor && row.id.toLowerCase() >= cursor.toLowerCase()) || (index > 0 && row.id.toLowerCase() >= items[index-1].id.toLowerCase()))) throw new ApiError('La API devolvió una página inconsistente.');
 if(data.nextCursor !== null && (typeof data.nextCursor !== 'string' || !/^[a-f0-9]{24}$/i.test(data.nextCursor) || items.length !== 20 || data.nextCursor !== items[items.length-1]?.id)) throw new ApiError('La API devolvió un cursor inesperado.');
 return {items,nextCursor:data.nextCursor as string|null};
}
