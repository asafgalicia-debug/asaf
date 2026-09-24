# Módulo: Productos

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/productos/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `productos` |
| Estado | `planeado` |
| Fase | FASE 12 — Productos e inventario |
| API prevista | `/api/v1/products`, `/api/v1/categories` |
| Prefijo de permiso | `productos`, `categorias` |

## Propósito
Catálogo de productos y su clasificación en categorías, base de inventario, ventas y compras.

## Entidades principales
- `Producto` (SKU, nombre, unidad, precios de referencia, estado).
- `Categoria` (árbol de clasificación por empresa).

## Permisos previstos
`productos.ver`, `productos.crear`, `productos.editar`, `productos.eliminar`, `productos.exportar`;
`categorias.ver`, `categorias.crear`, `categorias.editar`.

## Dependencias / notas
- Mapeo §6: ítems 9 (Productos) y 10 (Categorías) → este módulo.
- SKU **único por empresa** (índice y validación de duplicados).
- Los niveles de existencia NO viven aquí: van en `inventario`.
- Contexto multiempresa: catálogo por empresa (o compartido, decisión a documentar en FASE 12).
