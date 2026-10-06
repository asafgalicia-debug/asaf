import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ApiError, catalogServerPage, type CatalogKind } from './api';
import { catalogDocument, collectCatalogPages } from './exportDocument';
import { shareDocument } from './shareDocument';

export function CatalogExportButtons({ base, token, kind, search, companyId, branchId, accent, disabled, onExpired }: {
  base: string; token: string; kind: CatalogKind; search: string; companyId: string; branchId: string; accent: string; disabled: boolean; onExpired: () => void;
}) {
  const [busy, setBusy] = useState(false), [generating, setGenerating] = useState(false), [message, setMessage] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => { setMessage(''); return () => controller.current?.abort(); }, [token, kind, search, companyId, branchId]);
  async function exportFile(format: 'pdf' | 'xlsx') {
    if (controller.current) return;
    const current = new AbortController(); controller.current = current; setBusy(true); setMessage('Consultando el catálogo completo…');
    const timer = setTimeout(() => current.abort(), 300000);
    try {
      const rows = await collectCatalogPages(cursor => catalogServerPage(base, kind, token, current.signal, search, cursor), current.signal, count => { if (!current.signal.aborted) setMessage(`Consultados: ${count} registros…`); });
      if (current.signal.aborted) return;
      if (!rows.length) throw new Error('No hay registros para exportar.');
      clearTimeout(timer); setGenerating(true); setMessage(`Preparando archivo con ${rows.length} registros…`);
      await shareDocument(catalogDocument(kind, rows, companyId, branchId, search), format);
      if (!current.signal.aborted) setMessage(`Archivo preparado con ${rows.length} registros. Puedes guardarlo o compartirlo desde el menú del teléfono.`);
    } catch (error) {
      if (current.signal.aborted) return;
      if (error instanceof ApiError && error.status === 401) onExpired();
      else setMessage(error instanceof Error ? error.message : 'No se pudo exportar.');
    } finally { clearTimeout(timer); controller.current = null; setBusy(false); setGenerating(false); if (current.signal.aborted) setMessage('Exportación cancelada.'); }
  }
  return <View><Text style={{ color: '#8B99A8' }}>Exportar todos los resultados del filtro (hasta 10,000). La consulta usa los permisos de tu cuenta; los registros pueden cambiar mientras se consultan.</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{(['pdf', 'xlsx'] as const).map(format => <Pressable key={format} accessibilityRole="button" disabled={disabled || busy} onPress={() => exportFile(format)} style={{ paddingVertical: 16 }}><Text style={{ color: disabled || busy ? '#718096' : accent }}>Exportar {format === 'pdf' ? 'PDF' : 'Excel'}</Text></Pressable>)}</View>{busy && !generating && <Pressable onPress={() => controller.current?.abort()}><Text style={{ color: accent }}>Cancelar consulta</Text></Pressable>}{!!message && <Text accessibilityRole="alert" style={{ color: '#F1F5F9', marginVertical: 12 }}>{message}</Text>}</View>;
}
