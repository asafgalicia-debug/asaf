import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, catalogLookup, type CatalogEntry } from './api';
import { WarehouseDirectory } from './WarehouseDirectory';
import { StockForm } from './StockForm';
import { WarehouseForm } from './WarehouseForm';
import { inventoryLabel, movementRequest, stockPageRequest, warehouseLookup, type StockPageBalance, type Movement, type WarehouseEntry } from './inventoryApi';

export function InventoryPanel({ base, token, accent, canCreate, onExpired }: { base: string; token: string; accent: string; canCreate: boolean; onExpired: () => void }) {
  const [warehouseCreating, setWarehouseCreating] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [warehouseBusy, setWarehouseBusy] = useState(false);
  const [tab, setTab] = useState<'balances' | 'history'>('balances');
  const [balances, setBalances] = useState<StockPageBalance[]>([]);
  const [items, setItems] = useState<Movement[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [query, setQuery] = useState({ reference: '', cursor: '' });
  const [draft, setDraft] = useState('');
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceCursors, setBalanceCursors] = useState(['']);
  const [balanceNext, setBalanceNext] = useState<string | null>(null);
  const balanceCursor = balanceCursors[balanceCursors.length - 1];
  const [products, setProducts] = useState<CatalogEntry[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseEntry[]>([]);
  const [namesError, setNamesError] = useState('');
  const [namesLoading, setNamesLoading] = useState(false);
  const [warehouseRevision, setWarehouseRevision] = useState(0);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setBalances([]); setItems([]); setNext(null); setBalanceNext(null); setProducts([]); setWarehouses([]); setNamesError(''); setNamesLoading(false);
    const load = async () => {
      if (tab === 'balances') {
        const page = await stockPageRequest(base, token, controller.signal, balanceSearch, balanceCursor);
        if (!controller.signal.aborted) { setBalances(page.items); setBalanceNext(page.nextCursor); }
      } else {
        const page = await movementRequest(base, token, controller.signal, query.reference, query.cursor);
        if (!controller.signal.aborted) { setItems(page.items); setNext(page.nextCursor); }
        if (controller.signal.aborted) return;
        setNamesLoading(true);
        const productIds = [...new Set(page.items.map(row => row.productId))];
        const warehouseIds = [...new Set(page.items.flatMap(row => [row.warehouseId, ...(row.destinationWarehouseId ? [row.destinationWarehouseId] : [])]))];
        const chunks = (ids: string[]) => Array.from({ length: Math.ceil(ids.length / 20) }, (_, i) => ids.slice(i * 20, i * 20 + 20));
        try {
          const [productPages, warehousePages] = await Promise.all([
            Promise.all(chunks(productIds).map(ids => catalogLookup(base, 'products', token, controller.signal, ids))),
            Promise.all(chunks(warehouseIds).map(ids => warehouseLookup(base, token, controller.signal, ids)))
          ]);
          if (!controller.signal.aborted) { setProducts(productPages.flat()); setWarehouses(warehousePages.flat()); }
        } catch (failure) {
          if (controller.signal.aborted) return;
          if (failure instanceof ApiError && failure.status === 401) onExpired();
          else setNamesError('No se pudieron consultar algunos nombres. Los movimientos se muestran con sus identificadores.');
        } finally { if (!controller.signal.aborted) setNamesLoading(false); }
      }
    };
    load().catch((failure) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudo consultar inventario.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, tab, query.reference, query.cursor, balanceSearch, balanceCursor, revision, onExpired]);
  const button = (label: string, action: () => void, disabled = loading || warehouseBusy || warehouseCreating || stockSaving) => <Pressable accessibilityRole="button" disabled={disabled} onPress={action} style={styles.button}><Text style={{ color: disabled ? '#718096' : accent }}>{label}</Text></Pressable>;
  return <View style={styles.panel}>
    <Text style={styles.title}>Inventario de tu sucursal</Text>
    {canCreate ? <WarehouseForm disabled={warehouseBusy || stockSaving} onBusy={setWarehouseCreating} base={base} token={token} accent={accent} onExpired={onExpired} onCreated={() => { setWarehouseRevision(v=>v+1); setBalanceCursors(['']); setRevision((value) => value + 1); }} /> : null}
    <WarehouseDirectory key={revision} base={base} token={token} accent={accent} canCreate={canCreate} disabled={warehouseBusy || warehouseCreating || stockSaving} onBusy={setWarehouseBusy} onExpired={onExpired} onChanged={() => { setWarehouseRevision(v=>v+1); setBalanceCursors(['']); setRevision(v=>v+1); }} />
    <Text style={styles.note}>Las cantidades no incluyen unidades porque la API no las informa. Los nombres corresponden al catálogo actual.</Text>
    {canCreate ? <StockForm warehouseRevision={warehouseRevision} disabled={warehouseBusy || warehouseCreating} onBusy={setStockSaving} base={base} token={token} accent={accent} onExpired={onExpired} onCreated={() => { setBalanceCursors(['']); setRevision((value) => value + 1); }} /> : null}
    {namesLoading ? <Text style={styles.note}>Consultando nombres de productos y almacenes…</Text> : null}
    {namesError ? <Text accessibilityRole="alert" style={styles.error}>{namesError}</Text> : null}
    {tab === 'balances' ? <TextInput accessibilityLabel="Buscar existencias por producto o almacén" placeholder="Nombre, SKU, almacén o identificador" placeholderTextColor="#8B99A8" maxLength={100} value={search} onChangeText={setSearch} style={styles.input} /> : null}
    {tab === 'balances' ? <View style={styles.actions}>{button('Buscar', () => { setBalanceSearch(search.trim()); setBalanceCursors(['']); setRevision(v => v + 1); })}{button('Ver todos', () => { setSearch(''); setBalanceSearch(''); setBalanceCursors(['']); setRevision(v => v + 1); })}</View> : null}
    <View style={styles.actions}>{button('Existencias', () => setTab('balances'), false)}{button('Historial', () => setTab('history'), false)}</View>
    {tab === 'history' ? <><Text style={styles.note}>Referencia exacta (opcional)</Text><TextInput accessibilityLabel="Referencia exacta del movimiento" maxLength={100} value={draft} onChangeText={setDraft} style={styles.input} /><View style={styles.actions}>{button('Buscar', () => { setQuery({ reference: draft.trim(), cursor: '' }); setRevision((value) => value + 1); })}{button('Ver todos', () => { setDraft(''); setQuery({ reference: '', cursor: '' }); setRevision((value) => value + 1); })}</View></> : null}
    {loading ? <Text style={styles.note}>Consultando inventario…</Text> : error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : tab === 'balances' ? <>
      <Text style={styles.note}>Página {balanceCursors.length} · {balances.length} registros · hasta 20 por página</Text>
      {!balances.length ? <Text style={styles.note}>No hay existencias para esta consulta.</Text> : null}
      {balances.map(row => <View key={`${row.warehouseId}:${row.productId}`} style={styles.row}><Text style={styles.note}>Producto: {row.productName ? `${row.productName} (${row.productId})` : inventoryLabel(row.productId, products)}{'\n'}Almacén: {row.warehouseName ? `${row.warehouseName} (${row.warehouseId})` : inventoryLabel(row.warehouseId, warehouses)}</Text><Text style={styles.value}>Cantidad: {row.quantity.toLocaleString('es-MX', { maximumFractionDigits: 6 })}</Text></View>)}
      <View style={styles.actions}>{button('Anterior', () => setBalanceCursors(v => v.slice(0, -1)), loading || balanceCursors.length === 1 || stockSaving || warehouseBusy || warehouseCreating)}{button('Siguiente', () => { if (balanceNext) setBalanceCursors(v => [...v, balanceNext]); }, loading || !balanceNext || stockSaving || warehouseBusy || warehouseCreating)}</View>
    </> : <>
      <Text style={styles.note}>Hasta 25 movimientos por página, más recientes primero.</Text>
      {!items.length ? <Text style={styles.note}>No hay movimientos para esta consulta.</Text> : null}
      {items.map((row) => <View key={row.id} style={styles.row}><Text style={styles.value}>{{ RECEIPT: 'Entrada', ISSUE: 'Salida', TRANSFER: 'Transferencia' }[row.kind]} · {row.reference}</Text><Text style={styles.note}>Producto: {inventoryLabel(row.productId, products)}{'\n'}Almacén: {inventoryLabel(row.warehouseId, warehouses)}{row.destinationWarehouseId ? ` → ${inventoryLabel(row.destinationWarehouseId, warehouses)}` : ''}{'\n'}Cantidad: {Math.abs(row.quantity).toLocaleString('es-MX', { maximumFractionDigits: 6 })}{'\n'}{row.createdAt ? new Date(row.createdAt).toLocaleString('es-MX') : 'Fecha no disponible'}{'\n'}Usuario: {row.userId}</Text></View>)}
      {next ? button('Movimientos anteriores', () => setQuery((value) => ({ ...value, cursor: next }))) : null}
      {query.cursor ? button('Más recientes', () => setQuery((value) => ({ ...value, cursor: '' }))) : null}
    </>}
    {button(error ? 'Reintentar' : 'Actualizar', () => { setBalanceCursors(['']); setQuery((value) => ({ ...value, cursor: '' })); setRevision((value) => value + 1); })}
  </View>;
}
const styles = StyleSheet.create({ panel: { padding: 16, backgroundColor: '#111923', borderRadius: 18, marginBottom: 24 }, title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700' }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, value: { color: '#F1F5F9', fontSize: 14 }, row: { paddingVertical: 12, borderBottomWidth: 1, borderColor: '#293746' }, actions: { flexDirection: 'row', justifyContent: 'space-between' }, button: { paddingVertical: 14 }, input: { backgroundColor: '#0B1016', color: '#F1F5F9', padding: 12, marginTop: 10, borderRadius: 10 }, error: { color: '#F87171', fontSize: 12 } });
