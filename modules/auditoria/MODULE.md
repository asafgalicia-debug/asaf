# Módulo: Auditoría

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/auditoria/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `auditoria` |
| Estado | `planeado` |
| Fase | FASE 8 — Auditoría |
| API prevista | `/api/v1/audit` |
| Prefijo de permiso | `auditoria` |

## Propósito
Consulta y exportación de los eventos de auditoría registrados por todo el sistema (§10).

## Entidades principales
- `EventoAuditoria`: usuario, fecha, hora, empresa, sucursal, acción, módulo, registro afectado, estado anterior, estado nuevo, IP, info técnica. **Append-only.**

## Permisos previstos
`auditoria.ver`, `auditoria.exportar`.

## Dependencias / notas
- Separación R3: la **escritura** de eventos vive en `backend/src/audit/` (infraestructura usada por todos los módulos); este módulo solo **lee**.
- Ejemplo de evento: `ventas01 | MODIFICAR_CLIENTE | 2026-09-22 | CLIENTE-00125 | Teléfono anterior → Teléfono nuevo`.
- Auditor solo ve su empresa (aislamiento multiempresa aplicado también aquí).
- Los eventos no se editan ni se borran.
