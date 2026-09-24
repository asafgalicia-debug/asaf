# Módulo: Roles y permisos

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/roles/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `roles` |
| Estado | `planeado` |
| Fase | FASE 7 — Usuarios, roles y permisos |
| API prevista | `/api/v1/roles`, `/api/v1/permissions` |
| Prefijo de permiso | `roles` |

## Propósito
Modelo RBAC (§9): definir roles, asignar permisos `"<modulo>.<accion>"` y vincularlos a usuarios.

## Entidades principales
- `Rol` (nombre, descripción, permisos asignados).
- `Permiso` (catálogo derivado de los manifests de los módulos activos).
- Asignación `Usuario <-> Rol`.

## Permisos previstos
`roles.ver`, `roles.crear`, `roles.editar`, `roles.eliminar`, `roles.configurar`.

## Dependencias / notas
- Roles base a sembrar (§9): ADMIN, GERENTE, VENTAS, COMPRAS, ALMACÉN, CONTABILIDAD, RRHH, PRODUCCIÓN, AUDITOR, CONSULTA. La **matriz exacta** se define en FASE 7 (hoy no existe: no se inventa).
- **Denegación por defecto:** sin permiso explícito → denegado.
- El catálogo de permisos disponibles proviene de los manifests de los módulos activos de la empresa.
- Nivelar permisos por encima del propio rol (p. ej. no auto-degradarse) es decisión de FASE 7.
