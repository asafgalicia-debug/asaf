import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ExportDocument } from './exportDocument';
import { shareDocument } from './shareDocument';

export function DocumentExportButtons({ document, accent }: { document: ExportDocument; accent: string }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function exportFile(format: 'pdf' | 'xlsx') {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage('Preparando archivo…');
    try { await shareDocument(document, format); setMessage('Archivo preparado. Elige dónde guardarlo o compartirlo.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <View><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{(['pdf', 'xlsx'] as const).map(format => <Pressable accessibilityRole="button" key={format} disabled={busy} onPress={() => exportFile(format)} style={{ paddingVertical: 16 }}><Text style={{ color: busy ? '#718096' : accent }}>Exportar {format === 'pdf' ? 'PDF' : 'Excel'}</Text></Pressable>)}</View>{!!message && <Text accessibilityRole="alert" style={{ color: '#F1F5F9' }}>{message}</Text>}</View>;
}
