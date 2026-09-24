# Módulo: Recursos Humanos

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/recursos-humanos/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `recursos-humanos` |
| Estado | `planeado` |
| Fase | FASE 17 — RRHH |
| API prevista | `/api/v1/hr` |
| Prefijo de permiso | `rrhh` |

## Propósito
Gestión de personal ligada a la estructura empresa/sucursal/departamento: expedientes, ausencias y datos laborales básicos.

## Entidades principales
- `Empleado` (expediente, vínculo con empresa/sucursal/departamento, estado).
- `Ausencia` (solicitudes y aprobaciones; detalle a definir en FASE 17).

## Permisos previstos
`rrhh.ver`, `rrhh.crear`, `rrhh.editar`, `rrhh.eliminar`, `rrhh.exportar`.

## Dependencias / notas
- Mapeo §6: ítem 24 (RRHH) → este módulo.
- `Empleado` **referencia** a `Usuario` cuando aplique (no duplicar datos personales).
- Datos sensibles: acceso restringido por permiso y aislado por empresa.
- Nómina: fuera del alcance actual; no se diseña sin especificación.
