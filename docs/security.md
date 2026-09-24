# Seguridad

## Controles implementados

- ContraseÃ±as con hash y JWT con expiraciÃ³n configurada.
- AutenticaciÃ³n, autorizaciÃ³n por permiso y contexto tenant desde el token.
- LÃ­mite de intentos de login por IP en memoria: 10 por ventana de 15 minutos, con mÃ¡ximo de 20,000 IPs en seguimiento.
- Cabeceras `nosniff`, `DENY`, polÃ­tica CSP para API y `Referrer-Policy`; HSTS solo en `NODE_ENV=production`.
- CORS limitado a `CORS_ORIGIN`; JSON de entrada limitado a 1 MB.
- Errores internos no exponen stack trace. JSON mal formado responde 400.
- Logs registran ruta sin query string para reducir riesgo de revelar tokens por URL.
- Credenciales no se aceptan en `config` de integraciones; Ã©stas se crean pausadas.

## OperaciÃ³n segura

- No compartas ni publiques `.env`, tokens ni contraseÃ±as. Usa un gestor de secretos para despliegues.
- Termina TLS en el servidor o proxy de producciÃ³n. HSTS solo es apropiado si todo el dominio opera por HTTPS.
- El lÃ­mite de login en memoria no coordina mÃºltiples rÃ©plicas; producciÃ³n multi-instancia debe usar rate limiting distribuido y configurar correctamente el proxy confiable.
- Revisa permisos, aislamiento de empresa/sucursal y auditorÃ­a en cada endpoint nuevo.
- Las solicitudes de IA no llaman proveedores; integra consentimiento, minimizaciÃ³n de datos y gestiÃ³n segura de credenciales antes de habilitar un proveedor.
- La factura es un borrador de datos y no certifica cumplimiento fiscal.
