import { useEffect, useRef, useState } from 'react';
import { catalogServerPage, type CatalogKind } from './catalogApi';
import { catalogDocument, collectCatalogPages } from './exportDocument';
import { downloadDocument } from './downloadDocument';
export function CatalogExportButtons({ base, token, kind, search, companyId, branchId, disabled }: {
  base: string; token: string; kind: CatalogKind; search: string; companyId: string; branchId: string; disabled: boolean;
}) {
  const controller = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { setMessage(''); return () => controller.current?.abort(); }, [base, token, kind, search, companyId, branchId]);
  async function exportFile(format: 'pdf' | 'xlsx') {
    if (controller.current) return;
    const current = new AbortController(); controller.current = current; setBusy(true); setMessage('Consultando catálogo completo…');
    const timer = setTimeout(() => current.abort(), 300000);
    try {
      const rows = await collectCatalogPages(cursor => catalogServerPage(base, kind, token, current.signal, search, cursor), current.signal, count => { if (!current.signal.aborted) setMessage(`Consultados ${count} registros…`); });
      if (current.signal.aborted) return;
      if (!rows.length) throw new Error('No hay registros para exportar.');
      await downloadDocument(catalogDocument(kind, rows, companyId, branchId, search), format);
      setMessage(format === 'pdf' ? `Preparados ${rows.length} registros. Elige Guardar como PDF en el diálogo.` : `Excel preparado con ${rows.length} registros.`);
    } catch (error) { if (!current.signal.aborted) setMessage(error instanceof Error ? error.message : 'No se pudo exportar.'); }
    finally { clearTimeout(timer); controller.current = null; setBusy(false); if (current.signal.aborted) setMessage('Exportación cancelada.'); }
  }
  return <div><p>Exportar todos los resultados del filtro (hasta 10,000 registros). La consulta utiliza tus permisos y puede reflejar cambios registrados durante la descarga.</p><button disabled={disabled || busy} onClick={() => exportFile('pdf')}>PDF / Imprimir</button><button disabled={disabled || busy} onClick={() => exportFile('xlsx')}>Exportar Excel</button>{busy && <button onClick={() => controller.current?.abort()}>Cancelar consulta</button>}{!!message && <p role="status">{message}</p>}</div>;
}
