import { CatalogExportButtons } from './CatalogExportButtons';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, catalogServerPage, createPartner, updatePartner, type CatalogEntry, type CatalogKind } from './api';
import { ProductForm } from './ProductForm';

const titles: Record<CatalogKind, string> = { customers: 'Clientes', suppliers: 'Proveedores', products: 'Productos' };
export function CatalogPanel({ base, token, kind, companyId, branchId, accent, canCreate, onExpired, onClose, onEdit }: {
  base: string; token: string; kind: CatalogKind; companyId: string; branchId: string; accent: string; canCreate: boolean; onExpired: () => void; onClose: () => void; onEdit: () => void;
}) {
  const [productBusy, setProductBusy] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogEntry | null>(null);
  const [rows, setRows] = useState<CatalogEntry[]>([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [cursors, setCursors] = useState<string[]>(['']);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const cursor = cursors[cursors.length - 1];
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState({ name: '', taxId: '', email: '' });
  const [editingOriginal,setEditingOriginal]=useState<CatalogEntry|null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');
  const saveController = useRef<AbortController | null>(null);
  useEffect(() => () => saveController.current?.abort(), []);
  async function save() {
    if (kind === 'products' || !canCreate || saveController.current) return;
    const controller = new AbortController();
    saveController.current = controller;
    setSaving(true); setSaveError(''); setNotice('');
    try {
      if (editingId) await updatePartner(base, kind, token, editingId, draft, controller.signal, editingOriginal ?? undefined);
      else await createPartner(base, kind, token, draft, controller.signal);
      if (controller.signal.aborted) return;
      setDraft({ name: '', taxId: '', email: '' }); setQuery(''); setSearch(''); setCursors(['']);
      setNotice(editingId ? 'Contacto actualizado correctamente.' : 'Registro creado correctamente.'); setEditingOriginal(null); setEditingId(null); setRevision((value) => value + 1);
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setSaveError(failure instanceof Error ? failure.message : 'No se pudo confirmar el guardado.');
    } finally {
      saveController.current = null;
      if (!controller.signal.aborted) setSaving(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    setRows([]); setNextCursor(null); setLoading(true); setError('');
    catalogServerPage(base, kind, token, controller.signal, search, cursor).then((data) => {
      if (!controller.signal.aborted) { setRows(data.items); setNextCursor(data.nextCursor); }
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudo consultar el catálogo.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, kind, revision, search, cursor, onExpired]);
  const busy = saving || productBusy;

  return <View style={styles.panel}>
    <Text style={styles.title}>{titles[kind]}</Text>
    <CatalogExportButtons base={base} token={token} kind={kind} search={search} companyId={companyId} branchId={branchId} accent={accent} disabled={loading || busy || !!error} onExpired={onExpired}/>
    {kind === 'products' && canCreate ? <ProductForm onBusy={setProductBusy} key={editingProduct?.id ?? 'new-product'} editing={editingProduct} onCancel={() => setEditingProduct(null)} base={base} token={token} accent={accent} onExpired={onExpired} onCreated={() => { setNotice(editingProduct ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'); setEditingProduct(null); setQuery(''); setSearch(''); setCursors(['']); setRevision((value) => value + 1); }} /> : null}
    {kind === 'products' && notice ? <Text accessibilityRole="alert" style={styles.note}>{notice}</Text> : null}
    <Text style={styles.note}>{kind === 'products' ? 'Catálogo de la empresa; no representa existencias.' : 'Contactos de tu empresa y sucursal.'}</Text>
    {kind !== 'products' && canCreate ? <View>
      <Text style={styles.name}>{editingId ? 'Editar contacto' : kind === 'customers' ? 'Nuevo cliente' : 'Nuevo proveedor'}</Text>
      {(['name', 'taxId', 'email'] as const).map((field) => <View key={field}>
        <Text style={styles.note}>{field === 'name' ? 'Nombre' : field === 'taxId' ? 'Identificador fiscal' : 'Correo electrónico'}</Text>
        <TextInput accessibilityLabel={field === 'name' ? 'Nombre del contacto' : field === 'taxId' ? 'Identificador fiscal del contacto' : 'Correo del contacto'} editable={!saving} autoCapitalize={field === 'email' ? 'none' : field === 'taxId' ? 'characters' : 'words'} keyboardType={field === 'email' ? 'email-address' : 'default'} maxLength={field === 'name' ? 120 : field === 'taxId' ? 32 : 254} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} style={styles.input} />
      </View>)}
      {saveError ? <Text accessibilityRole="alert" style={styles.error}>{saveError}</Text> : null}
      {notice ? <Text style={styles.note}>{notice}</Text> : null}
      <Pressable accessibilityRole="button" disabled={saving || loading || !!error} onPress={save} style={styles.actions}><Text style={{ color: saving || loading || error ? '#718096' : accent }}>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar contacto'}</Text></Pressable>
    {editingId ? <Pressable disabled={saving} onPress={() => { setEditingOriginal(null); setEditingId(null); setDraft({ name: '', taxId: '', email: '' }); setSaveError(''); setNotice(''); }}><Text style={{ color: accent }}>Cancelar edición</Text></Pressable> : null}
    </View> : kind !== 'products' ? <Text style={styles.note}>Tu cuenta no tiene permiso para crear contactos.</Text> : null}
    <TextInput accessibilityLabel="Buscar en el catálogo" placeholder="Buscar nombre, correo, RFC o SKU" placeholderTextColor="#8B99A8" maxLength={100} editable={!busy} value={query} onChangeText={setQuery} style={styles.input} />
    <View style={styles.actions}><Pressable accessibilityRole="button" disabled={busy || loading} onPress={() => { setSearch(query.trim()); setCursors(['']); setRevision(value => value + 1); }}><Text style={{ color: accent }}>Buscar</Text></Pressable><Pressable accessibilityRole="button" disabled={busy || loading} onPress={() => { setQuery(''); setSearch(''); setCursors(['']); setRevision(value => value + 1); }}><Text style={{ color: accent }}>Ver todos</Text></Pressable></View>
    {loading ? <Text style={styles.note}>Consultando catálogo…</Text> : error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : <>
      <Text style={styles.note}>{rows.length} registros en esta página · Página {cursors.length}</Text>
      {!rows.length ? <Text style={styles.note}>{search ? 'No hay coincidencias en esta página.' : 'No hay registros en esta página.'}</Text> : null}
      <Text style={styles.note}>Hasta 20 por página; registros más recientes primero.</Text>
      {rows.map((row) => <View style={styles.row} key={row.id}>
        <Text style={styles.name}>{row.name}</Text>
        {kind === 'products' && canCreate && row.categoryId ? <Pressable accessibilityRole="button" disabled={productBusy} onPress={() => { setNotice(''); setEditingProduct(row); onEdit(); }} style={styles.actions}><Text style={{ color: accent }}>Editar producto</Text></Pressable> : null}
        {kind !== 'products' && canCreate ? <Pressable accessibilityRole="button" disabled={saving} onPress={() => { setEditingOriginal(row); setEditingId(row.id); setDraft({ name: row.name, taxId: row.taxId ?? '', email: row.email ?? '' }); setSaveError(''); setNotice(''); onEdit(); }} style={styles.actions}><Text style={{ color: accent }}>Editar contacto</Text></Pressable> : null}
        <Text style={styles.note}>{row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</Text>
        {kind === 'products' ? <Text style={styles.note}>SKU: {row.sku} · Precio: {row.price?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (moneda no informada)</Text> : <Text style={styles.note}>{row.taxId}{'\n'}{row.email}</Text>}
      </View>)}
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" disabled={busy || loading || cursors.length === 1} onPress={() => setCursors(values => values.slice(0, -1))}><Text style={{ color: busy || loading || cursors.length === 1 ? '#718096' : accent }}>Anterior</Text></Pressable>
        <Pressable accessibilityRole="button" disabled={busy || loading || !nextCursor} onPress={() => { if (nextCursor) setCursors(values => [...values, nextCursor]); }}><Text style={{ color: busy || loading || !nextCursor ? '#718096' : accent }}>Siguiente</Text></Pressable>
      </View>
    </>}
    <View style={styles.actions}><Pressable accessibilityRole="button" disabled={loading || busy} onPress={() => { if (!busy) { setCursors(['']); setRevision((value) => value + 1); } }}><Text style={{ color: loading || busy ? '#718096' : accent }}>{busy ? 'Guardado en curso…' : loading ? 'Consultando…' : error ? 'Reintentar' : 'Actualizar'}</Text></Pressable><Pressable accessibilityRole="button" disabled={busy} onPress={() => { if (!busy) onClose(); }}><Text style={{ color: accent }}>Volver al panel</Text></Pressable></View>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: '#111923', padding: 16, borderRadius: 18, marginBottom: 24 },
  title: { color: '#F1F5F9', fontWeight: '700', fontSize: 20, marginBottom: 10 },
  name: { color: '#F1F5F9', fontSize: 15, fontWeight: '600' },
  note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 },
  error: { color: '#F87171', fontSize: 12 },
  input: { color: '#F1F5F9', backgroundColor: '#0B1016', borderRadius: 10, padding: 12, marginVertical: 12 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#293746' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }
});
