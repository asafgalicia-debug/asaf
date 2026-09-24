# EjecuciÃ³n y despliegue

## Desarrollo en Windows

1. Instala Node.js LTS.
2. Desde la raÃ­z instala dependencias con `npm.cmd install`.
3. Conserva el `.env` local y confirma que MongoDB responda; no pegues su URI en documentaciÃ³n.
4. Inicia la API desde la raÃ­z con `npm.cmd run dev:api`, o desde `backend` con `npm.cmd run dev`.
5. Comprueba `http://localhost:4000/health/live` y `http://localhost:4000/api/v1/health` (si `PORT` es distinto, usa ese puerto).

Para validar: entra a `backend` y ejecuta `npm.cmd run typecheck`, luego `npm.cmd test` en otra lÃ­nea.

## ProducciÃ³n

- Construye la API con `npm.cmd --workspace backend run build` desde la raÃ­z y arrÃ¡ncala con `npm.cmd --workspace backend run start`.
- Configura secretos mediante el entorno de despliegue, no mediante archivos versionados.
- Proporciona MongoDB Atlas con permisos mÃ­nimos, TLS y copias de seguridad.
- Configura `NODE_ENV=production`, `CORS_ORIGIN` con el origen real y HTTPS de extremo a extremo.
- Supervisa `/health/live` y `/health/ready`; establece lÃ­mites de recursos y backups/retenciÃ³n.
- Antes de escalar a varias rÃ©plicas, reemplaza el rate limiter de memoria por uno distribuido y verifica Ã­ndices.

El despliegue web/mÃ³vil y las conexiones externas se documentarÃ¡n cuando esas interfaces y adaptadores estÃ©n terminados.
