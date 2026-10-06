import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, renameCatalogEntry, type RenameKind } from './api';
export function NameEditor({ base, token, kind, entry, accent, disabled = false, onExpired, onSaved, onBusy }: {
 base: string; token: string; kind: RenameKind; entry: { id: string; name: string }; accent: string; disabled?: boolean;
 onExpired: () => void; onSaved: (name: string) => void; onBusy: (busy: boolean) => void;
}) {
 const [editing, setEditing] = useState(false), [name, setName] = useState(entry.name), [saving, setSaving] = useState(false);
 const [error, setError] = useState(''), [notice, setNotice] = useState(''); const write = useRef<AbortController | null>(null);
 useEffect(() => () => write.current?.abort(), []);
 useEffect(() => { onBusy(saving); return () => onBusy(false); }, [saving, onBusy]);
 async function save() {
  if (write.current || disabled) return;
  const controller = new AbortController(); write.current = controller; setSaving(true); setError(''); setNotice('');
  try {
   const updated = await renameCatalogEntry(base, token, kind, entry.id, entry.name, name, controller.signal);
   if (controller.signal.aborted) return;
   onSaved(updated); setEditing(false); setNotice('Nombre actualizado.');
  } catch (failure) {
   if (!controller.signal.aborted) {
    if (failure instanceof ApiError && failure.status === 401) onExpired();
    else setError(failure instanceof Error ? failure.message : 'No se pudo confirmar el nombre.');
   }
  } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
 }
 return <View style={styles.box}>
  {editing ? <>
   <Text style={styles.note}>Nuevo nombre. El código y las referencias se conservan.</Text>
   <TextInput accessibilityLabel={kind === 'categories' ? 'Nuevo nombre de categoría' : 'Nuevo nombre de almacén'} value={name} onChangeText={setName} editable={!saving && !disabled} maxLength={100} style={styles.input} />
   <View style={styles.actions}><Pressable accessibilityRole="button" disabled={saving || disabled} onPress={save}><Text style={{ color: accent }}>{saving ? 'Guardando…' : 'Guardar nombre'}</Text></Pressable><Pressable accessibilityRole="button" disabled={saving || disabled} onPress={() => { setEditing(false); setError(''); }}><Text style={{ color: accent }}>Cancelar</Text></Pressable></View>
  </> : <Pressable accessibilityRole="button" disabled={disabled} onPress={() => { setName(entry.name); setEditing(true); setError(''); setNotice(''); }}><Text style={{ color: disabled ? '#718096' : accent }}>Editar nombre</Text></Pressable>}
  {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
  {notice ? <Text style={styles.note}>{notice}</Text> : null}
 </View>;
}
const styles = StyleSheet.create({ box: { paddingVertical: 10 }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, input: { backgroundColor: '#0B1016', color: '#F1F5F9', borderRadius: 10, padding: 12, marginVertical: 10 }, actions: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }, error: { color: '#F87171', fontSize: 12 } });
