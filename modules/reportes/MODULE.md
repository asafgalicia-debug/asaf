# Módulo: Reportes

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/reportes/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `reportes` |
| Estado | `planeado` |
| Fase | FASE 20 — Reportes |
| API prevista | `/api/v1/reports` |
| Prefijo de permiso | `reportes` |

## Propósito
Reportes transversales con filtros (§24) y preparación de exportaciones (PDF, Excel, CSV).

## Entidades principales
- Definición/parámetros de reporte (filtros: fecha, empresa, sucursal, usuario, módulo).
- Resultados agregados (no persisten duplicados de datos de otros módulos).

## Permisos previstos
`reportes.ver`, `reportes.exportar`.

## Dependencias / notas
- Lee de otros módulos **por referencia** (service/repositorio), nunca copiando colecciones.
- Exportación PDF/Excel/CSV: dependencia nueva (p. ej. librería de plantillas) → se justifica en FASE 20, no antes.
- Aislamiento: los filtros de empresa/sucursal respetan los permisos del usuario.
