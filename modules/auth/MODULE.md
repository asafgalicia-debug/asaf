# Módulo: Autenticación (auth)

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/auth/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `auth` |
| Estado | `planeado` |
| Fase | FASE 6 — Autenticación |
| API prevista | `/api/v1/auth` |
| Prefijo de permiso | `auth` (operaciones abiertas con usuario válido) |

## Propósito
Registro de usuarios, inicio y cierre de sesión, tokens (§8), recuperación de contraseña y control de sesión (último acceso).

## Entidades principales
- `Sesion` (refresh tokens, revocación).
- `RecuperacionPassword` (token temporal de un solo uso).

## Permisos previstos
- `auth.login` / `auth.logout`: requieren usuario válido, no permiso de módulo.
- Registro y restablecimiento administrado: `usuarios.configurar`.

## Dependencias / notas
- Contraseñas **nunca** en texto plano (hash; algoritmo a decidir y justificar en FASE 6).
- Rate limiting específico en login.
- Auditoría de accesos: intentos fallidos, cierres de sesión.
- Comparte infraestructura: `backend/src/security/` y `backend/src/errors/`.
