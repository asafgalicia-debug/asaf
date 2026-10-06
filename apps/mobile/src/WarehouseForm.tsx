import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError } from './api';
import { createWarehouseRequest, type WarehouseEntry } from './inventoryApi';

export function WarehouseForm({ base, token, accent, onExpired, onCreated, disabled = false, onBusy }: { base: string; token: string; accent: string; onExpired: () => void; onCreated: () => void; disabled?: boolean; onBusy: (busy: boolean) => void }) {
  const [draft, setDraft] = useState({ name: '', code: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { onBusy(saving); return () => onBusy(false); }, [saving, onBusy]);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<WarehouseEntry | null>(null);
  const write = useRef<AbortController | null>(null);
  useEffect(() => () => write.current?.abort(), []);
  async function save() {
    if (write.current || disabled) return;
    const controller = new AbortController(); write.current = controller;
    setSaving(true); setError(''); setCreated(null);
    try {
      const warehouse = await createWarehouseRequest(base, token, draft, controller.signal);
      if (controller.signal.aborted) return;
      setCreated(warehouse); setDraft({ name: '', code: '' }); onCreated();
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.status === 401) onExpired();
      else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el almacén.');
    } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  return <View style={styles.form}>
    <Text style={styles.title}>Nuevo almacén</Text>
    <Text style={styles.note}>Se registra en la empresa y sucursal de tu sesión.</Text>
    {(['name', 'code'] as const).map((field) => <View key={field}><Text style={styles.note}>{field === 'name' ? 'Nombre del almacén' : 'Código único del almacén'}</Text><TextInput accessibilityLabel={field === 'name' ? 'Nombre del almacén' : 'Código del almacén'} editable={!saving && !disabled} autoCapitalize={field === 'code' ? 'characters' : 'words'} maxLength={field === 'name' ? 100 : 32} value={draft[field]} onChangeText={(value) => setDraft((current) => ({ ...current, [field]: value }))} style={styles.input} /></View>)}
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    {created ? <Text style={styles.note}>Almacén confirmado: {created.name} · {created.code}</Text> : null}
    <Pressable accessibilityRole="button" disabled={saving || disabled} onPress={save} style={styles.button}><Text style={{ color: saving ? '#718096' : accent }}>{saving ? 'Guardando almacén…' : 'Crear almacén'}</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({ form: { marginVertical: 16 }, title: { color: '#F1F5F9', fontSize: 18, fontWeight: '700' }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, input: { color: '#F1F5F9', backgroundColor: '#0B1016', padding: 12, borderRadius: 10, marginVertical: 10 }, error: { color: '#F87171', fontSize: 12 }, button: { paddingVertical: 14 } });
