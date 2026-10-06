import {ReceiptView} from './ReceiptView';
import {SettlementForm} from './SettlementForm';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, catalogLookup, type CatalogEntry } from './api';
import { CatalogSelector } from './CatalogSelector';
import { createTransactionRequest, transactionPageRequest, transactionStatusOptions, updateTransactionStatusRequest, validateTransaction, type Transaction, type TransactionKind } from './transactionApi';
export function TransactionPanel({ base, token, kind, accent, canCreate, onExpired, companyId, branchId }: { base: string; token: string; kind: TransactionKind; accent: string; canCreate: boolean; onExpired: () => void; companyId:string;branchId:string }) {
  const [receipt,setReceipt]=useState<Transaction|null>(null);
  const [settling,setSettling]=useState<Transaction|null>(null);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [partners, setPartners] = useState<CatalogEntry[]>([]);
  const [products, setProducts] = useState<CatalogEntry[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<CatalogEntry | null>(null), [selectedProduct, setSelectedProduct] = useState<CatalogEntry | null>(null);
  const [draft, setDraft] = useState({ partnerId: '', productId: '', quantity: '', unitCost: '' });
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [nameError,setNameError]=useState('');
  const [revision, setRevision] = useState(0);
  const [cursors, setCursors] = useState<string[]>(['']);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const cursor = cursors[cursors.length - 1];
  const write = useRef<AbortController | null>(null), mounted = useRef(true);
  const sale = kind === 'sales';
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; write.current?.abort(); }; }, []);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setNameError(''); setRows([]); setPartners([]); setProducts([]); setNextCursor(null);
    transactionPageRequest(base, token, kind, controller.signal, cursor, statusFilter)
      .then(async records => {
        if (controller.signal.aborted) return;
        setRows(records.items); setNextCursor(records.nextCursor);
        try {
          const [contacts, items] = await Promise.all([catalogLookup(base, sale ? 'customers' : 'suppliers', token, controller.signal, records.items.map(row => row.partnerId)), catalogLookup(base, 'products', token, controller.signal, records.items.map(row => row.productId))]);
          if (!controller.signal.aborted) { setPartners(contacts); setProducts(items); }
        } catch (failure) {
          if (!controller.signal.aborted) {
            if (failure instanceof ApiError && failure.status === 401) onExpired();
            else setNameError('Los registros siguen disponibles por identificador. No se pudieron consultar sus nombres.');
          }
        }
      })
      .catch((failure) => { if (!controller.signal.aborted) { if (failure instanceof ApiError && failure.status === 401) onExpired(); else setError(failure instanceof Error ? failure.message : 'No se pudo consultar.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, kind, sale, revision, cursor, statusFilter, onExpired]);
  async function save() {
    if (!mounted.current || write.current || !canCreate) return;
    const controller = new AbortController(); write.current = controller; setSaving(true); setError(''); setNotice('');
    try {
      const row = await createTransactionRequest(base, token, kind, draft, controller.signal);
      if (controller.signal.aborted) return;
      setSelectedPartner(null); setSelectedProduct(null); setNotice(`Registro confirmado: ${row.id}`); setDraft({ partnerId: '', productId: '', quantity: '', unitCost: '' }); setCursors(['']); setRevision((value) => value + 1);
    } catch (failure) { if (!controller.signal.aborted) { if (failure instanceof ApiError && failure.status === 401) onExpired(); else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el guardado.'); } }
    finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  async function changeStatus(row: Transaction, status: string) {
    if (!mounted.current || write.current || !canCreate) return;
    const controller = new AbortController(); write.current = controller; setSaving(true); setError(''); setNotice('');
    try {
      const updated = await updateTransactionStatusRequest(base, token, kind, row, status, controller.signal);
      if (controller.signal.aborted) return;
      setNotice('Estado confirmado: ' + updated.status); setCursors(['']); setRevision(value => value + 1);
    } catch (failure) {
      if (!controller.signal.aborted) {
        if (failure instanceof ApiError && failure.status === 401) onExpired();
        else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el estado.');
      }
    } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  function confirmStatus(row: Transaction, status: string) {
    if (saving || loading || write.current || !canCreate) return;
    Alert.alert('Confirmar cambio de estado', row.id + '\n' + row.status + ' → ' + status + '\nEsta acción actualiza el registro comercial. No procesa pagos, entradas ni salidas de inventario. Los estados finales no se reabren desde esta pantalla.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: status === 'CANCELADA' ? 'destructive' : 'default', onPress: () => { void changeStatus(row, status); } }
    ]);
  }
  function confirm() {
    if (saving || loading || write.current) return;
    try {
      const payload = validateTransaction(kind, draft);
      const partner = selectedPartner?.id === draft.partnerId && selectedPartner.status === 'ACTIVE' ? selectedPartner : null;
      const product = selectedProduct?.id === draft.productId && selectedProduct.status === 'ACTIVE' ? selectedProduct : null;
      if (!partner || !product) throw new ApiError('Selecciona un contacto y producto activos.');
      if (sale && !Number.isFinite((product.price ?? NaN) * payload.quantity)) throw new ApiError('El importe es demasiado grande.');
      Alert.alert(sale ? 'Confirmar venta' : 'Confirmar compra', `${partner.name}\n${product.name}\nCantidad: ${payload.quantity}\n${sale ? 'El precio lo determina el catálogo del servidor.' : `Costo unitario: ${draft.unitCost}`}\nSe creará un registro pendiente. Después puedes usar la operación conjunta para registrar inventario y caja, o registrar movimientos manuales por separado.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Registrar', onPress: () => { void save(); } }]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Revisa los datos.'); }
  }
  const label = (id: string, options: CatalogEntry[]) => options.find((row) => row.id === id)?.name ?? id;
  if(receipt)return <ReceiptView base={base} token={token} kind={kind} row={receipt} companyId={companyId} branchId={branchId} accent={accent} onExpired={onExpired} onClose={()=>setReceipt(null)}/>;
  if(settling)return <SettlementForm key={settling.id} base={base} token={token} kind={kind} row={settling} companyId={companyId} branchId={branchId} accent={accent} onExpired={onExpired} onCancel={()=>setSettling(null)} onDone={id=>{setSettling(null);setNotice('Operación conjunta confirmada. Comprobante: '+id);setCursors(['']);setRevision(v=>v+1);}}/>;
  return <View style={styles.panel}>
    <Text style={styles.title}>{sale ? 'Ventas' : 'Compras'}</Text>
    <Text style={styles.note}>Registros de tu empresa y sucursal. Los importes no incluyen moneda porque el servicio no la informa.</Text>
    {loading ? <Text style={styles.note}>Consultando…</Text> : null}
    {canCreate && !loading ? <View>
      <Text style={styles.title}>{sale ? 'Nueva venta' : 'Nueva compra'}</Text>
      <Text style={styles.note}>{sale ? 'Cliente activo' : 'Proveedor activo'}</Text>
      <CatalogSelector base={base} token={token} kind={sale ? 'customers' : 'suppliers'} accent={accent} selected={selectedPartner} disabled={saving} onExpired={onExpired} onSelect={row => {setSelectedPartner(row);setDraft(value=>({...value,partnerId:row.id}));}} />
      <Text style={styles.note}>Producto activo</Text>
      <CatalogSelector base={base} token={token} kind="products" accent={accent} selected={selectedProduct} disabled={saving} onExpired={onExpired} onSelect={row => {setSelectedProduct(row);setDraft(value=>({...value,productId:row.id}));}} />
      <Text style={styles.note}>Cantidad positiva</Text><TextInput accessibilityLabel="Cantidad de la operación" keyboardType="decimal-pad" editable={!saving} value={draft.quantity} onChangeText={(quantity) => setDraft((value) => ({ ...value, quantity }))} style={styles.input} />
      {!sale ? <><Text style={styles.note}>Costo unitario (punto decimal)</Text><TextInput accessibilityLabel="Costo unitario" keyboardType="decimal-pad" editable={!saving} value={draft.unitCost} onChangeText={(unitCost) => setDraft((value) => ({ ...value, unitCost }))} style={styles.input} /></> : null}
      <Pressable accessibilityRole="button" disabled={saving} onPress={confirm}><Text style={[styles.option, { color: accent }]}>{saving ? 'Guardando…' : 'Revisar y registrar'}</Text></Pressable>
    </View> : canCreate && !loading && !error ? <Text style={styles.note}>Necesitas un contacto y un producto activos. Puedes crearlos en sus catálogos.</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {notice ? <Text style={styles.note}>{notice}</Text> : null}
    {nameError ? <Text accessibilityRole="alert" style={styles.note}>{nameError}</Text> : null}
    <Text style={styles.note}>Filtrar estado</Text><View style={{flexDirection:'row',flexWrap:'wrap'}}>{['', 'PENDIENTE', ...(sale ? ['PAGADA'] : ['APROBADA','RECIBIDA']), 'CANCELADA'].map(status => <Pressable accessibilityRole="button" accessibilityState={{selected:statusFilter===status}} key={status || 'all'} disabled={saving || loading} onPress={() => {setStatusFilter(status);setCursors(['']);}}><Text style={[styles.option,{color:statusFilter===status?accent:'#8B99A8',marginRight:12}]}>{status || 'Todos'}</Text></Pressable>)}</View>
    {!loading && !error ? <><Text style={styles.note}>{rows.length} registros en esta página · Página {cursors.length} · Hasta 20, más recientes primero</Text>{rows.length === 0 ? <Text style={styles.note}>No hay registros.</Text> : null}{rows.map((row) => <View style={styles.record} key={row.id}><Text style={styles.text}>{label(row.partnerId, partners)} · {row.status}</Text><Text style={styles.note}>{label(row.productId, products)} · Cantidad: {row.quantity}</Text><Text style={styles.note}>Precio/costo: {row.unitPrice} · Total: {row.total}</Text><Text selectable style={styles.note}>{row.id}</Text><Pressable accessibilityRole="button" disabled={saving} onPress={()=>setReceipt(row)}><Text style={{color:accent,paddingVertical:12}}>Ver comprobante</Text></Pressable>{canCreate&&row.total>0&&((sale&&row.status==='PENDIENTE')||(!sale&&row.status==='APROBADA'))?<Pressable accessibilityRole="button" disabled={saving||loading} onPress={()=>setSettling(row)}><Text style={{color:accent,paddingVertical:12}}>{sale?'Cobrar y entregar':'Recibir y pagar'}</Text></Pressable>:null}{canCreate ? transactionStatusOptions(kind, row.status).map(status => <Pressable accessibilityRole="button" key={status} disabled={saving} onPress={() => confirmStatus(row, status)}><Text style={[styles.option, { color: saving ? '#718096' : accent }]}>{status === 'PAGADA' ? 'Marcar pagada' : status === 'APROBADA' ? 'Aprobar compra' : status === 'RECIBIDA' ? 'Marcar recibida' : 'Cancelar registro'}</Text></Pressable>) : null}</View>)}<View style={{flexDirection:'row',justifyContent:'space-between'}}><Pressable accessibilityRole="button" disabled={saving || loading || cursors.length === 1} onPress={() => setCursors(values => values.slice(0,-1))}><Text style={[styles.option,{color:cursors.length===1||saving?'#718096':accent}]}>Anterior</Text></Pressable><Pressable accessibilityRole="button" disabled={saving || loading || !nextCursor} onPress={() => {if(nextCursor)setCursors(values => [...values,nextCursor]);}}><Text style={[styles.option,{color:!nextCursor||saving?'#718096':accent}]}>Siguiente</Text></Pressable></View></> : null}
    <Pressable accessibilityRole="button" disabled={loading || saving} onPress={() => {setCursors(['']);setRevision((value) => value + 1);}}><Text style={[styles.option, { color: accent }]}>Actualizar</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ panel: { backgroundColor: '#111923', padding: 16, borderRadius: 18, marginBottom: 24 }, title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginVertical: 12 }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, text: { color: '#F1F5F9' }, error: { color: '#F87171', marginVertical: 8 }, option: { paddingVertical: 12 }, input: { backgroundColor: '#0B1119', color: '#F1F5F9', padding: 12, borderRadius: 12, marginVertical: 8 }, record: { borderBottomColor: '#293746', borderBottomWidth: 1, paddingVertical: 12 } });
