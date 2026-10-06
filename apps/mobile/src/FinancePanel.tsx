import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ApiError, requestData } from './api';
import { FinancePageView } from './FinancePageView';
import type { FinanceAccount } from './financeApi';
import { validateAccount, validateCashMovement } from './financeValidation';

export function FinancePanel({ base, token, accent, canCreate, onExpired }: { base: string; token: string; accent: string; canCreate: boolean; onExpired: () => void }) {
  const [selectedAccount, setSelectedAccount] = useState<FinanceAccount|null>(null), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false), [revision, setRevision] = useState(0);
  const [mode, setMode] = useState<'account' | 'movement'>('movement');
  const [account, setAccount] = useState({ name: '', bankName: '', iban: '' });
  const [movement, setMovement] = useState({ accountId: '', concept: '', type: 'INFLOW', amount: '', date: '' });
  const write = useRef<AbortController | null>(null), mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; write.current?.abort(); }; }, []);
  async function save(path: string, payload: Record<string, string | number>) {
    if (!mounted.current || write.current || !canCreate) return;
    const controller = new AbortController(); write.current = controller; setSaving(true); setError(''); setNotice('');
    try {
      const data = await requestData(base, path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal });
      if (!data || typeof data !== 'object' || !('id' in data) || typeof data.id !== 'string' || !data.id || Object.entries(payload).some(([key, value]) => !(key in data) || (data as Record<string, unknown>)[key] !== value)) throw new ApiError('No se pudo confirmar el registro.');
      if (controller.signal.aborted) return;
      setNotice(`Registro confirmado: ${data.id}`); setSelectedAccount(null); setAccount({ name: '', bankName: '', iban: '' }); setMovement({ accountId: '', concept: '', type: 'INFLOW', amount: '', date: '' }); setRevision((value) => value + 1);
    } catch (failure) {
      if (!controller.signal.aborted) { if (failure instanceof ApiError && failure.status === 401) onExpired(); else setError(failure instanceof ApiError && failure.status >= 400 && failure.status < 500 ? failure.message : 'No se pudo confirmar el guardado. Revisa las cuentas o movimientos antes de repetir.'); }
    } finally { write.current = null; if (!controller.signal.aborted) setSaving(false); }
  }
  function confirm() {
    if (saving) return;
    try {
      let payload: Record<string, string | number>;
      if (mode === 'account') {
        payload = validateAccount(account);
      } else {
        payload = validateCashMovement(movement, selectedAccount ? [selectedAccount] : []);
      }
      Alert.alert(mode === 'account' ? 'Confirmar cuenta' : 'Confirmar movimiento de caja', mode === 'account' ? `Cuenta: ${payload.name}\nBanco: ${payload.bankName}` : `${payload.type === 'INFLOW' ? 'Entrada' : 'Salida'} · ${payload.amount}\n${payload.concept}\n${payload.date}\nEste registro no ejecuta una operación bancaria.`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Registrar', onPress: () => { void save(mode === 'account' ? '/bank-accounts' : '/cash-movements', payload); } }]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Revisa los datos.'); }
  }
  return <><FinancePageView key={'accounts'+revision} base={base} token={token} kind="bank-accounts" accent={accent} disabled={saving} onExpired={onExpired} selected={selectedAccount} onSelect={canCreate ? (row)=>{setSelectedAccount(row);setMovement(value=>({...value,accountId:row.id}));} : undefined}/><View style={styles.panel}><Text style={styles.title}>Finanzas</Text><Text style={styles.note}>Cuentas de tu sucursal. El identificador bancario se registra según el contrato actual del servicio; su formato no se certifica.</Text>
    {canCreate ? <><View style={styles.actions}>{(['movement', 'account'] as const).map((value) => <Pressable key={value} disabled={saving} onPress={() => setMode(value)}><Text style={[styles.button, { color: mode === value ? accent : '#8B99A8' }]}>{value === 'account' ? 'Nueva cuenta' : 'Movimiento de caja'}</Text></Pressable>)}</View>{mode === 'account' ? (['name', 'bankName', 'iban'] as const).map((field) => <View key={field}><Text style={styles.note}>{field === 'name' ? 'Nombre de la cuenta' : field === 'bankName' ? 'Banco' : 'Identificador bancario (IBAN)'}</Text><TextInput accessibilityLabel={field} editable={!saving} autoCapitalize={field === 'iban' ? 'characters' : 'sentences'} value={account[field]} onChangeText={(value) => setAccount((old) => ({ ...old, [field]: value }))} style={styles.input} /></View>) : <><Text style={styles.note}>Cuenta activa: {selectedAccount?.name ?? 'Selecciona una cuenta arriba'}</Text><View style={styles.actions}>{['INFLOW', 'OUTFLOW'].map((type) => <Pressable disabled={saving} key={type} onPress={() => setMovement((old) => ({ ...old, type }))}><Text style={[styles.button, { color: movement.type === type ? accent : '#8B99A8' }]}>{type === 'INFLOW' ? 'Entrada' : 'Salida'}</Text></Pressable>)}</View>{(['concept', 'amount', 'date'] as const).map((field) => <View key={field}><Text style={styles.note}>{field === 'concept' ? 'Concepto' : field === 'amount' ? 'Importe (punto decimal)' : 'Fecha AAAA-MM-DD'}</Text><TextInput accessibilityLabel={field} editable={!saving} keyboardType={field === 'amount' ? 'decimal-pad' : 'default'} value={movement[field]} onChangeText={(value) => setMovement((old) => ({ ...old, [field]: value }))} style={styles.input} /></View>)}</>}<Pressable accessibilityRole="button" disabled={saving} onPress={confirm}><Text style={[styles.button, { color: accent }]}>{saving ? 'Guardando…' : 'Revisar y registrar'}</Text></Pressable></> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{notice ? <Text style={styles.note}>{notice}</Text> : null}<Pressable disabled={saving} onPress={() => setRevision((value) => value + 1)}><Text style={[styles.button, { color: accent }]}>Actualizar cuentas</Text></Pressable></View><FinancePageView key={'cash'+revision} base={base} token={token} kind="cash-movements" accent={accent} disabled={saving} onExpired={onExpired}/></>;
}
const styles = StyleSheet.create({ panel: { backgroundColor: '#111923', borderRadius: 18, padding: 16, marginBottom: 24 }, title: { color: '#F1F5F9', fontSize: 20, fontWeight: '700', marginBottom: 12 }, note: { color: '#8B99A8', fontSize: 12, lineHeight: 19 }, error: { color: '#F87171', marginVertical: 12 }, input: { backgroundColor: '#0B1119', color: '#F1F5F9', padding: 12, borderRadius: 12, marginVertical: 8 }, button: { paddingVertical: 12 }, actions: { flexDirection: 'row', justifyContent: 'space-between' } });
