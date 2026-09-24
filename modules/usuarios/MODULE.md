# Módulo: Usuarios

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/usuarios/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `usuarios` |
| Estado | `planeado` |
| Fase | FASE 7 — Usuarios, roles y permisos |
| API prevista | `/api/v1/users` |
| Prefijo de permiso | `usuarios` |

## Propósito
Gestionar el ciclo de vida del usuario: alta, baja, perfil, estado, empresa y sucursal de pertenencia, último acceso y auditoría (§8).

## Entidades principales
- `Usuario` (perfil, estado activo/inactivo, referencia a empresa, sucursal y roles, último acceso).

## Permisos previstos
`usuarios.ver`, `usuarios.crear`, `usuarios.editar`, `usuarios.eliminar`, `usuarios.configurar`.

## Dependencias / notas
- Contexto multiempresa: un administrador solo gestiona usuarios de **su** empresa.
- La contraseña solo se recibe/almacena hasheada; nunca se devuelve en respuestas.
- El alta/rol de usuarios requiere permiso; nadie asume acceso total (§9).
