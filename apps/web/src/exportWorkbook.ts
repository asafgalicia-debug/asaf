import { utils } from 'xlsx';
import type { ExportDocument } from './exportDocument';

export function documentWorkbook(document: ExportDocument) {
  const workbook = utils.book_new();
  const sheet = utils.aoa_to_sheet([document.columns, ...document.rows]);
  sheet['!cols'] = document.columns.map((_, index) => ({ wch: index === 0 ? 45 : 26 }));
  sheet['!autofilter'] = { ref: sheet['!ref'] ?? 'A1' };
  utils.book_append_sheet(workbook, sheet, 'Datos');
  utils.book_append_sheet(workbook, utils.aoa_to_sheet([
    ['Documento', document.title], ['Empresa', document.company],
    ['Sucursal', document.branch ?? 'Catálogo de empresa'], ['Descripción', document.note],
    ['Registros', document.rows.length], ['Generado UTC', new Date().toISOString()]
  ]), 'Información');
  return workbook;
}

