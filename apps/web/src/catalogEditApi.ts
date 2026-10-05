import type {CatalogEntry} from './catalogApi';
import {ApiError,requestData} from './webApi';
export type PartnerDraft={name:string;taxId:string;email:string};
export type ProductDraft={name:string;sku:string;categoryId:string;price:string};
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
export function validateProduct(draft: ProductDraft) {
  const name = draft.name.trim(); const sku = draft.sku.trim().toUpperCase();
  const priceText = draft.price.trim(); const categoryId = draft.categoryId.trim();
  if (name.length < 2 || name.length > 120) throw new ApiError('El nombre debe tener entre 2 y 120 caracteres.');
  if (!sku || sku.length > 48) throw new ApiError('El SKU debe tener entre 1 y 48 caracteres.');
  if (!categoryId || categoryId.length > 100) throw new ApiError('Selecciona una categoría activa.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText) || !Number.isFinite(Number(priceText))) throw new ApiError('Escribe un precio válido con hasta dos decimales y punto decimal.');
  return { name, sku, categoryId, price: Number(priceText) };
}
export function validatePartner(draft: PartnerDraft): PartnerDraft {
  const value = { name: draft.name.trim(), taxId: draft.taxId.trim().toUpperCase(), email: draft.email.trim().toLowerCase() };
  if (value.name.length < 2 || value.name.length > 120) throw new ApiError('El nombre debe tener entre 2 y 120 caracteres.');
  if (value.taxId.length < 3 || value.taxId.length > 32) throw new ApiError('El identificador fiscal debe tener entre 3 y 32 caracteres.');
  if (value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new ApiError('Escribe un correo electrónico válido.');
  return value;
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
