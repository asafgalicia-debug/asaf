import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, type CatalogEntry } from './api';
import { CatalogSelector } from './CatalogSelector';
import { WarehouseSelector } from './WarehouseSelector';
import { createStockRequest, validateStock, type StockKind, type WarehouseEntry } from './inventoryApi';
const labels = { receipts: 'Entrada', issues: 'Salida', transfers: 'Transferencia' };
export function StockForm({ base, token, accent, onExpired, onCreated, disabled = false, onBusy, warehouseRevision = 0 }: { base: string; token: string; accent: string; onExpired: () => void; onCreated: () => void; disabled?: boolean; onBusy: (busy: boolean) => void; warehouseRevision?: number }) {
  const [kind, setKind] = useState<StockKind>('receipts');
  const [draft, setDraft] = useState({ productId: '', warehouseId: '', destinationWarehouseId: '', quantity: '', reference: '' });
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CatalogEntry | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseEntry | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<WarehouseEntry | null>(null);
  useEffect(() => { setSelectedWarehouse(null); setSelectedDestination(null); setDraft(value => ({ ...value, warehouseId: '', destinationWarehouseId: '' })); }, [warehouseRevision]);
  useEffect(() => { onBusy(saving); return () => onBusy(false); }, [saving, onBusy]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const productReady = selectedProduct?.id === draft.productId && selectedProduct?.status === 'ACTIVE';
  const warehouseReady = selectedWarehouse?.id === draft.warehouseId && selectedWarehouse?.status === 'ACTIVE';
  const destinationReady = selectedDestination?.id === draft.destinationWarehouseId && selectedDestination?.status === 'ACTIVE';
  const write = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; write.current?.abort(); }; }, []);
  async function save() {
    if (!mounted.current || write.current || disabled) return;
    const controller = new AbortController(); write.current = controller;
    setSaving(true); setError(''); setNotice('');
    try {
      await createStockRequest(base, token, kind, draft, controller.signal);
      if (controller.signal.aborted) return;
      setDraft((value) => ({ ...value, quantity: '', reference: '' })); setNotice('Movimiento confirmado.'); onCreated();
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el movimiento.');
    } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  function confirm() {
    if (write.current || disabled) return;
    try {
      validateStock(kind, draft);
      if (!productReady || !warehouseReady || (kind === 'transfers' && !destinationReady)) throw new ApiError('Selecciona producto y almacenes activos.');
      const name = (id: string) => [selectedWarehouse, selectedDestination].find((row) => row?.id === id)?.name || id;
      Alert.alert(`Confirmar ${labels[kind].toLowerCase()}`, `${selectedProduct?.name}\nCantidad: ${draft.quantity}\nAlmacén: ${name(draft.warehouseId)}${kind === 'transfers' ? ` → ${name(draft.destinationWarehouseId)}` : ''}\nReferencia: ${draft.reference.trim()}\nEste movimiento afecta existencias y no se edita desde esta pantalla.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Registrar', onPress: save }]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Revisa los datos.'); }
  }
  return <View>
    <Text style={styles.title}>Registrar movimiento</Text>
    <View style={styles.types}>{(Object.keys(labels) as StockKind[]).map((value) => <Pressable key={value} disabled={saving || disabled} onPress={() => setKind(value)} style={styles.button}><Text style={{ color: kind === value ? accent : '#8B99A8' }}>{labels[value]}</Text></Pressable>)}</View>
    <Text style={styles.note}>Producto activo</Text>
    <CatalogSelector base={base} token={token} kind="products" accent={accent} selected={selectedProduct} disabled={saving || disabled} onExpired={onExpired} onSelect={(row) => { setSelectedProduct(row); setDraft((value) => ({ ...value, productId: row.id })); setError(''); }} />
    <Text style={styles.note}>Almacén de {kind === 'receipts' ? 'entrada' : 'origen'}</Text>
    <WarehouseSelector externalRevision={warehouseRevision} base={base} token={token} accent={accent} selected={selectedWarehouse} disabled={saving || disabled} onExpired={onExpired} onSelect={(row) => { setSelectedWarehouse(row); setDraft((value) => ({ ...value, warehouseId: row.id, destinationWarehouseId: value.destinationWarehouseId === row.id ? '' : value.destinationWarehouseId })); if (selectedDestination?.id === row.id) setSelectedDestination(null); setError(''); }} />
    {kind === 'transfers' ? <><Text style={styles.note}>Almacén de destino (diferente del origen)</Text><WarehouseSelector externalRevision={warehouseRevision} base={base} token={token} accent={accent} selected={selectedDestination} disabled={saving || disabled} onExpired={onExpired} onSelect={(row) => { if (row.id === draft.warehouseId) { setError('Selecciona un almacén de destino diferente del origen.'); return; } setSelectedDestination(row); setDraft((value) => ({ ...value, destinationWarehouseId: row.id })); setError(''); }} /></> : null}
    {!productReady || !warehouseReady ? <Text style={styles.note}>Selecciona un producto y un almacén activos. Puedes buscarlos arriba o crear los registros en sus catálogos.</Text> : null}
    <Text style={styles.note}>Cantidad positiva (punto decimal)</Text><TextInput accessibilityLabel="Cantidad del movimiento" editable={!saving && !disabled} keyboardType="decimal-pad" maxLength={20} value={draft.quantity} onChangeText={(quantity) => setDraft((value) => ({ ...value, quantity }))} style={styles.input} />
    <Text style={styles.note}>Referencia única</Text><TextInput accessibilityLabel="Referencia única del movimiento" editable={!saving && !disabled} maxLength={100} value={draft.reference} onChangeText={(reference) => setDraft((value) => ({ ...value, reference }))} style={styles.input} />
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{notice ? <Text style={styles.note}>{notice}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving || disabled || !productReady || !warehouseReady} onPress={confirm} style={styles.button}><Text style={{ color: accent }}>{saving ? 'Guardando…' : 'Revisar y registrar'}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ title: { color: '#F1F5F9', fontSize: 18, fontWeight: '700', marginTop: 12 }, types: { flexDirection: 'row', justifyContent: 'space-between' }, note: { color: '#8B99A8', fontSize: 12 }, input: { color: '#F1F5F9', backgroundColor: '#0B1016', padding: 12, borderRadius: 10, marginVertical: 10 }, button: { paddingVertical: 12 }, error: { color: '#F87171', fontSize: 12 } });
