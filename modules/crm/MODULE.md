# Módulo: CRM

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/crm/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `crm` |
| Estado | `planeado` |
| **Fase** | **sin asignar** (inconsistencia I-07: existe en §6 pero no en §39. Propuesta: posterior a FASE 23. Requiere confirmación.) |
| API prevista | `/api/v1/crm` |
| Prefijo de permiso | `crm` |

## Propósito
Oportunidades de venta, pipeline por etapas y seguimiento de interacciones con clientes potenciales.

## Entidades principales
- `Oportunidad` (cliente potencial, monto estimado, etapa, estado).
- `EtapaPipeline` (configurable por empresa).
- `Interaccion` (contacto, notas, fecha).

## Permisos previstos
`crm.ver`, `crm.crear`, `crm.editar`, `crm.eliminar`, `crm.exportar`.

## Dependencias / notas
- Referencia a `clientes` (o prospectos propios: decisión en su fase).
- Puede alimentar `ventas` (oportunidad ganada → cotización): integración a documentar cuando se defina la fase.
