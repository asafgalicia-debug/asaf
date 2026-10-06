import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { write } from 'xlsx';
import { documentWorkbook } from './exportWorkbook';
import { documentHtml, type ExportDocument } from './exportDocument';

export async function shareDocument(document: ExportDocument, format: 'pdf' | 'xlsx'): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Este dispositivo no permite compartir archivos.');
  if (!FileSystem.cacheDirectory) throw new Error('No se pudo acceder a la carpeta de exportaciones.');
  const directory = `${FileSystem.cacheDirectory}nucleo-exports/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  // Remove only our previous temporary exports, never user-saved documents.
  const previous = await FileSystem.readDirectoryAsync(directory);
  for (const name of previous) {
    if (/^nucleo-\d+\.(pdf|xlsx)$/.test(name) && Number(name.split('-')[1].split('.')[0]) < Date.now() - 86400000) await FileSystem.deleteAsync(directory + name, { idempotent: true });
  }
  const uri = `${directory}nucleo-${Date.now()}.${format}`;
  if (format === 'pdf') {
    const generated = await Print.printToFileAsync({ html: documentHtml(document), width: 595, height: 842 });
    await FileSystem.moveAsync({ from: generated.uri, to: uri });
  } else {
    const base64: string = write(documentWorkbook(document), { type: 'base64', bookType: 'xlsx', compression: true });
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
  }
  await Sharing.shareAsync(uri, {
    mimeType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    UTI: format === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet', dialogTitle: `Guardar o compartir ${document.title}`
  });
}
