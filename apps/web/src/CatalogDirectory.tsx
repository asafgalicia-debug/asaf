import {CatalogExportButtons} from './CatalogExportButtons';
import {CatalogEdit} from './CatalogEdit';
import type {CatalogEntry} from './catalogApi';
import {CatalogAdmin} from './CatalogAdmin';
import {CategorySelector} from './CategorySelector';
import {type CategoryRow} from './categoryApi';
import { useEffect, useState, type FormEvent } from 'react';

type Entry = { id: string; name: string; status: string; email?: string; taxId?: string; sku?: string; price?: number };
export function CatalogDirectory({ kind, apiUrl, token, canCreate, companyId, branchId }: {
  kind: 'customers' | 'suppliers' | 'products'; apiUrl: string; token: string; canCreate: boolean; companyId: string; branchId: string;
}) {
  const [editing,setEditing]=useState<CatalogEntry|null>(null);
  const [rows, setRows] = useState<Entry[]>([]);
  const [search,setSearch]=useState(''),[appliedSearch,setAppliedSearch]=useState(''),[cursors,setCursors]=useState(['']),[nextCursor,setNextCursor]=useState<string|null>(null),[revision,setRevision]=useState(0);
  const cursor=cursors[cursors.length-1];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ name: '', taxId: '', email: '' });
  const [productDraft, setProductDraft] = useState({ name: '', categoryId: '', sku: '', price: '' });
  const [selectedCategory,setSelectedCategory] = useState<CategoryRow|null>(null);
  const [categoryRevision,setCategoryRevision] = useState(0);
  const [categoryError, setCategoryError] = useState('');
  const [categoryDraft, setCategoryDraft] = useState({ name: '', code: '' });
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState('');
  async function read(response: Response) {
    if (response.status === 401) throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.');
    if (response.status === 403) throw new Error('No tienes permiso para esta operación.');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'No se pudo completar la operación.');
    return result.data;
  }
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setRows([]); setNextCursor(null);
    fetch(`${apiUrl}/${kind}/page?${new URLSearchParams({search:appliedSearch,limit:'20',...(cursor?{cursor}:{})})}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then(read).then((data) => {
        if (!data || !Array.isArray(data.items) || data.items.length>20 || !(data.nextCursor===null || typeof data.nextCursor==='string' && /^[a-f0-9]{24}$/i.test(data.nextCursor)) || data.items.some((row:Entry,index:number)=>!row || !/^[a-f0-9]{24}$/i.test(row.id) || typeof row.name!=='string' || (index>0 && row.id.toLowerCase()>=data.items[index-1].id.toLowerCase()) || (cursor && row.id.toLowerCase()>=cursor.toLowerCase())) || data.nextCursor!==null && (data.items.length!==20 || data.nextCursor!==data.items.at(-1)?.id)) throw new Error('El servidor devolvió una página inválida.');
        if (!controller.signal.aborted) {setRows(data.items);setNextCursor(data.nextCursor);}
      }).catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof TypeError ? 'No se pudo conectar con el servidor.' : cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiUrl, kind, token,appliedSearch,cursor,revision]);
  async function create(event: FormEvent) {
    event.preventDefault(); if (saving || categorySaving || !canCreate) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = kind !== 'products' ? draft : { ...productDraft, price: Number(productDraft.price) };
      if (kind === 'products' && (!selectedCategory || selectedCategory.id !== productDraft.categoryId || selectedCategory.status !== 'ACTIVE' || !productDraft.price.trim() || !Number.isFinite(Number(productDraft.price)) || Number(productDraft.price) < 0)) throw new Error('Selecciona una categoría y un precio válido.');
      const data = await read(await fetch(`${apiUrl}/${kind}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      }));
      if (!data?.id) throw new Error('No se pudo confirmar el alta.');
      setCursors(['']);setRevision(value=>value+1);
      setDraft({ name: '', taxId: '', email: '' });
      setProductDraft({ name: '', categoryId: '', sku: '', price: '' });
      setSelectedCategory(null);
      setNotice(kind !== 'products' ? (kind==='customers'?'Cliente creado correctamente.':'Proveedor creado correctamente.') : 'Producto creado correctamente.');
    } catch (cause) { setError(cause instanceof TypeError ? 'No se pudo confirmar el guardado. Revisa el directorio antes de reintentar.' : cause instanceof Error ? cause.message : 'Error al guardar.'); }
    finally { setSaving(false); }
  }
  async function createCategory(event: FormEvent) {
    event.preventDefault();
    if (categorySaving || saving || !canCreate) return;
    setCategorySaving(true); setCategoryError(''); setCategoryNotice('');
    try {
      const data = await read(await fetch(`${apiUrl}/categories`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({name:categoryDraft.name.trim(),code:categoryDraft.code.trim().toUpperCase()})
      }));
      if (!/^[a-f0-9]{24}$/i.test(data?.id ?? '') || data.status !== 'ACTIVE' || data.name !== categoryDraft.name.trim() || data.code !== categoryDraft.code.trim().toUpperCase()) throw new Error('No se pudo confirmar la categoría creada.');
      setSelectedCategory(data);setCategoryRevision(v=>v+1);
      setProductDraft((current) => ({ ...current, categoryId: data.id }));
      setCategoryDraft({ name: '', code: '' });
      setCategoryNotice('Categoría creada y seleccionada para el producto.');
    } catch (cause) {
      setCategoryError(cause instanceof TypeError ? 'No se pudo confirmar el guardado. Revisa las categorías antes de reintentar.' : cause instanceof Error ? cause.message : 'No se pudo crear la categoría.');
    } finally { setCategorySaving(false); }
  }
  return <><section className="panel"><CatalogExportButtons base={apiUrl} token={token} kind={kind} search={appliedSearch} companyId={companyId} branchId={branchId} disabled={loading||saving||!!error}/>
    <div className="panel-title"><h3>{kind !== 'products' ? (kind==='customers'?'Clientes':'Proveedores') : 'Productos de la empresa'}</h3><span>{loading ? 'CARGANDO' : `PÁGINA ${cursors.length} · ${rows.length} REGISTROS`}</span></div>
    {editing&&canCreate&&<CatalogEdit key={editing.id} apiUrl={apiUrl} token={token} kind={kind} entry={editing} onCancel={()=>setEditing(null)} onSaved={()=>{setEditing(null);setCursors(['']);setRevision(v=>v+1);setNotice('Edición confirmada.');}}/>}
    {kind !== 'products' && canCreate && !editing && <form onSubmit={create}><fieldset disabled={saving || loading} style={{ border: 0, padding: 0 }}><legend>{kind==='customers'?'Nuevo cliente':'Nuevo proveedor'}</legend>
      <div className="field"><label htmlFor="supplier-name">Nombre</label><input id="supplier-name" required minLength={2} maxLength={120} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></div>
      <div className="field"><label htmlFor="supplier-tax">Identificador fiscal</label><input id="supplier-tax" required minLength={3} maxLength={32} value={draft.taxId} onChange={(e) => setDraft({ ...draft, taxId: e.target.value })} /></div>
      <div className="field"><label htmlFor="supplier-email">Correo</label><input id="supplier-email" type="email" required maxLength={254} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></div>
      <button className="primary-button" type="submit">{saving ? 'Guardando...' : (kind==='customers'?'Crear cliente':'Crear proveedor')}</button>
    </fieldset></form>}
    {kind === 'products' && canCreate && !editing && <form onSubmit={createCategory}>
      <fieldset disabled={categorySaving || saving} style={{ border: 0, padding: 0 }}>
        <legend>Nueva categoría</legend>
        <div className="field"><label htmlFor="category-name">Nombre</label><input id="category-name" required minLength={2} maxLength={100} value={categoryDraft.name} onChange={(e) => setCategoryDraft({ ...categoryDraft, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="category-code">Código</label><input id="category-code" required minLength={2} maxLength={24} value={categoryDraft.code} onChange={(e) => setCategoryDraft({ ...categoryDraft, code: e.target.value })} /></div>
        <button className="primary-button" type="submit">{categorySaving ? 'Guardando...' : 'Crear categoría'}</button>
      </fieldset>
      {categoryNotice && <p role="status">{categoryNotice}</p>}{categoryError && <p role="alert">{categoryError}</p>}
    </form>}
    {kind === 'products' && canCreate && !editing && <form onSubmit={create}><fieldset disabled={saving || loading || categorySaving} style={{ border: 0, padding: 0 }}><legend>Nuevo producto</legend>
      <div className="field"><label htmlFor="product-name">Nombre</label><input id="product-name" required minLength={2} maxLength={120} value={productDraft.name} onChange={(e) => setProductDraft({ ...productDraft, name: e.target.value })} /></div>
      <CategorySelector key={categoryRevision} apiUrl={apiUrl} token={token} label="Categoría activa" selected={selectedCategory} disabled={saving || categorySaving} onSelect={row=>{setSelectedCategory(row);setProductDraft(current=>({...current,categoryId:row.id}));}}/>
      <div className="field"><label htmlFor="product-sku">SKU</label><input id="product-sku" required maxLength={48} value={productDraft.sku} onChange={(e) => setProductDraft({ ...productDraft, sku: e.target.value })} /></div>
      <div className="field"><label htmlFor="product-price">Precio</label><input id="product-price" type="number" required min="0" step="0.01" value={productDraft.price} onChange={(e) => setProductDraft({ ...productDraft, price: e.target.value })} /></div>
      <button className="primary-button" type="submit">{saving ? 'Guardando...' : 'Crear producto'}</button>
    </fieldset>{categoryError && <p role="alert">{categoryError}</p>}</form>}
    {error && <p className="error-box" role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    <form onSubmit={event=>{event.preventDefault();setAppliedSearch(search.trim());setCursors(['']);setRevision(value=>value+1);}}><div className="field"><label htmlFor={kind+'-search'}>Buscar en el catálogo</label><input id={kind+'-search'} maxLength={100} value={search} disabled={saving} onChange={event=>setSearch(event.target.value)}/></div><button type="submit" disabled={loading||saving}>Buscar</button><button type="button" disabled={loading||saving} onClick={()=>{setSearch('');setAppliedSearch('');setCursors(['']);setRevision(value=>value+1);}}>Ver todos</button></form>
    {!loading && !error && !rows.length && <p>No hay registros para esta búsqueda.</p>}
    <div className="data-list">{rows.map((row) => <div className="data-row" key={row.id}><span><strong>{row.name}</strong><small>{kind !== 'products' ? `${row.taxId} · ${row.email}` : row.sku}</small></span><strong>{kind === 'products' ? row.price?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : row.status}</strong>{canCreate&&<button type="button" disabled={saving||!!editing} onClick={()=>setEditing(row as CatalogEntry)}>Editar</button>}</div>)}</div>
    <div style={{display:'flex',gap:12,marginTop:16}}><button disabled={loading||saving||cursors.length===1} onClick={()=>setCursors(value=>value.slice(0,-1))}>Anterior</button><button disabled={loading||saving||!nextCursor} onClick={()=>{if(nextCursor)setCursors(value=>[...value,nextCursor]);}}>Siguiente</button><button disabled={loading||saving} onClick={()=>{setCursors(['']);setRevision(value=>value+1);}}>Actualizar</button></div>
  </section>{kind==='products'&&<CatalogAdmin apiUrl={apiUrl} token={token} kind="categories" canEdit={canCreate} disabled={saving||categorySaving||!!editing} onChanged={()=>{setSelectedCategory(null);setProductDraft(v=>({...v,categoryId:''}));setCategoryRevision(v=>v+1);}}/>}</>;
}
