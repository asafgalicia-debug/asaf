# Módulo: Empresas (sucursales y departamentos)

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/empresas/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `empresas` |
| Estado | `planeado` |
| Fase | FASE 7 — Usuarios, roles y permisos |
| API prevista | `/api/v1/companies`, `/api/v1/branches`, `/api/v1/departments` |
| Prefijo de permiso | `empresas`, `sucursales`, `departamentos` |

## Propósito
Administrar la jerarquía organizativa `EMPRESA -> SUCURSAL -> DEPARTAMENTO` (§5, §7) y ser la **raíz del aislamiento multiempresa**.

## Entidades principales
- `Empresa` (razón social, estado, datos generales).
- `Sucursal` (pertenencia a empresa, estado).
- `Departamento` (pertenencia a empresa/sucursal, estado).

## Permisos previstos
`empresas.ver/crear/editar/eliminar/configurar`, `sucursales.ver/crear/editar/eliminar`, `departamentos.ver/crear/editar/eliminar`.

## Dependencias / notas
- Mapeo §6: ítems 4 (Empresas), 5 (Sucursales) y 6 (Departamentos) → este módulo.
- El `companyId` de esta jerarquía es el filtro obligatorio de tenancy en **todos** los módulos.
- Una empresa no consulta datos de otra (§7): verificado con tests de aislamiento.
- La activación de módulos por empresa se gestiona con `configuracion` (registro empresa+modulo+estado).
