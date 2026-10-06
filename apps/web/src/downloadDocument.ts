import { write } from 'xlsx';
import { documentWorkbook } from './exportWorkbook';
import { documentHtml, type ExportDocument } from './exportDocument';

export async function downloadDocument(document: ExportDocument, format: 'pdf' | 'xlsx'): Promise<void> {
  if (format === 'xlsx') {
    const bytes = write(documentWorkbook(document), { type: 'array', bookType: 'xlsx', compression: true });
    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const link = window.document.createElement('a'); link.href = url; link.download = `nucleo-${Date.now()}.xlsx`;
    window.document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  // Browser print dialog supports saving a genuine PDF, with repeated table headings.
  await new Promise<void>((resolve, reject) => {
    const frame = window.document.createElement('iframe');
    frame.title = 'Documento para guardar en PDF'; frame.style.cssText = 'position:fixed;width:0;height:0;border:0;';
    const timer = setTimeout(() => { frame.remove(); reject(new Error('No se pudo preparar la impresión. Intenta de nuevo.')); }, 15000);
    frame.onerror = () => { clearTimeout(timer); frame.remove(); reject(new Error('No se pudo abrir el documento para imprimir.')); };
    frame.onload = () => {
      clearTimeout(timer);
      try {
        if (!frame.contentWindow) throw new Error('No se pudo abrir la impresión.');
        frame.contentWindow.addEventListener('afterprint', () => frame.remove(), { once: true });
        frame.contentWindow.focus(); frame.contentWindow.print(); resolve();
      } catch (error) { frame.remove(); reject(error); }
    };
    frame.srcdoc = documentHtml(document); window.document.body.appendChild(frame);
  });
}
