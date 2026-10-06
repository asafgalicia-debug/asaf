import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, requestData } from './api';
type Item = { id: string; title: string; detail: string };
export function ReadOnlyPanel({ base, token, kind, accent, onExpired }: { base: string; token: string; kind: 'activity' | 'finance'; accent: string; onExpired: () => void }) {
  const [items, setItems] = useState<Item[]>([]), [error, setError] = useState('');
  const [loading, setLoading] = useState(true), [revision, setRevision] = useState(0), [visible, setVisible] = useState(20);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setItems([]); setVisible(20);
    requestData(base, kind === 'activity' ? '/audit?limit=50' : '/cash-movements', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }).then((data) => {
      if (!Array.isArray(data)) throw new ApiError('La API devolvió un listado inesperado.');
      const rows = data.map((value): Item => {
        if (!value || typeof value !== 'object') throw new ApiError('La API devolvió un registro inesperado.');
        const row = value as Record<string, unknown>;
        if (typeof row.id !== 'string' || !row.id) throw new ApiError('La API devolvió un identificador inesperado.');
        if (kind === 'activity') {
          if (typeof row.action !== 'string' || typeof row.module !== 'string' || typeof row.createdAt !== 'string' || !Number.isFinite(Date.parse(row.createdAt))) throw new ApiError('La API devolvió actividad inesperada.');
          return { id: row.id, title: `${row.action} · ${row.module}`, detail: new Date(row.createdAt).toLocaleString('es-MX') };
        }
        if (typeof row.concept !== 'string' || !['INFLOW', 'OUTFLOW'].includes(String(row.type)) || typeof row.amount !== 'number' || !Number.isFinite(row.amount) || row.amount < 0 || typeof row.date !== 'string') throw new ApiError('La API devolvió un movimiento financiero inesperado.');
        return { id: row.id, title: row.concept, detail: `${row.type === 'INFLOW' ? 'Entrada' : 'Salida'} · ${row.amount.toLocaleString('es-MX')} · ${row.date}` };
      });
      if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new ApiError('La API devolvió registros duplicados.');
      if (!controller.signal.aborted) setItems(rows);
    }).catch((failure) => { if (!controller.signal.aborted) { if (failure instanceof ApiError && failure.status === 401) onExpired(); else setError(failure instanceof Error ? failure.message : 'No se pudo consultar.'); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, kind, revision, onExpired]);
  return <View style={styles.panel}><Text style={styles.title}>{kind === 'activity' ? 'Actividad de tu sucursal' : 'Movimientos de caja'}</Text><Text style={styles.note}>{kind === 'activity' ? 'Últimos 50 eventos registrados. Requiere permiso de auditoría.' : 'Consulta de movimientos registrados. Los importes no incluyen moneda; no representan saldos bancarios.'}</Text>{loading ? <Text style={styles.note}>Consultando…</Text> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{!loading && !error && items.length === 0 ? <Text style={styles.note}>No hay registros.</Text> : null}{items.slice(0, visible).map((row) => <View key={row.id} style={styles.record}><Text style={styles.text}>{row.title}</Text><Text style={styles.note}>{row.detail}</Text></View>)}{visible < items.length ? <Pressable onPress={() => setVisible((value) => value + 20)}><Text style={[styles.button, { color: accent }]}>Mostrar más</Text></Pressable> : null}<Pressable accessibilityRole="button" disabled={loading} onPress={() => setRevision((value) => value + 1)}><Text style={[styles.button, { color: accent }]}>{error ? 'Reintentar' : 'Actualizar'}</Text></Pressable></View>;
}
const styles = StyleSheet.create({ panel: { backgroundColor: '#111923', borderRadius: 18, padding: 16, marginBottom: 24 }, title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 12 }, text: { color: '#F1F5F9' }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, error: { color: '#F87171', marginVertical: 12 }, record: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#293746' }, button: { paddingVertical: 12 } });
