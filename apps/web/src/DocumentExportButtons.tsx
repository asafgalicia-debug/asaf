import { downloadDocument } from './downloadDocument';
import type { ExportDocument } from './exportDocument';
export function DocumentExportButtons({ document }: { document: ExportDocument }) {
  return <div><button type="button" onClick={() => downloadDocument(document, 'pdf')}>PDF / Imprimir</button><button type="button" onClick={() => downloadDocument(document, 'xlsx')}>Exportar Excel</button><p>Para PDF, elige Guardar como PDF en el diálogo de impresión.</p></div>;
}
