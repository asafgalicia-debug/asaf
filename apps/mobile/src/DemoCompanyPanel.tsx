import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { demoCompany, filterDemoProducts, makeDemoProducts } from './demoProducts';
import { catalogDocument } from './exportDocument';
import { shareDocument } from './shareDocument';

export function DemoCompanyPanel({ accent, onClose, onPageChange }: { accent: string; onClose: () => void; onPageChange: () => void }) {
  const products = useMemo(makeDemoProducts, []);
  const [query, setQuery] = useState(''), [page, setPage] = useState(0), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const filtered = useMemo(() => filterDemoProducts(products, query), [products, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  async function exportFile(format: 'pdf' | 'xlsx') {
    if (busy) return;
    setBusy(true); setMessage('Preparando el catálogo completo…');
    try {
      await shareDocument(catalogDocument('products', filtered, demoCompany.name, undefined, query, true), format);
      setMessage(`Archivo preparado con ${filtered.length} productos. Usa el menú del teléfono para guardarlo o compartirlo.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { setBusy(false); }
  }
  return <View style={{ backgroundColor: '#111923', borderRadius: 18, padding: 16, marginVertical: 16 }}>
    <Text style={{ color: accent, fontWeight: '700' }}>EMPRESA DE DEMOSTRACIÓN · LOCAL</Text>
    <Text style={{ color: '#F1F5F9', fontSize: 20, marginVertical: 12 }}>{demoCompany.name}</Text>
    <Text style={{ color: '#8B99A8' }}>2,000 productos ficticios, 1,800 activos y 200 inactivos. Esta demostración funciona sin conexión y no guarda registros en tu empresa. Los precios no tienen moneda asignada y no representan existencias.</Text>
    <TextInput accessibilityLabel="Buscar productos de demostración" editable={!busy} value={query} maxLength={100} onChangeText={value => { setQuery(value); setPage(0); }} placeholder="Nombre o SKU" placeholderTextColor="#8B99A8" style={{ backgroundColor: '#0B1118', color: '#F1F5F9', borderRadius: 10, padding: 14, marginVertical: 14 }} />
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{(['pdf', 'xlsx'] as const).map(format => <Pressable key={format} accessibilityRole="button" disabled={busy || !filtered.length} onPress={() => exportFile(format)} style={{ paddingVertical: 14 }}><Text style={{ color: busy || !filtered.length ? '#718096' : accent }}>Exportar {format === 'pdf' ? 'PDF' : 'Excel'}</Text></Pressable>)}</View>
    <Text style={{ color: '#8B99A8' }}>Se exportan todos los resultados de la búsqueda: {filtered.length} productos.</Text>
    {!!message && <Text accessibilityRole="alert" style={{ color: '#F1F5F9', marginVertical: 12 }}>{message}</Text>}
    <Text style={{ color: '#8B99A8', marginVertical: 10 }}>Página {page + 1} de {totalPages} · 20 productos por página</Text>
    {filtered.slice(page * 20, page * 20 + 20).map(row => <View key={row.id} style={{ paddingVertical: 12, borderBottomColor: '#293746', borderBottomWidth: 1 }}><Text style={{ color: '#F1F5F9', fontWeight: '700' }}>{row.name}</Text><Text style={{ color: '#8B99A8', marginTop: 4 }}>{row.sku} · {row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} · Precio: {row.price?.toFixed(2)}</Text></View>)}
    {!filtered.length && <Text style={{ color: '#8B99A8' }}>No hay coincidencias.</Text>}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 14 }}><Pressable disabled={busy || page === 0} onPress={() => { setPage(value => value - 1); onPageChange(); }}><Text style={{ color: page === 0 || busy ? '#718096' : accent }}>Anterior</Text></Pressable><Pressable disabled={busy || page + 1 >= totalPages} onPress={() => { setPage(value => value + 1); onPageChange(); }}><Text style={{ color: page + 1 >= totalPages || busy ? '#718096' : accent }}>Siguiente</Text></Pressable></View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} style={{ paddingVertical: 16 }}><Text style={{ color: accent }}>Salir de la demostración</Text></Pressable>
  </View>;
}
