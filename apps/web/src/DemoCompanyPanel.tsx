import { useMemo, useState } from 'react';
import { makeDemoProducts, demoCompany, filterDemoProducts } from './demoProducts';
import { catalogDocument } from './exportDocument';
import { DocumentExportButtons } from './DocumentExportButtons';
export function DemoCompanyPanel({ onClose }: { onClose: () => void }) {
  const products = useMemo(makeDemoProducts, []);
  const [query, setQuery] = useState(''), [page, setPage] = useState(0);
  const filtered = useMemo(() => filterDemoProducts(products, query), [products, query]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
  return <main style={{maxWidth:1100,margin:'0 auto',padding:'32px 20px'}}><section className="panel">
    <div className="eyebrow">EMPRESA DE DEMOSTRACIÓN · LOCAL</div><h1>{demoCompany.name}</h1>
    <p>2,000 productos ficticios: 1,800 activos y 200 inactivos. Funciona sin conexión y no guarda registros en tu empresa. Los productos de demostración no se usan en movimientos reales.</p>
    <label>Buscar nombre o SKU<input maxLength={100} value={query} onChange={event => { setQuery(event.target.value); setPage(0); }}/></label>
    <p>{filtered.length} resultados · Página {page + 1} de {totalPages} · 20 por página</p>
    <DocumentExportButtons document={catalogDocument('products', filtered, demoCompany.name, undefined, query, true)}/>
    <p>La exportación incluye todos los resultados del filtro. Sin filtro incluye los 2,000 productos. Precios sin moneda informada; no representa existencias.</p>
    <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Nombre</th><th>SKU</th><th>Estado</th><th>Precio</th></tr></thead><tbody>{filtered.slice(page * 20, page * 20 + 20).map(row => <tr key={row.id}><td>{row.name}</td><td>{row.sku}</td><td>{row.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</td><td>{row.price?.toFixed(2)}</td></tr>)}</tbody></table></div>
    {!filtered.length && <p>No hay coincidencias.</p>}
    <button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Anterior</button><button disabled={page + 1 >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</button>
    <button onClick={onClose}>Salir de la demostración</button>
  </section></main>;
}
