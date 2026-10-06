import { ApiError, requestData, type RenameKind } from './api';
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
export async function updateCatalogCode(base: string, token: string, kind: RenameKind, entry: { id: string; code: string }, code: string, signal: AbortSignal): Promise<string> {
 const clean = code.trim().toUpperCase(), maximum = kind === 'categories' ? 24 : 32;
 if (!/^[a-f0-9]{24}$/i.test(entry.id) || clean.length < 2 || clean.length > maximum || entry.code.length < 2 || entry.code.length > maximum) throw new ApiError(`El código debe tener entre 2 y ${maximum} caracteres.`);
 if (clean === entry.code) throw new ApiError('Escribe un código diferente del actual.');
 try {
  const data = await requestData(base, '/' + kind + '/' + entry.id + '/code', { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedCode: entry.code, code: clean }), signal });
  if (!record(data) || data.id !== entry.id || data.code !== clean || typeof data.name !== 'string' || !data.name || !['ACTIVE', 'INACTIVE'].includes(String(data.status))) throw new ApiError('No se pudo confirmar el código.');
  return clean;
 } catch (error) {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
  throw new ApiError('No se pudo confirmar el cambio. Actualiza el catálogo antes de guardar otra vez.');
 }
}
