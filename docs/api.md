# API

## Base

- API versionada: `/api/v1`.
- Estado del proceso: `GET /health` o `GET /health/live`.
- Estado de MongoDB: `GET /health/ready` (responde 503 si Mongo no estÃ¡ configurado o disponible).
- Estado de API: `GET /api/v1/health`.
- Manifiestos disponibles: `GET /api/v1/modules`.

## AutenticaciÃ³n y tenant

Las rutas protegidas requieren `Authorization: Bearer <JWT>`. El middleware construye el contexto de usuario, empresa y sucursal desde las reclamaciones del token. Los endpoints no deben confiar en identificadores de tenant que vengan en el body.

## Prefijos registrados

Entre los prefijos actuales estÃ¡n `/auth`, `/users`, `/roles`, `/companies`, `/departments`, `/customers`, `/suppliers`, `/categories`, `/products`, `/warehouses`, `/transfers`, `/employees`, `/projects`, `/audit`, `/dashboard`, `/notifications`, `/reports`, `/integrations`, `/ai`, `/production`, `/sales`, `/purchase-orders`, `/bank-accounts`, `/cash-movements`, `/incomes`, `/expenses` e `/invoices`.

Consulta `backend/src/routes/index.ts` para el registro exacto y las rutas de cada mÃ³dulo. La documentaciÃ³n no sustituye el cÃ³digo de rutas.

## Formato de respuesta

Ã‰xito: `{ "ok": true, "data": ... }`. Error: `{ "ok": false, "error": { "code": "...", "message": "...", "errorId": "..." } }`.

## OperaciÃ³n

En PowerShell, ejecuta cada comando desde `backend` por separado: `npm.cmd run typecheck` y `npm.cmd test`. No uses `npm.cmd run typecheck y npm.cmd test` como una sola lÃ­nea: `y` se interpreta como argumento de TypeScript.
