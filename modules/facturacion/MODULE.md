# Módulo: Facturación

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/facturacion/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `facturacion` |
| Estado | `planeado` |
| Fase | FASE 16 — Facturación |
| API prevista | `/api/v1/billing` |
| Prefijo de permiso | `facturacion` |

## Propósito
Emisión y gestión de comprobantes fiscales/conceptuales vinculados a ventas, con integración a proveedor externo **por especificar**.

## Entidades principales
- `Comprobante` (referencia a venta, estado, serie/folio según reglas del proveedor).

## Permisos previstos
`facturacion.ver`, `facturacion.crear`, `facturacion.editar`, `facturacion.autorizar`, `facturacion.exportar`.

## Dependencias / notas
- **NO** se implementan reglas fiscales mexicanas sin especificación posterior (§21): la capa de integración queda preparada (ver módulo `integraciones`).
- Depende de: `ventas`, `clientes`.
- El proveedor de facturación se conecta **vía `integraciones`**, nunca acoplado directo en este módulo (§25).
