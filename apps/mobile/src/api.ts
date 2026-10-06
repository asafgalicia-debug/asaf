export class ApiError extends Error {
  constructor(message: string, public readonly status = 0) { super(message); }
}

export type Session = { token: string; user: { name: string; email: string; companyId:string; branchId:string; permissions: string[] } };
export type DashboardSummary = {
  companyId: string; branchId: string; lastUpdated: string;
  metrics: { sales: number; purchases: number; cash: number; employees: number; inventory: number };
};

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

export async function requestData(base: string, path: string, options: RequestInit = {}, timeoutMs = 45000): Promise<unknown> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  options.signal?.addEventListener('abort', cancel);
  if (options.signal?.aborted) cancel();
  const timer = setTimeout(cancel, timeoutMs);
  try {
    const response = await fetch(`${base.replace(/\/+$/, '')}${path}`, { ...options, signal: controller.signal });
    if (!response.ok) {
      const message = response.status === 401
        ? path === '/auth/login' ? 'El correo o la contraseña son incorrectos.' : 'Tu sesión venció. Inicia sesión de nuevo.'
        : response.status === 403 ? 'No tienes permiso para consultar esta información.'
        : response.status === 429 ? 'Demasiados intentos. Espera un momento antes de intentar de nuevo.'
        : response.status === 400 ? 'Revisa los datos ingresados.'
        : response.status === 409 ? 'Ya existe un registro con ese identificador fiscal, SKU o código.'
        : 'El servicio no está disponible temporalmente. Inténtalo de nuevo.';
      throw new ApiError(message, response.status);
    }
    const body: unknown = JSON.parse(await response.text());
    if (!record(body) || !('data' in body)) throw new ApiError('La API devolvió una respuesta inesperada.');
    return body.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (controller.signal.aborted) throw new ApiError('La solicitud se canceló o tardó demasiado. Inténtalo de nuevo.');
    if (error instanceof SyntaxError) throw new ApiError('La API devolvió una respuesta inesperada.');
    throw new ApiError('No se pudo conectar con la API. Revisa tu conexión e inténtalo de nuevo.');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}

export async function loginRequest(base: string, email: string, password: string): Promise<Session> {
  const data = await requestData(base, '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim().toLowerCase(), password }) });
  if (!record(data) || typeof data.token !== 'string' || !data.token || !record(data.user) || typeof data.user.name !== 'string' || typeof data.user.email !== 'string') throw new ApiError('La API devolvió una sesión inesperada.');
  if(typeof data.user.companyId!=='string'||!data.user.companyId||typeof data.user.branchId!=='string'||!data.user.branchId)throw new ApiError('La sesión requiere empresa y sucursal.');
  return { token: data.token, user: { name: data.user.name, email: data.user.email, companyId:data.user.companyId,branchId:data.user.branchId, permissions: Array.isArray(data.user.permissions) ? data.user.permissions.filter((value): value is string => typeof value === 'string') : [] } };
}

export async function dashboardRequest(base: string, token: string, signal: AbortSignal): Promise<DashboardSummary> {
  const data = await requestData(base, '/dashboard/summary', { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!record(data) || typeof data.companyId !== 'string' || !data.companyId || typeof data.branchId !== 'string' || !data.branchId || typeof data.lastUpdated !== 'string' || !Number.isFinite(Date.parse(data.lastUpdated)) || !record(data.metrics)) throw new ApiError('La API devolvió indicadores inesperados.');
  for (const key of ['sales', 'purchases', 'cash', 'employees', 'inventory']) {
    const value = data.metrics[key];
    if (typeof value !== 'number' || !Number.isFinite(value) || (['employees', 'inventory'].includes(key) && (!Number.isInteger(value) || value < 0))) throw new ApiError('La API devolvió indicadores inesperados.');
  }
  return data as DashboardSummary;
}

export type CatalogKind = 'customers' | 'suppliers' | 'products';
export type CatalogEntry = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE'; email?: string; taxId?: string; sku?: string; categoryId?: string; price?: number };

export type PartnerDraft = { name: string; taxId: string; email: string };
export type CategoryEntry = { id: string; name: string };
export type CategoryDraft = { name: string; code: string };
export function validateCategory(draft: CategoryDraft): CategoryDraft {
  const name = draft.name.trim(); const code = draft.code.trim().toUpperCase();
  if (name.length < 2 || name.length > 100) throw new ApiError('El nombre de categoría debe tener entre 2 y 100 caracteres.');
  if (code.length < 2 || code.length > 24) throw new ApiError('El código debe tener entre 2 y 24 caracteres.');
  return { name, code };
}
export async function createCategoryRequest(base: string, token: string, draft: CategoryDraft, signal: AbortSignal): Promise<CategoryEntry> {
  const payload = validateCategory(draft);
  try {
    const data = await requestData(base, '/categories', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || typeof data.id !== 'string' || !data.id || data.name !== payload.name || data.code !== payload.code || data.status !== 'ACTIVE') throw new ApiError('No se pudo confirmar la categoría.');
    return { id: data.id, name: data.name };
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Revisa las categorías y su código desde la web antes de volver a guardar.');
  }
}
export async function categoriesRequest(base: string, token: string, signal: AbortSignal): Promise<CategoryEntry[]> {
  const data = await requestData(base, '/categories', { headers: { Authorization: `Bearer ${token}` }, signal });
  if (!Array.isArray(data)) throw new ApiError('La API devolvió categorías inesperadas.');
  const ids = new Set<string>();
  const categories: CategoryEntry[] = [];
  for (const row of data) {
    if (!record(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.name !== 'string' || !row.name || !['ACTIVE', 'INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió categorías inesperadas.');
    ids.add(row.id);
    if (row.status === 'ACTIVE') categories.push({ id: row.id, name: row.name });
  }
  return categories;
}
export type ProductDraft = { name: string; sku: string; categoryId: string; price: string };
export function validateProduct(draft: ProductDraft) {
  const name = draft.name.trim(); const sku = draft.sku.trim().toUpperCase();
  const priceText = draft.price.trim(); const categoryId = draft.categoryId.trim();
  if (name.length < 2 || name.length > 120) throw new ApiError('El nombre debe tener entre 2 y 120 caracteres.');
  if (!sku || sku.length > 48) throw new ApiError('El SKU debe tener entre 1 y 48 caracteres.');
  if (!categoryId || categoryId.length > 100) throw new ApiError('Selecciona una categoría activa.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || !Number.isFinite(Number(priceText))) throw new ApiError('Escribe un precio válido con hasta dos decimales y punto decimal.');
  return { name, sku, categoryId, price: Number(priceText) };
}
export async function createProductRequest(base: string, token: string, draft: ProductDraft, signal: AbortSignal): Promise<void> {
  const payload = validateProduct(draft);
  try {
    const data = await requestData(base, '/products', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || typeof data.id !== 'string' || !data.id || data.name !== payload.name || data.sku !== payload.sku || data.categoryId !== payload.categoryId || data.price !== payload.price || data.status !== 'ACTIVE') throw new ApiError('No se pudo confirmar el producto.');
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Actualiza el catálogo y busca el SKU antes de volver a guardar.');
  }
}
export function validatePartner(draft: PartnerDraft): PartnerDraft {
  const value = { name: draft.name.trim(), taxId: draft.taxId.trim().toUpperCase(), email: draft.email.trim().toLowerCase() };
  if (value.name.length < 2 || value.name.length > 120) throw new ApiError('El nombre debe tener entre 2 y 120 caracteres.');
  if (value.taxId.length < 3 || value.taxId.length > 32) throw new ApiError('El identificador fiscal debe tener entre 3 y 32 caracteres.');
  if (value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new ApiError('Escribe un correo electrónico válido.');
  return value;
}

export async function createPartner(base: string, kind: 'customers' | 'suppliers', token: string, draft: PartnerDraft, signal: AbortSignal): Promise<void> {
  const payload = validatePartner(draft);
  try {
    const data = await requestData(base, `/${kind}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || typeof data.id !== 'string' || !data.id || data.name !== payload.name || data.taxId !== payload.taxId || data.email !== payload.email || data.status !== 'ACTIVE') throw new ApiError('No se pudo confirmar el alta.');
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar el guardado. Actualiza el catálogo y busca el identificador fiscal antes de volver a guardar.');
  }
}

export async function catalogRequest(base: string, kind: CatalogKind, token: string, signal: AbortSignal): Promise<CatalogEntry[]> {
  const data = await requestData(base, `/${kind}`, { headers: { Authorization: `Bearer ${token}` }, signal });
  return parseCatalogRows(data, kind);
}

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

export function catalogPage(rows: CatalogEntry[], query: string, page: number, size = 20) {
  const search = query.trim().toLocaleLowerCase('es');
  const filtered = rows.filter((row) => [row.name, row.email, row.taxId, row.sku].some((value) => value?.toLocaleLowerCase('es').includes(search)));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(Math.max(0, page), pages - 1);
  return { rows: filtered.slice(current * size, (current + 1) * size), total: filtered.length, pages, current };
}

export async function updatePartner(base: string, kind: 'customers' | 'suppliers', token: string, id: string, draft: PartnerDraft, signal: AbortSignal, original?: CatalogEntry): Promise<void> {
  const payload = {...validatePartner(draft), ...(original?{expected:{name:original.name,taxId:original.taxId,email:original.email}}:{})};
  if (!/^[a-f0-9]{24}$/i.test(id)) throw new ApiError('Selecciona un contacto válido.');
  try {
    const data = await requestData(base, '/' + kind + '/' + id, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || data.id !== id || data.name !== payload.name || data.taxId !== payload.taxId || data.email !== payload.email || !['ACTIVE', 'INACTIVE'].includes(String(data.status))) throw new ApiError('No se pudo confirmar la actualización.');
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar la actualización. Actualiza el catálogo antes de volver a guardar.');
  }
}

export async function updateProductRequest(base: string, token: string, id: string, draft: ProductDraft, signal: AbortSignal, original?: CatalogEntry): Promise<void> {
  const validated = validateProduct(draft);
  if (!/^[a-f0-9]{24}$/i.test(id) || !/^[a-f0-9]{24}$/i.test(validated.categoryId) || !Number.isSafeInteger(Math.round(validated.price * 100))) throw new ApiError('Revisa el producto, categoría e importe.');
  const payload = { name: validated.name, categoryId: validated.categoryId, price: validated.price, ...(original?{expected:{name:original.name,categoryId:original.categoryId,price:original.price,sku:original.sku}}:{}) };
  try {
    const data = await requestData(base, '/products/' + id, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal });
    if (!record(data) || data.id !== id || data.name !== payload.name || data.categoryId !== payload.categoryId || data.price !== payload.price || data.sku !== validated.sku || !['ACTIVE', 'INACTIVE'].includes(String(data.status))) throw new ApiError('No se pudo confirmar el producto.');
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    throw new ApiError('No se pudo confirmar la edición. Actualiza el catálogo antes de guardar otra vez.');
  }
}

export type RenameKind = 'categories' | 'warehouses';
export async function renameCatalogEntry(base: string, token: string, kind: RenameKind, id: string, expectedName: string, name: string, signal: AbortSignal): Promise<string> {
 const cleanName = name.trim();
 if (!/^[a-f0-9]{24}$/i.test(id) || cleanName.length < 2 || cleanName.length > 100 || expectedName.trim().length < 2 || expectedName.trim().length > 100) throw new ApiError('El nombre debe tener entre 2 y 100 caracteres.');
 try {
  const data = await requestData(base, '/' + kind + '/' + id, { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: cleanName, expectedName: expectedName.trim() }), signal });
  if (!record(data) || data.id !== id || data.name !== cleanName || typeof data.code !== 'string' || !data.code || !['ACTIVE', 'INACTIVE'].includes(String(data.status))) throw new ApiError('No se pudo confirmar el nombre.');
  return cleanName;
 } catch (error) {
  if (error instanceof ApiError && error.status === 409) throw new ApiError('El nombre cambió o el registro no está disponible. Actualiza el catálogo.', 409);
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
  throw new ApiError('No se pudo confirmar el cambio. Actualiza el catálogo antes de guardar otra vez.');
 }
}

export type CatalogStatus = 'ACTIVE' | 'INACTIVE';
export async function updateCatalogStatus(base: string, token: string, kind: RenameKind, entry: { id: string; name: string; code: string; status: CatalogStatus }, signal: AbortSignal): Promise<CatalogStatus> {
 if (!/^[a-f0-9]{24}$/i.test(entry.id) || !['ACTIVE','INACTIVE'].includes(entry.status)) throw new ApiError('Selecciona un registro válido.');
 const status: CatalogStatus = entry.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
 try {
  const data = await requestData(base, '/' + kind + '/' + entry.id + '/status', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedStatus: entry.status, status }), signal });
  if (!record(data) || data.id !== entry.id || data.name !== entry.name || data.code !== entry.code || data.status !== status) throw new ApiError('No se pudo confirmar el estado.');
  return status;
 } catch (error) {
  if (error instanceof ApiError && error.status === 409) throw new ApiError('El estado cambió o el registro no está disponible. Actualiza el catálogo.', 409);
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
  throw new ApiError('No se pudo confirmar el estado. Actualiza el catálogo antes de volver a guardar.');
 }
}
export async function categoryDirectoryRequest(base: string, token: string, signal: AbortSignal): Promise<Array<{ id: string; name: string; code: string; status: CatalogStatus }>> {
 const data = await requestData(base, '/categories', { headers: { Authorization: 'Bearer ' + token }, signal });
 if (!Array.isArray(data)) throw new ApiError('La API devolvió categorías inesperadas.');
 const ids = new Set<string>();
 return data.map(row => { if (!record(row) || typeof row.id !== 'string' || !row.id || ids.has(row.id) || typeof row.name !== 'string' || !row.name || typeof row.code !== 'string' || !row.code || !['ACTIVE','INACTIVE'].includes(String(row.status))) throw new ApiError('La API devolvió categorías inesperadas.'); ids.add(row.id); return { id: row.id, name: row.name, code: row.code, status: row.status as CatalogStatus }; });
}

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
