# Módulo: Ventas

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/ventas/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `ventas` |
| Estado | `planeado` |
| Fase | FASE 13 — Ventas |
| API prevista | `/api/v1/sales`, `/api/v1/quotes`, `/api/v1/orders` |
| Prefijo de permiso | `ventas` |

## Propósito
Ciclo comercial completo (§19): cotización → pedido → venta, con descuentos, impuestos, totales, pagos y estados.

## Entidades principales
- `Cotizacion` (líneas, precios, vigencia, estado).
- `Pedido` (referencia a cotización/cliente, estado).
- `Venta` (líneas, descuento, impuesto, total, estado, pago).
- `PagoVenta`.

## Permisos previstos
`ventas.ver`, `ventas.crear`, `ventas.editar`, `ventas.eliminar`, `ventas.aprobar`, `ventas.exportar`.

## Dependencias / notas
- Mapeo §6: ítems 11 (Ventas), 12 (Cotizaciones) y 13 (Pedidos) → este módulo.
- Estados **solo** con las constantes de `shared/constants` (§27).
- El cálculo de totales/impuestos se hace **siempre en backend**; el frontend solo presenta.
- Movimiento de inventario derivado de la venta (integración documentada en FASE 13).
- Facturación del comprobante → módulo `facturacion` (no duplicar lógica fiscal aquí).
- Depende de: `clientes`, `productos`, `inventario`.
