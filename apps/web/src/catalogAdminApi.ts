import {ApiError,requestData} from './webApi';
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
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