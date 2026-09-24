# Módulo: Configuración

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/configuracion/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `configuracion` |
| Estado | `planeado` |
| Fase | FASE 9 — Sistema modular |
| API prevista | `/api/v1/config` |
| Prefijo de permiso | `configuracion` |

## Propósito
Parámetros del sistema por empresa/sucursal y **activación de módulos** por empresa (§1, §16): qué módulos tiene habilitados cada compañía.

## Entidades principales
- `Parametro` (clave, valor, ámbito: global/empresa/sucursal, estado).
- Registro de activación: `empresaId + moduloId + estado` (qué módulos están activos).

## Permisos previstos
`configuracion.ver`, `configuracion.configurar`.

## Dependencias / notas
- Fuente única de verdad de la activación módulo×empresa: `GET /api/v1/modules` la consume.
- Nada de configuración hardcodeada en el código (§16, §3).
- Depende de: `empresas`.
