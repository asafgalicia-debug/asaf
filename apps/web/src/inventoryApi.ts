import { ApiError, requestData } from './webApi';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0;
export type Balance = { warehouseId: string; productId: string; quantity: number };
export type StockKind = 'receipts' | 'issues' | 'transfers';
export type StockDraft = { warehouseId: string; productId: string; destinationWarehouseId: string; quantity: string; reference: string };
export function validateStock(kind: StockKind, draft: StockDraft) {
  if (!['receipts', 'issues', 'transfers'].includes(kind)) throw new ApiError('Selecciona un tipo de movimiento válido.');
  const id = /^[a-f\d]{24}$/i;
  if (!id.test(draft.warehouseId) || !id.test(draft.productId)) throw new ApiError('Selecciona un almacén y producto activos.');
  const quantity = Number(draft.quantity.trim()); const reference = draft.reference.trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(draft.quantity.trim()) || !Number.isFinite(quantity) || quantity < 0.000001) throw new ApiError('La cantidad debe ser positiva y tener hasta seis decimales.');
  if (!reference || reference.length > 100) throw new ApiError('Escribe una referencia de hasta 100 caracteres.');
  if (kind === 'transfers' && (!id.test(draft.destinationWarehouseId) || draft.destinationWarehouseId === draft.warehouseId)) throw new ApiError('Selecciona un destino diferente del origen.');
  return { warehouseId: draft.warehouseId, productId: draft.productId, quantity, reference, ...(kind === 'transfers' ? { destinationWarehouseId: draft.destinationWarehouseId } : {}) };
}
export async function createStockRequest(base: string, token: string, kind: StockKind, draft: StockDraft, signal: AbortSignal): Promise<void> {
  const payload = validateStock(kind, draft);
  try {
    const data = await requestData(base, `/stock/${kind}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    const expected = kind === 'receipts' ? 'RECEIPT' : kind === 'issues' ? 'ISSUE' : 'TRANSFER';
    if (!record(data) || !text(data.id) || data.kind !== expected || data.reference !== payload.reference || data.productId !== payload.productId || data.warehouseId !== payload.warehouseId || data.quantity !== (kind === 'receipts' ? payload.quantity : -payload.quantity) || (kind === 'transfers' && data.destinationWarehouseId !== payload.destinationWarehouseId)) throw new ApiError('No se pudo confirmar el movimiento.');
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) throw new ApiError('No se registró un nuevo movimiento: puede faltar stock o la referencia ya existe. Revisa existencias e historial.', 409);
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Busca la referencia exacta en el historial antes de repetir el movimiento.');
  }
}
export type WarehouseEntry = { id: string; name: string; code: string; status: 'ACTIVE' | 'INACTIVE' };
export function validateWarehouse(draft: { name: string; code: string }) {
  const name = draft.name.trim(); const code = draft.code.trim().toUpperCase();
  if (name.length < 2 || name.length > 100) throw new ApiError('El nombre del almacén debe tener entre 2 y 100 caracteres.');
  if (code.length < 2 || code.length > 32) throw new ApiError('El código del almacén debe tener entre 2 y 32 caracteres.');
  return { name, code };
}
export async function createWarehouseRequest(base: string, token: string, draft: { name: string; code: string }, signal: AbortSignal): Promise<WarehouseEntry> {
  const payload = validateWarehouse(draft);
  try {
    const data = await requestData(base, '/warehouses', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || !text(data.id) || data.name !== payload.name || data.code !== payload.code || data.status !== 'ACTIVE') throw new ApiError('No se pudo confirmar el almacén.');
    return { id: data.id, name: data.name, code: data.code, status: 'ACTIVE' };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Actualiza los almacenes y busca el código antes de volver a guardar.');
  }
}
export async function warehousesRequest(base: string, token: string, signal: AbortSignal): Promise<WarehouseEntry[]> {
  const data = await requestData(base, '/warehouses', { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!Array.isArray(data)) throw new ApiError('La API devolvió almacenes inesperados.');
  const ids = new Set<string>();
  return data.map((row: unknown) => {
    if (!record(row) || !text(row.id) || ids.has(row.id) || !text(row.name) || !text(row.code) || !['ACTIVE', 'INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió almacenes inesperados.');
    ids.add(row.id);
    return { id: row.id, name: row.name, code: row.code, status: row.status as WarehouseEntry['status'] };
  });
}
export function inventoryLabel(id: string, entries: { id: string; name: string }[]): string {
  const entry = entries.find((row) => row.id === id);
  return entry ? `${entry.name} (${id})` : `Sin nombre disponible (${id})`;
}
export function filterBalances(rows: Balance[], query: string, products: { id: string; name: string; sku?: string }[], warehouses: WarehouseEntry[]) {
  const search = query.trim().toLocaleLowerCase('es');
  return rows.filter((row) => {
    const product = products.find((value) => value.id === row.productId);
    const warehouse = warehouses.find((value) => value.id === row.warehouseId);
    return [row.productId, row.warehouseId, product?.name, product?.sku, warehouse?.name, warehouse?.code].some((value) => value?.toLocaleLowerCase('es').includes(search));
  });
}
export type Movement = Balance & { id: string; kind: 'RECEIPT' | 'ISSUE' | 'TRANSFER'; reference: string; userId: string; destinationWarehouseId?: string; createdAt?: string };
export async function stockRequest(base: string, token: string, signal: AbortSignal): Promise<Balance[]> {
  const data = await requestData(base, '/stock', { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!Array.isArray(data)) throw new ApiError('La API devolvió existencias inesperadas.');
  return data.map((row: unknown) => {
    if (!record(row) || !text(row.warehouseId) || !text(row.productId) || typeof row.quantity !== 'number' || !Number.isFinite(row.quantity)) throw new ApiError('La API devolvió existencias inesperadas.');
    return { warehouseId: row.warehouseId, productId: row.productId, quantity: row.quantity };
  });
}
export async function movementRequest(base: string, token: string, signal: AbortSignal, reference = '', cursor = ''): Promise<{ items: Movement[]; nextCursor: string | null }> {
  const ref = reference.trim();
  if (ref.length > 100 || (cursor && !/^[a-f\d]{24}$/i.test(cursor))) throw new ApiError('Revisa los filtros del historial.');
  const query = `limit=25${ref ? `&reference=${encodeURIComponent(ref)}` : ''}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
  const data = await requestData(base, `/stock/movements?${query}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!record(data) || !Array.isArray(data.items) || data.items.length > 25 || !(data.nextCursor === null || (typeof data.nextCursor === 'string' && /^[a-f\d]{24}$/i.test(data.nextCursor)))) throw new ApiError('La API devolvió un historial inesperado.');
  const ids = new Set<string>();
  const items = data.items.map((row: unknown): Movement => {
    if (!record(row) || !text(row.id) || ids.has(row.id) || !text(row.warehouseId) || !text(row.productId) || !text(row.reference) || !text(row.userId) || !['RECEIPT', 'ISSUE', 'TRANSFER'].includes(String(row.kind)) || typeof row.quantity !== 'number' || !Number.isFinite(row.quantity) || (row.kind === 'TRANSFER' && !text(row.destinationWarehouseId)) || (row.createdAt !== undefined && (typeof row.createdAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt))))) throw new ApiError('La API devolvió un movimiento inesperado.');
    ids.add(row.id);
    return { id: row.id, warehouseId: row.warehouseId, productId: row.productId, reference: row.reference, userId: row.userId, quantity: row.quantity, kind: row.kind as Movement['kind'], destinationWarehouseId: typeof row.destinationWarehouseId === 'string' ? row.destinationWarehouseId : undefined, createdAt: row.createdAt as string | undefined };
  });
  return { items, nextCursor: data.nextCursor as string | null };
}

export async function warehousePageRequest(base: string, token: string, signal: AbortSignal, search = '', cursor = '', status: 'ACTIVE' | 'INACTIVE' | '' = ''): Promise<{ items: WarehouseEntry[]; nextCursor: string | null }> {
  if (search.length > 100 || (cursor && !/^[a-f0-9]{24}$/i.test(cursor)) || (status && !['ACTIVE', 'INACTIVE'].includes(status))) throw new ApiError('Revisa la búsqueda de almacenes.');
  const params = new URLSearchParams({ search: search.trim(), limit: '20' });
  if (cursor) params.set('cursor', cursor); if (status) params.set('status', status);
  const data = await requestData(base, '/warehouses/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
  if (!record(data) || !Array.isArray(data.items) || data.items.length > 20) throw new ApiError('La API devolvió una página inesperada.');
  const items: WarehouseEntry[] = data.items.map(row => {
    if (!record(row) || !text(row.id) || !/^[a-f0-9]{24}$/i.test(row.id) || !text(row.name) || !text(row.code) || !['ACTIVE', 'INACTIVE'].includes(String(row.status)) || (status && row.status !== status)) throw new ApiError('La API devolvió un almacén inesperado.');
    return { id: row.id, name: row.name, code: row.code, status: row.status as WarehouseEntry['status'] };
  });
  if (items.some((row, i) => (cursor && row.id.toLowerCase() >= cursor.toLowerCase()) || (i > 0 && row.id.toLowerCase() >= items[i - 1].id.toLowerCase())) || (data.nextCursor !== null && (items.length !== 20 || data.nextCursor !== items[items.length - 1]?.id))) throw new ApiError('La API devolvió un orden inesperado.');
  return { items, nextCursor: data.nextCursor as string | null };
}

export type StockPageBalance = Balance & { productName?: string; productSku?: string; warehouseName?: string; warehouseCode?: string };
export async function stockPageRequest(base: string, token: string, signal: AbortSignal, search = '', cursor = ''): Promise<{ items: StockPageBalance[]; nextCursor: string | null }> {
 const cursorPattern = /^[a-f0-9]{24}:[a-f0-9]{24}$/i;
 if (search.length > 100 || (cursor && !cursorPattern.test(cursor))) throw new ApiError('Revisa la búsqueda de existencias.');
 const params = new URLSearchParams({ search: search.trim(), limit: '20' }); if (cursor) params.set('cursor', cursor);
 const data = await requestData(base, '/stock/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!record(data) || !Array.isArray(data.items) || data.items.length > 20) throw new ApiError('La API devolvió existencias inesperadas.');
 const items: StockPageBalance[] = data.items.map(row => {
  if (!record(row) || !text(row.productId) || !text(row.warehouseId) || !/^[a-f0-9]{24}$/i.test(row.productId) || !/^[a-f0-9]{24}$/i.test(row.warehouseId) || typeof row.quantity !== 'number' || !Number.isFinite(row.quantity)) throw new ApiError('La API devolvió existencias inesperadas.');
  for (const field of ['productName', 'productSku', 'warehouseName', 'warehouseCode']) if (row[field] !== undefined && !text(row[field])) throw new ApiError('La API devolvió nombres inesperados.');
  return { productId: row.productId, warehouseId: row.warehouseId, quantity: row.quantity, productName: row.productName as string | undefined, productSku: row.productSku as string | undefined, warehouseName: row.warehouseName as string | undefined, warehouseCode: row.warehouseCode as string | undefined };
 });
 const key = (row: Balance) => row.warehouseId + ':' + row.productId;
 if (items.some((row,i) => (cursor && key(row) <= cursor) || (i > 0 && key(row) <= key(items[i-1]))) || (data.nextCursor !== null && (typeof data.nextCursor !== 'string' || !cursorPattern.test(data.nextCursor) || items.length !== 20 || data.nextCursor !== key(items[items.length-1])))) throw new ApiError('La API devolvió una página inesperada.');
 return { items, nextCursor: data.nextCursor as string | null };
}

export async function warehouseLookup(base: string, token: string, signal: AbortSignal, ids: string[]): Promise<WarehouseEntry[]> {
 const unique = [...new Set(ids)];
 if (unique.length > 20 || unique.some(id => !/^[a-f0-9]{24}$/i.test(id))) throw new ApiError('Revisa los identificadores de almacenes.');
 if (!unique.length) return [];
 const params = new URLSearchParams({ ids: unique.join(','), limit: '20' });
 const data = await requestData(base, '/warehouses/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!record(data) || data.nextCursor !== null || !Array.isArray(data.items) || data.items.length > unique.length) throw new ApiError('La API devolvió nombres inesperados.');
 const seen = new Set<string>();
 return data.items.map(row => {
  if (!record(row) || !text(row.id) || !unique.includes(row.id) || seen.has(row.id) || !text(row.name) || !text(row.code) || !['ACTIVE', 'INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió un almacén inesperado.');
  seen.add(row.id); return { id: row.id, name: row.name, code: row.code, status: row.status as WarehouseEntry['status'] };
 });
}
