import { ApiError, requestData } from './api';
export type CategoryRow = { id:string; name:string; code:string; status:'ACTIVE'|'INACTIVE' };
const record=(value:unknown):value is Record<string,unknown>=>typeof value==='object'&&value!==null&&!Array.isArray(value);
const text=(value:unknown):value is string=>typeof value==='string'&&value.trim().length>0;
export async function categoryPageRequest(base: string, token: string, signal: AbortSignal, search = '', cursor = '', status: 'ACTIVE' | 'INACTIVE' | '' = ''): Promise<{ items: CategoryRow[]; nextCursor: string | null }> {
  if (search.length > 100 || (cursor && !/^[a-f0-9]{24}$/i.test(cursor)) || (status && !['ACTIVE', 'INACTIVE'].includes(status))) throw new ApiError('Revisa la búsqueda de categorías.');
  const params = new URLSearchParams({ search: search.trim(), limit: '20' });
  if (cursor) params.set('cursor', cursor); if (status) params.set('status', status);
  const data = await requestData(base, '/categories/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
  if (!record(data) || !Array.isArray(data.items) || data.items.length > 20) throw new ApiError('La API devolvió una página inesperada.');
  const items: CategoryRow[] = data.items.map(row => {
    if (!record(row) || !text(row.id) || !/^[a-f0-9]{24}$/i.test(row.id) || !text(row.name) || !text(row.code) || !['ACTIVE', 'INACTIVE'].includes(String(row.status)) || (status && row.status !== status)) throw new ApiError('La API devolvió un categoría inesperado.');
    return { id: row.id, name: row.name, code: row.code, status: row.status as CategoryRow['status'] };
  });
  if (items.some((row, i) => (cursor && row.id.toLowerCase() >= cursor.toLowerCase()) || (i > 0 && row.id.toLowerCase() >= items[i - 1].id.toLowerCase())) || (data.nextCursor !== null && (items.length !== 20 || data.nextCursor !== items[items.length - 1]?.id))) throw new ApiError('La API devolvió un orden inesperado.');
  return { items, nextCursor: data.nextCursor as string | null };
}

export async function categoryLookup(base: string, token: string, signal: AbortSignal, ids: string[]): Promise<CategoryRow[]> {
 const unique = [...new Set(ids)];
 if (unique.length > 20 || unique.some(id => !/^[a-f0-9]{24}$/i.test(id))) throw new ApiError('Revisa los identificadores de categorías.');
 if (!unique.length) return [];
 const params = new URLSearchParams({ ids: unique.join(','), limit: '20' });
 const data = await requestData(base, '/categories/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!record(data) || data.nextCursor !== null || !Array.isArray(data.items) || data.items.length > unique.length) throw new ApiError('La API devolvió nombres inesperados.');
 const seen = new Set<string>();
 return data.items.map(row => {
  if (!record(row) || !text(row.id) || !unique.includes(row.id) || seen.has(row.id) || !text(row.name) || !text(row.code) || !['ACTIVE', 'INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió un categoría inesperado.');
  seen.add(row.id); return { id: row.id, name: row.name, code: row.code, status: row.status as CategoryRow['status'] };
 });
}
