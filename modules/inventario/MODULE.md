# Módulo: Inventario

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/inventario/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `inventario` |
| Estado | `planeado` |
| Fase | FASE 12 — Productos e inventario |
| API prevista | `/api/v1/inventory`, `/api/v1/warehouses`, `/api/v1/transfers` |
| Prefijo de permiso | `inventario`, `almacenes`, `transferencias` |

## Propósito
Control de existencias trazable (§18): entradas, salidas, transferencias, stock mín/máx, kardex, ajustes e historial.

## Entidades principales
- `Existencia` (producto × almacén × sucursal, stock mínimo/máximo).
- `Almacen`.
- `Movimiento` (entrada/salida, motivo, referencia).
- `Transferencia` (origen → destino, estado).
- `Ajuste` y `Kardex` (historial inmutable de movimientos).

## Permisos previstos
`inventario.ver`, `inventario.crear`, `inventario.editar`, `inventario.exportar`;
`almacenes.ver/crear/editar`;
`transferencias.crear`, `transferencias.autorizar`;
`inventario.autorizar` (ajustes fuera de rango).

## Dependencias / notas
- Mapeo §6: ítems 15 (Inventario), 16 (Almacenes) y 17 (Transferencias) → este módulo.
- **Toda** modificación de inventario es trazable (quién, cuándo, antes/después) y genera evento de auditoría.
- Alerta de stock mínimo → canal de `notificaciones` (cuando exista, FASE 21).
- Depende de: `productos`, `empresas`.
