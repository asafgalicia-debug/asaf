import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { ApiError, updateCatalogStatus, type CatalogStatus, type RenameKind } from './api';
export function StatusEditor({ base, token, kind, entry, accent, disabled, onBusy, onExpired, onSaved }: { base: string; token: string; kind: RenameKind; entry: { id: string; name: string; code: string; status: CatalogStatus }; accent: string; disabled: boolean; onBusy: (busy: boolean) => void; onExpired: () => void; onSaved: (status: CatalogStatus) => void }) {
 const blocked = useRef(disabled); blocked.current = disabled;
 const [saving, setSaving] = useState(false), [error, setError] = useState(''); const write = useRef<AbortController | null>(null); const mounted = useRef(true);
 useEffect(() => { mounted.current = true; return () => { mounted.current = false; write.current?.abort(); }; }, []);
 useEffect(() => { onBusy(saving); return () => onBusy(false); }, [saving, onBusy]);
 async function save() { if (!mounted.current || write.current || blocked.current) return; const controller = new AbortController(); write.current = controller; setSaving(true); setError('');
  try { const status = await updateCatalogStatus(base, token, kind, entry, controller.signal); if (!controller.signal.aborted) onSaved(status); }
  catch (e) { if (!controller.signal.aborted) { if (e instanceof ApiError && e.status === 401) onExpired(); else setError(e instanceof Error ? e.message : 'No se pudo confirmar el estado.'); } }
  finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
 }
 function confirm() { if (saving || disabled) return; const label = entry.status === 'ACTIVE' ? 'Desactivar' : 'Activar'; Alert.alert(label + ' ' + entry.name, kind === 'warehouses' ? 'Se conserva el almacén y sus existencias e historial. Inactivo no estará disponible para nuevos movimientos; puedes activarlo de nuevo.' : 'Se conservan la categoría y los productos asociados. Inactiva no podrá seleccionarse para altas o ediciones de productos; puedes activarla de nuevo.', [{ text: 'Cancelar', style: 'cancel' }, { text: label, onPress: save }]); }
 return <View style={{ paddingVertical: 10 }}><Pressable accessibilityRole="button" disabled={disabled || saving} onPress={confirm}><Text style={{ color: disabled || saving ? '#718096' : accent }}>{saving ? 'Guardando estado…' : entry.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}</Text></Pressable>{error ? <Text accessibilityRole="alert" style={{ color: '#F87171', fontSize: 12 }}>{error}</Text> : null}</View>;
}
