# Verificación de correo con Resend

Configuración del servicio backend nucleo-erp-api en Render: RESEND_API_KEY (secreto), RESEND_FROM=Núcleo ERP <onboarding@resend.dev>. EMAIL_VERIFICATION_BASE_URL por defecto https://nucleo-erp-api.onrender.com/api/v1; usar HTTPS. Nunca guardar la clave en frontend o repositorio.

Abrir https://nucleo-erp-api.onrender.com/api/v1/auth/email-verification/start e ingresar credenciales del ERP. Solicita verificación de la cuenta autenticada, nunca un destinatario suministrado por el cliente. En modo resend.dev solo admite el correo asociado a la cuenta de Resend. Verificar otro destinatario requiere dominio validado. Fuente: https://resend.com/docs/knowledge-base/403-error-resend-dev-domain

El correo incluye un enlace de 15 minutos. GET presenta confirmación sin consumirlo, POST marca emailVerifiedAt mediante operación atómica. Token aleatorio de 32 bytes; solo SHA256 se guarda en MongoDB. Enlace inválido tras uso, expiración o cambio de correo; requiere usuario activo. Resolicitud limitada persistentemente a una por minuto. Un fallo de envío elimina el token utilizable y no registra éxito. Logs del ERP usan nombre de ruta, no query/token. Revisar también la política de logs del proxy/hosting.

POST /api/v1/auth/email-verification/request admite sesión Bearer y empresa/sucursal propias. Página independiente no requiere publicar nuevamente la web. Login actual sigue disponible: esta implementación registra confirmación y no obliga todavía a verificar para entrar. No añade recuperación de contraseña ni registro público.

Validación: build backend, 328 pruebas generales y 36 integraciones MongoDB locales. Pruebas de envío simulado, uso único concurrente, hash oculto, caducidad, cooldown, cambio de correo y fallo de proveedor. No se usó clave real ni se enviaron correos durante pruebas. Confirmación de envío real pendiente en cuenta del usuario.
