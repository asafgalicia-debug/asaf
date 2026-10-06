import { StatusEditor } from './StatusEditor';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { categoryPageRequest, categoryLookup, type CategoryRow } from './categoryApi';
import { CodeEditor } from './CodeEditor';
import { NameEditor } from './NameEditor';
import { ApiError, createCategoryRequest, createProductRequest, updateProductRequest, type CatalogEntry, type CatalogStatus } from './api';

export function ProductForm({ base, token, accent, onExpired, onCreated, editing, onCancel, onBusy }: { base: string; token: string; accent: string; onExpired: () => void; onCreated: () => void; editing?: CatalogEntry | null; onCancel: () => void; onBusy: (busy: boolean) => void }) {
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string; status: CatalogStatus }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [cursors, setCursors] = useState(['']);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursor = cursors[cursors.length - 1];
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [categoryError, setCategoryError] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ name: '', sku: '', price: '', categoryId: '' });
  useEffect(() => {
    setDraft(editing ? { name: editing.name, sku: editing.sku ?? '', price: String(editing.price ?? ''), categoryId: editing.categoryId ?? '' } : { name: '', sku: '', price: '', categoryId: '' });
    setSelectedCategory(null); setCursors(['']); setError(''); setNotice('');
  }, [editing]);
  const [categoryDraft, setCategoryDraft] = useState({ name: '', code: '' });
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categorySaveError, setCategorySaveError] = useState('');
  const [categoryNotice, setCategoryNotice] = useState('');
  useEffect(() => { onBusy(saving || creatingCategory || categoryBusy); return () => onBusy(false); }, [saving, creatingCategory, categoryBusy, onBusy]);
  const write = useRef<AbortController | null>(null);
  const loadedEditing = useRef<CatalogEntry | null | undefined>(undefined);
  useEffect(() => () => write.current?.abort(), []);
  useEffect(() => {
    const controller = new AbortController();
    const editingChanged = loadedEditing.current !== editing; loadedEditing.current = editing;
    const selectedId = editingChanged ? editing?.categoryId ?? '' : draft.categoryId;
    setLoading(true); setCategoryError(''); setCategories([]); setNextCursor(null);
    Promise.all([categoryPageRequest(base, token, controller.signal, appliedSearch, cursor), categoryLookup(base, token, controller.signal, selectedId ? [selectedId] : [])]).then(([page, selected]) => {
      if (controller.signal.aborted) return;
      setCategories(page.items); setNextCursor(page.nextCursor); const active = selected.find(row=>row.status==='ACTIVE') ?? null; setSelectedCategory(active); setDraft(value=>({...value,categoryId:active?.id ?? ''}));
    }).catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setCategoryError(failure instanceof Error ? failure.message : 'No se pudieron consultar las categorías.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, revision, appliedSearch, cursor, editing, onExpired]);
  async function saveCategory() {
    if (write.current || categoryBusy || loading || categoryError) return;
    const controller = new AbortController(); write.current = controller;
    setCreatingCategory(true); setCategorySaveError(''); setCategoryNotice('');
    try {
      const category = await createCategoryRequest(base, token, categoryDraft, controller.signal);
      if (controller.signal.aborted) return;
      setCursors(['']); setRevision(value=>value+1);
      setSelectedCategory({ ...category, code: categoryDraft.code.trim().toUpperCase(), status: 'ACTIVE' }); setDraft((value) => ({ ...value, categoryId: category.id }));
      setCategoryDraft({ name: '', code: '' }); setCategoryNotice('Categoría creada y seleccionada.');
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setCategorySaveError(failure instanceof Error ? failure.message : 'No se pudo confirmar la categoría.');
    } finally { write.current = null; if (!controller.signal.aborted) setCreatingCategory(false); }
  }
  async function save() {
    if (write.current || categoryBusy || loading || !(selectedCategory?.id === draft.categoryId && selectedCategory?.status === 'ACTIVE')) return;
    const controller = new AbortController(); write.current = controller;
    setSaving(true); setError(''); setNotice('');
    try {
      if (editing) await updateProductRequest(base, token, editing.id, draft, controller.signal, editing);
      else await createProductRequest(base, token, draft, controller.signal);
      if (controller.signal.aborted) return;
      setSelectedCategory(null); setDraft({ name: '', sku: '', price: '', categoryId: '' }); setNotice(editing ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'); onCreated();
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el guardado.');
    } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  return <View>
    {!editing ? <View>
    <Text style={styles.title}>Nueva categoría</Text>
    {(['name', 'code'] as const).map((field) => <View key={field}><Text style={styles.note}>{field === 'name' ? 'Nombre de categoría' : 'Código de categoría'}</Text><TextInput accessibilityLabel={field === 'name' ? 'Nombre de categoría' : 'Código de categoría'} editable={!saving && !creatingCategory && !categoryBusy} maxLength={field === 'name' ? 100 : 24} autoCapitalize={field === 'code' ? 'characters' : 'words'} value={categoryDraft[field]} onChangeText={(value) => setCategoryDraft((current) => ({ ...current, [field]: value }))} style={styles.input} /></View>)}
    {categorySaveError ? <Text accessibilityRole="alert" style={styles.error}>{categorySaveError}</Text> : null}
    {categoryNotice ? <Text style={styles.note}>{categoryNotice}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving || creatingCategory || categoryBusy || loading || !!categoryError} onPress={saveCategory} style={styles.option}><Text style={{ color: saving || creatingCategory || categoryBusy || loading || categoryError ? '#718096' : accent }}>{creatingCategory ? 'Guardando categoría…' : 'Crear y seleccionar categoría'}</Text></Pressable>
    </View> : null}
    <Text style={styles.title}>{editing ? 'Editar producto' : 'Nuevo producto'}</Text>
    {editing ? <Text style={styles.note}>El SKU se conserva. Estos cambios no registran movimientos de inventario.</Text> : null}
    {(['name', 'sku', 'price'] as const).map((field) => <View key={field}><Text style={styles.note}>{field === 'name' ? 'Nombre' : field === 'sku' ? 'SKU' : 'Precio (punto decimal)'}</Text><TextInput accessibilityLabel={field === 'name' ? 'Nombre del producto' : field === 'sku' ? 'SKU del producto' : 'Precio del producto'} editable={!saving && !creatingCategory && !categoryBusy && !(editing && field === 'sku')} keyboardType={field === 'price' ? 'decimal-pad' : 'default'} maxLength={field === 'name' ? 120 : field === 'sku' ? 48 : 18} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} style={styles.input} /></View>)}
    <Text style={styles.note}>Categoría activa</Text>
    {selectedCategory ? <Text style={{color:accent}}>Seleccionada: {selectedCategory.name} · {selectedCategory.code}</Text> : null}
    <TextInput accessibilityLabel="Buscar categorías" maxLength={100} editable={!saving && !creatingCategory && !categoryBusy} value={search} onChangeText={setSearch} placeholder="Buscar nombre o código" placeholderTextColor="#8B99A8" style={styles.input}/>
    <View style={{flexDirection:'row',justifyContent:'space-between'}}><Pressable disabled={loading || saving || creatingCategory || categoryBusy} onPress={()=>{setAppliedSearch(search.trim());setCursors(['']);setRevision(v=>v+1);}} style={styles.option}><Text style={{color:accent}}>Buscar</Text></Pressable><Pressable disabled={loading || saving || creatingCategory || categoryBusy} onPress={()=>{setSearch('');setAppliedSearch('');setCursors(['']);setRevision(v=>v+1);}} style={styles.option}><Text style={{color:accent}}>Ver todos</Text></Pressable></View>
    <Text style={styles.note}>Página {cursors.length} · {categories.length} categorías en esta página</Text>
    {loading ? <Text style={styles.note}>Consultando categorías…</Text> : categoryError ? <Text accessibilityRole="alert" style={styles.error}>{categoryError}</Text> : categories.length ? categories.map((category) => <View key={category.id}><Pressable accessibilityRole="radio" accessibilityState={{ checked: draft.categoryId === category.id }} disabled={saving || creatingCategory || categoryBusy || category.status !== 'ACTIVE'} onPress={() => { setSelectedCategory(category); setDraft((current) => ({ ...current, categoryId: category.id })); }} style={styles.option}><Text style={{ color: accent }}>{draft.categoryId === category.id ? '● ' : '○ '}{category.name} · {category.code} · {category.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}</Text></Pressable><NameEditor base={base} token={token} kind="categories" entry={category} accent={accent} disabled={saving || creatingCategory || categoryBusy} onBusy={setCategoryBusy} onExpired={onExpired} onSaved={(name) => { setCategories(rows => rows.map(row => row.id === category.id ? { ...row, name } : row)); setSelectedCategory(row=>row?.id===category.id?{...row,name}:row); }} /><CodeEditor base={base} token={token} kind="categories" entry={category} accent={accent} disabled={saving || creatingCategory || categoryBusy} onBusy={setCategoryBusy} onExpired={onExpired} onSaved={(code)=>{setCategories(rows=>rows.map(row=>row.id===category.id?{...row,code}:row));setSelectedCategory(row=>row?.id===category.id?{...row,code}:row);}}/><StatusEditor base={base} token={token} kind="categories" entry={category} accent={accent} disabled={saving || creatingCategory || categoryBusy} onBusy={setCategoryBusy} onExpired={onExpired} onSaved={(status) => { setCategories(rows => rows.map(row => row.id === category.id ? { ...row, status } : row)); if (status === 'INACTIVE') { setSelectedCategory(row=>row?.id===category.id?null:row); setDraft(current => ({ ...current, categoryId: current.categoryId === category.id ? '' : current.categoryId })); } }} /></View>) : <Text style={styles.note}>{editing ? 'No hay categorías activas. Cancela la edición para crear una categoría.' : 'Crea una categoría activa en el formulario de arriba para registrar productos.'}</Text>}
    <View style={{flexDirection:'row',justifyContent:'space-between'}}><Pressable disabled={loading || saving || creatingCategory || categoryBusy || cursors.length===1} onPress={()=>setCursors(v=>v.slice(0,-1))} style={styles.option}><Text style={{color:accent}}>Anterior</Text></Pressable><Pressable disabled={loading || saving || creatingCategory || categoryBusy || !nextCursor} onPress={()=>{if(nextCursor)setCursors(v=>[...v,nextCursor]);}} style={styles.option}><Text style={{color:accent}}>Siguiente</Text></Pressable></View>
    <Pressable accessibilityRole="button" disabled={loading || saving || creatingCategory || categoryBusy} onPress={() => setRevision((value) => value + 1)} style={styles.option}><Text style={{ color: accent }}>Actualizar categorías</Text></Pressable>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text style={styles.note}>{notice}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving || creatingCategory || categoryBusy || loading || !!categoryError || !draft.categoryId} onPress={save} style={styles.option}><Text style={{ color: saving || creatingCategory || categoryBusy || loading || categoryError || !draft.categoryId ? '#718096' : accent }}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Guardar producto'}</Text></Pressable>
    {editing ? <Pressable disabled={saving || creatingCategory || categoryBusy} onPress={onCancel} style={styles.option}><Text style={{ color: accent }}>Cancelar edición</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({ title: { color: '#F1F5F9', fontSize: 16, fontWeight: '700', marginTop: 12 }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, input: { backgroundColor: '#0B1016', color: '#F1F5F9', padding: 12, borderRadius: 10, marginVertical: 10 }, option: { paddingVertical: 12 }, error: { color: '#F87171', fontSize: 12 } });
