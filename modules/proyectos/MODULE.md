# Módulo: Proyectos

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/proyectos/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `proyectos` |
| Estado | `planeado` |
| Fase | FASE 19 — Proyectos |
| API prevista | `/api/v1/projects` |
| Prefijo de permiso | `proyectos` |

## Propósito
Gestión de proyectos: alcance, tareas, fechas,responsables y avance (constructoras, despachos, empresas de servicios).

## Entidades principales
- `Proyecto` (nombre, cliente, fechas, estado, responsable).
- `Tarea` (asignación, vencimiento, estado).
- Registro de avance.

## Permisos previstos
`proyectos.ver`, `proyectos.crear`, `proyectos.editar`, `proyectos.eliminar`, `proyectos.exportar`.

## Dependencias / notas
- Contexto multiempresa: proyectos por empresa.
- Estados solo desde `shared/constants`.
- Relación con `crm`/`clientes` como referencia (sin duplicar).
