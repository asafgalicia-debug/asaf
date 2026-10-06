import type { CatalogEntry, CatalogKind } from './api';

export type ExportDocument = {
  title: string; company: string; branch?: string; note: string;
  columns: string[]; rows: (string | number)[][];
};
const names = { products: 'Productos', customers: 'Clientes', suppliers: 'Proveedores' };
export function catalogDocument(kind: CatalogKind, rows: CatalogEntry[], company: string, branch?: string, search = '', demo = false): ExportDocument {
  return {
    title: `Catálogo de ${names[kind].toLowerCase()}`,
    company, branch: kind === 'products' ? undefined : branch,
    note: `${demo ? 'DATOS FICTICIOS DE DEMOSTRACIÓN. ' : ''}${search ? `Filtro: ${search}. ` : ''}${rows.length} registros. ${kind === 'products' ? 'Precios sin moneda informada. El catálogo no representa existencias.' : 'Contactos registrados.'}`,
    columns: kind === 'products' ? ['Nombre', 'SKU', 'Estado', 'Precio'] : ['Nombre', 'Identificador fiscal', 'Correo', 'Estado'],
    rows: rows.map(row => kind === 'products'
      ? [row.name, row.sku ?? '', row.status === 'ACTIVE' ? 'Activo' : 'Inactivo', row.price ?? '']
      : [row.name, row.taxId ?? '', row.email ?? '', row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'])
  };
}
export const escapeHtml = (value: string | number): string => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]!));

export function documentHtml(document: ExportDocument): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><style>
  @page {size:A4;margin:16mm} body{font-family:Arial,sans-serif;color:#152230;font-size:10px}
  h1{font-size:20px} table{width:100%;border-collapse:collapse;table-layout:fixed}
  th,td{padding:6px;border-bottom:1px solid #d5dde5;text-align:left;overflow-wrap:anywhere;word-wrap:break-word}
  th{background:#e8f3f8} thead{display:table-header-group} tr{break-inside:avoid;page-break-inside:avoid}
  </style></head><body><h1>${escapeHtml(document.title)}</h1><p>${escapeHtml(document.company)}${document.branch ? ' · Sucursal: ' + escapeHtml(document.branch) : ''}</p><p>${escapeHtml(document.note)}</p><table><thead><tr>${document.columns.map(column => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead><tbody>${document.rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(typeof cell === 'number' ? cell.toLocaleString('es-MX', { maximumFractionDigits: 6 }) : cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
}

export async function collectCatalogPages(fetchPage: (cursor: string) => Promise<{ items: CatalogEntry[]; nextCursor: string | null }>, signal: AbortSignal, progress?: (count: number) => void): Promise<CatalogEntry[]> {
  const rows: CatalogEntry[] = [], identifiers = new Set<string>(), cursors = new Set<string>();
  let cursor = '';
  do {
    if (signal.aborted) throw new Error('Exportación cancelada.');
    if (cursors.has(cursor)) throw new Error('La paginación se repitió. Actualiza el catálogo e intenta de nuevo.');
    cursors.add(cursor);
    const page = await fetchPage(cursor);
    if (signal.aborted) throw new Error('Exportación cancelada.');
    for (const row of page.items) {
      if (identifiers.has(row.id)) throw new Error('El catálogo cambió durante la consulta. Intenta de nuevo.');
      identifiers.add(row.id); rows.push(row);
    }
    if (rows.length > 10000 || (rows.length === 10000 && page.nextCursor)) throw new Error('La exportación admite hasta 10,000 registros. Aplica un filtro.');
    progress?.(rows.length);
    cursor = page.nextCursor ?? '';
  } while (cursor);
  return rows;
}
