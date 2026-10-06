import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ApiError, requestData, type Session } from './api';
export function ProfilePanel({ base, session, accent, onExpired }: { base: string; session: Session; accent: string; onExpired: () => void }) {
  const [scope, setScope] = useState<{ companyId: string; branchId: string } | null>(null);
  const [error, setError] = useState(''), [loading, setLoading] = useState(true), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setScope(null);
    requestData(base, '/auth/profile', { headers: { Authorization: `Bearer ${session.token}` }, signal: controller.signal }).then((data) => {
      if (!data || typeof data !== 'object' || !('tenant' in data) || !data.tenant || typeof data.tenant !== 'object' || !('companyId' in data.tenant) || typeof data.tenant.companyId !== 'string' || !data.tenant.companyId || !('branchId' in data.tenant) || typeof data.tenant.branchId !== 'string' || !data.tenant.branchId) throw new ApiError('La API devolvió un perfil inesperado.');
      if (!controller.signal.aborted) setScope({ companyId: data.tenant.companyId, branchId: data.tenant.branchId });
    }).catch((failure) => { if (!controller.signal.aborted) { if (failure instanceof ApiError && failure.status === 401) onExpired(); else setError(failure instanceof Error ? failure.message : 'No se pudo consultar tu perfil.'); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base, session.token, revision, onExpired]);
  return <View style={styles.panel}><Text style={styles.title}>Tu perfil</Text><Text style={styles.text}>{session.user.name}{'\n'}{session.user.email}</Text>{scope ? <Text selectable style={styles.note}>Empresa: {scope.companyId}{'\n'}Sucursal: {scope.branchId}</Text> : null}{loading ? <Text style={styles.note}>Verificando sesión…</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}<Text style={styles.title}>Permisos de la sesión</Text>{session.user.permissions.map((permission) => <Text key={permission} style={styles.note}>{permission}</Text>)}<Text style={styles.note}>La sesión se conserva en memoria. Para cerrarla, usa Cerrar sesión.</Text><Pressable accessibilityRole="button" disabled={loading} onPress={() => setRevision((value) => value + 1)}><Text style={{ color: accent, paddingVertical: 12 }}>Actualizar perfil</Text></Pressable></View>;
}
const styles = StyleSheet.create({ panel: { backgroundColor: '#111923', borderRadius: 18, padding: 16, marginBottom: 24 }, title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginVertical: 12 }, text: { color: '#F1F5F9' }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, error: { color: '#F87171', marginVertical: 12 } });
