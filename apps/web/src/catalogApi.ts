import {ApiError,requestData} from './webApi';
function record(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
export type CatalogKind = 'customers' | 'suppliers' | 'products';
export type CatalogEntry = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE'; email?: string; taxId?: string; sku?: string; categoryId?: string; price?: number };

export function parseCatalogRows(data: unknown, kind: CatalogKind): CatalogEntry[] {
  if (!Array.isArray(data)) throw new ApiError('La API devolvió un catálogo inesperado.');
  const ids = new Set<string>();
  return data.map((row: unknown) => {
    if (!record(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.name !== 'string' || !row.name || !['ACTIVE', 'INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió un catálogo inesperado.');
    ids.add(row.id);
    const common = { id: row.id, name: row.name, status: row.status as CatalogEntry['status'] };
    if (kind === 'products') {
      if (typeof row.sku !== 'string' || typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price < 0) throw new ApiError('La API devolvió un producto inesperado.');
      return { ...common, sku: row.sku, price: row.price, categoryId: typeof row.categoryId === 'string' ? row.categoryId : undefined };
    }
    if (typeof row.email !== 'string' || typeof row.taxId !== 'string') throw new ApiError('La API devolvió un contacto inesperado.');
    return { ...common, email: row.email, taxId: row.taxId };
  });
}

export async function catalogLookup(base: string, kind: CatalogKind, token: string, signal: AbortSignal, ids: string[]): Promise<CatalogEntry[]> {
 const unique = [...new Set(ids)];
 if (unique.length > 20 || unique.some(id => !/^[a-f0-9]{24}$/i.test(id))) throw new ApiError('Revisa los identificadores del catálogo.');
 if (!unique.length) return [];
 const params = new URLSearchParams({ ids: unique.join(','), limit: '20' });
 const data = await requestData(base, '/' + kind + '/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!record(data) || data.nextCursor !== null) throw new ApiError('La API devolvió nombres inesperados.');
 const rows = parseCatalogRows(data.items, kind);
 if (rows.length > unique.length || rows.some(row => !unique.includes(row.id))) throw new ApiError('La API devolvió nombres inesperados.');
 return rows;
}

export type CatalogStatus = 'ACTIVE' | 'INACTIVE';
export async function catalogServerPage(base: string, kind: CatalogKind, token: string, signal: AbortSignal, search = '', cursor = '', status: CatalogStatus | '' = ''): Promise<{ items: CatalogEntry[]; nextCursor: string | null }> {
 if ((status && !['ACTIVE', 'INACTIVE'].includes(status)) || search.length > 100 || (cursor && !/^[a-f0-9]{24}$/i.test(cursor))) throw new ApiError('Revisa la búsqueda del catálogo.');
 const params = new URLSearchParams({ search: search.trim(), limit: '20' }); if (cursor) params.set('cursor', cursor); if (status) params.set('status', status);
 const data = await requestData(base, '/' + kind + '/page?' + params.toString(), { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!record(data)) throw new ApiError('La API devolvió una página inesperada.');
 const items = parseCatalogRows(data.items, kind);
 if (items.some(row => status && row.status !== status) || items.length > 20 || (data.nextCursor !== null && (typeof data.nextCursor !== 'string' || !/^[a-f0-9]{24}$/i.test(data.nextCursor) || items.length !== 20 || data.nextCursor !== items[items.length - 1]?.id))) throw new ApiError('La API devolvió una página inesperada.');
 if (items.some((row, index) => !/^[a-f0-9]{24}$/i.test(row.id) || (cursor && row.id.toLowerCase() >= cursor.toLowerCase()) || (index > 0 && row.id.toLowerCase() >= items[index - 1].id.toLowerCase()))) throw new ApiError('La API devolvió un orden inesperado.');
 return { items, nextCursor: data.nextCursor as string | null };
}
