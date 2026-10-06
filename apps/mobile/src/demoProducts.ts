import type { CatalogEntry } from './api';

export const demoCompany = { id: 'demo-local-nucleo', name: 'Núcleo · Empresa de demostración' } as const;
// Deterministic local fixtures. No login, API writes or production tenant IDs.
export function makeDemoProducts(): CatalogEntry[] {
  const families = ['Herramienta', 'Papelería', 'Accesorio', 'Consumible', 'Equipo'];
  return Array.from({ length: 2000 }, (_, index) => {
    const number = index + 1;
    return {
      id: `demo-product-${String(number).padStart(4, '0')}`,
      name: `${families[index % families.length]} de prueba ${String(number).padStart(4, '0')}`,
      sku: `DEMO-PROD-${String(number).padStart(4, '0')}`,
      status: number % 10 === 0 ? 'INACTIVE' : 'ACTIVE',
      price: (1000 + ((number * 137) % 99000)) / 100
    };
  });
}

export function filterDemoProducts(rows: CatalogEntry[], query: string): CatalogEntry[] {
  const search = query.trim().toLocaleLowerCase('es-MX');
  return rows.filter(row => `${row.name} ${row.sku}`.toLocaleLowerCase('es-MX').includes(search));
}
