# Módulo: Compras

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/compras/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `compras` |
| Estado | `planeado` |
| Fase | FASE 14 — Compras |
| API prevista | `/api/v1/purchases` |
| Prefijo de permiso | `compras` |

## Propósito
Ciclo de abastecimiento (§20): solicitudes → cotizaciones → orden de compra → recepción → factura → pago, con estados y aprobaciones.

## Entidades principales
- `SolicitudCompra`.
- `CotizacionCompra` (comparativo por proveedor).
- `OrdenCompra` (estado, aprobación).
- `Recepcion` (entrada de mercancía).
- `FacturaCompra`, `PagoCompra`.

## Permisos previstos
`compras.ver`, `compras.crear`, `compras.editar`, `compras.aprobar`, `compras.exportar`.

## Dependencias / notas
- Estados centralizados (`BORRADOR|PENDIENTE|APROBADO|RECHAZADO|COMPLETADO|CANCELADO`).
- La recepción genera entrada en `inventario` (trazable).
- Depende de: `proveedores`, `productos`, `inventario`.
- Pagos → asiento en `finanzas` cuando exista (FASE 15), sin duplicar registros.
