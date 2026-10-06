import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, dashboardRequest, type DashboardSummary } from './api';

export function DashboardPanel({ base, token, accent, onExpired }: { base: string; token: string; accent: string; onExpired: () => void }) {
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError(''); setLoading(true);
    dashboardRequest(base, token, controller.signal).then((summary) => {
      if (!controller.signal.aborted) setData(summary);
    }).catch((failure: unknown) => {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudieron consultar los indicadores.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, token, revision, onExpired]);
  return <View style={styles.panel}>
    <Text style={styles.heading}>Indicadores de tu empresa</Text>
    {loading ? <Text style={styles.note}>Consultando datos reales…</Text> : null}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {data ? <>
      <View style={styles.grid}>{([
        ['Ventas registradas', data.metrics.sales], ['Compras registradas', data.metrics.purchases],
        ['Flujo neto de caja', data.metrics.cash], ['Empleados activos', data.metrics.employees],
        ['Productos activos', data.metrics.inventory]
      ] as const).map(([label, value]) => <View key={label} style={styles.metric}><Text style={styles.note}>{label}</Text><Text style={[styles.value, { color: accent }]}>{value.toLocaleString('es-MX', { maximumFractionDigits: 2 })}</Text></View>)}</View>
      <Text style={styles.note}>Actualizado: {new Date(data.lastUpdated).toLocaleString('es-MX')}</Text>
      <Text style={styles.note}>Los productos son el catálogo activo, no las existencias. El flujo neto no representa un saldo bancario. Importes sin símbolo: la API no informa moneda.</Text>
    </> : null}
    <Pressable accessibilityRole="button" disabled={loading} onPress={() => setRevision((value) => value + 1)} style={styles.button}><Text style={{ color: accent }}>{loading ? 'Consultando…' : error ? 'Reintentar' : 'Actualizar indicadores'}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: '#111923', padding: 16, borderRadius: 18, marginBottom: 30 },
  heading: { color: '#F1F5F9', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  metric: { width: '48%', padding: 10, backgroundColor: '#0B1016', borderRadius: 10 },
  value: { fontSize: 22, fontWeight: '700', marginTop: 6 },
  note: { color: '#8B99A8', fontSize: 11, lineHeight: 17, marginBottom: 5 },
  error: { color: '#F87171', fontSize: 12 },
  button: { paddingVertical: 14, alignItems: 'center' }
});
