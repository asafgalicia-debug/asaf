# Cierre del ERP y actualización conjunta

Estado al 5 de octubre de 2026. La existencia de una API o de pruebas aprobadas no equivale a un módulo completo ni a una revisión de uso real.

## Implementación local pendiente de publicación

- Usuarios y acceso: directorio, creación, cambio de nombre/rol/estado y revocación de sesiones.
- Departamentos y asignación de empleados.
- Bandeja de avisos internos.
- Proyectos: creación, edición, estados, avance y exportación individual.
- Producción: planificación, inicio, cancelación, finalización con entrada de producto terminado y exportación individual.
- Facturación: borradores, creación desde venta, cancelación auditada, consulta y exportación individual. No emite comprobantes fiscales.

## Pendientes funcionales

- Completar la cobertura de pantallas y operaciones de los módulos adicionales del router. CRM, logística, mantenimiento, calidad y activos, entre otros, todavía no cuentan con cierre funcional verificado en ambas aplicaciones.
- Revisar administración de roles, empresas/sucursales y configuración para documentar la cobertura real de API y pantallas.
- Producción avanzada: consumo automático de materias primas, costos y finalización parcial no están implementados en el flujo actual.
- Facturación fiscal: faltan proveedor, configuración y validación de la integración. Los borradores actuales no sustituyen esa emisión.
- Integraciones, IA y entrega de notificaciones email/push no están implementadas de extremo a extremo. La verificación de correo con Resend confirmada por el usuario es un flujo independiente.
- La problemática del documento queda fuera de este trabajo por instrucción del usuario.

## Verificación antes de publicar

- Revisar las pantallas con sesión autenticada y permisos de distintos usuarios.
- Probar venta/cobro, compra/pago, movimientos y transferencias, empleados, acceso, proyectos, producción y borradores desde las interfaces; comprobar historial, auditoría y aislamiento de sucursales.
- Guardar y abrir PDF/Excel desde navegador y teléfono. La escritura/lectura automática de Excel ya se verifica en pruebas; no equivale a confirmar todos los diálogos de guardado reales.
- Ejecutar las compilaciones y pruebas finales tras las últimas correcciones.

## Publicación conjunta

- Preparar un cambio revisado con backend, web y móvil consistentes, dependencias y documentación. Los nuevos módulos todavía son locales.
- Generar la APK de distribución, verificar contenido y firma, e instalarla en el teléfono autorizado para la comprobación final.
- Publicar los cambios correspondientes en Render y verificar API, sesión, versión web y flujos críticos.
- Entregar APK y enlaces de la web junto con un registro de versión, resultados y limitaciones reales. No declarar todo el ERP terminado mientras existan pendientes funcionales o de verificación.

## Avance CRM posterior a la lista inicial

CRM ahora cuenta con persistencia, creación y cambio de etapa auditados en API, y consulta paginada en ambas aplicaciones. Siguen pendientes los formularios de escritura y la verificación visual autenticada. No se publicó este avance.

### Formularios CRM implementados

Los formularios de creación y cambio de etapa ya están implementados en ambas aplicaciones, junto con PDF/Excel individual. Sigue pendiente revisar visualmente el flujo autenticado y los archivos en el teléfono. La creación/cierre no genera ventas ni cobros. Los otros pendientes de la lista siguen vigentes.

### Logística implementada

El seguimiento de envíos ya persiste en MongoDB, con creación desde venta, cambios de estado auditados y pantallas web/móvil. Incluye exportaciones individuales. Pendientes: comprobación visual autenticada, guardado/compartir en el teléfono y revisión final antes de publicar. Seguimiento externo de transportistas y movimientos automáticos de stock no forman parte de este flujo implementado.

### Mantenimiento: avance del 6 de octubre

Ya tiene API persistente y auditada, resumen de registros reales, consulta web/móvil y PDF/Excel por orden. Faltan formularios de creación y cambio de estado en ambas aplicaciones y revisión visual. El equipo se identifica por nombre; no se han implementado costos, enlace a activos ni consumo automático de repuestos. Cambios sin publicar.

### Formularios de Mantenimiento implementados

Creación, inicio, cancelación y finalización con resultado ya están conectados en web y móvil. Permanecen pendientes la revisión visual autenticada, archivos reales en el teléfono y actualización conjunta. El registro de activos y costos/repuestos no está incluido en este flujo.


### Calidad — 6 de octubre de 2026
Inspecciones persistentes por empresa y sucursal en API, web y móvil: objeto, criterios, fecha, prioridad, avance y cierre con resultado aprobado/con observaciones/rechazado y nota obligatoria. Cambios con control de versión y auditoría transaccional; búsqueda literal y paginación; exportación individual PDF/Excel. El resumen cuenta registros reales. Lectura con usuarios.ver y gestión con usuarios.editar.
Verificación: 351 pruebas generales de API, 52 de integración MongoDB aislado y 4 pruebas de acciones de clientes aprobadas; compilación API/web y tipos móvil aprobados en la copia temporal. La carpeta original sigue con dependencias incompletas de exportación. Pendiente revisión visual autenticada y publicación conjunta web/APK. Este flujo no calcula rendimiento, no certifica cumplimiento externo ni bloquea existencias. No se ha publicado ni instalado una APK nueva.


### Activos — 6 de octubre de 2026
Registro real por empresa/sucursal con nombre, código único normalizado, ubicación y estado operativo, mantenimiento, fuera de servicio o retirado. Creación y edición en web/móvil; retiro definitivo, control de versión, auditoría transaccional y búsquedas paginadas. PDF/Excel individual con datos reales. El resumen de API cuenta estados; ya no devuelve porcentajes ficticios. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: API compilada, 352 pruebas generales, 53 de integración MongoDB aislado y 4 de acciones de clientes aprobadas; compilación web y tipos móvil aprobados en copia temporal. Pendientes revisión visual autenticada y actualización conjunta. No incluye depreciación, valor contable, sensores de uso ni enlace automático de órdenes de mantenimiento al activo. Cambios locales, sin publicar ni instalar APK.


### Mesa de ayuda — 6 de octubre de 2026
Tickets persistentes de soporte interno por empresa/sucursal: asunto, descripción, fecha objetivo y prioridad. Web y móvil permiten creación, inicio, cancelación y resolución con nota obligatoria; búsquedas literales paginadas y exportación individual PDF/Excel. Resuelto y cancelado son estados finales. Control de versión y auditoría transaccional, incluida reversión de resolución si falla auditoría. El resumen de API cuenta tickets reales y ya no publica incidentes, MTTR ni cumplimiento SLA ficticios. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: 353 pruebas generales API, 54 de integración MongoDB aislado y 6 de acciones/exportación de clientes aprobadas; compilaciones API/web y tipos móvil aprobados. Pendiente revisión visual autenticada, archivos en teléfono y publicación conjunta. No incluye asignación de agentes, conversación por comentarios, adjuntos ni cálculo/contratación de SLA. Cambios locales, sin publicar ni instalar APK.


### Riesgos — 6 de octubre de 2026
Registro cualitativo por empresa/sucursal: nombre, plan de mitigación, fecha de revisión y nivel bajo/medio/alto. Creación, inicio de mitigación, descarte y cierre con conclusión en API/web/móvil. Estados finales inmutables, control de versión, auditoría transaccional, búsqueda paginada y PDF/Excel individual. El resumen cuenta registros reales; elimina la exposición monetaria y mitigación porcentual de ejemplo. Lectura usuarios.ver y gestión usuarios.editar.
Verificación acumulada: 354 pruebas generales API, 55 de integración MongoDB aislado, 102 pruebas web y 125 móviles aprobadas; compilaciones API/web y tipos móvil aprobados. Incluye reversión de cierre si falla auditoría y una sola finalización ante concurrencia. Pendientes revisión visual autenticada y publicación conjunta. No calcula exposición monetaria, probabilidad estadística ni cumplimiento certificado; tampoco permite editar el plan después de crear este registro básico. Cambios locales, sin nueva publicación ni APK.


### Cumplimiento — 6 de octubre de 2026
Obligaciones internas persistentes por empresa/sucursal: nombre, requisito, fecha límite y prioridad. Creación, inicio de revisión, cancelación y cierre con resultado conforme/con observaciones/no conforme y evidencia escrita obligatoria en API/web/móvil. Estados finales protegidos, control de versión, auditoría transaccional, búsqueda paginada y exportación individual PDF/Excel. El resumen cuenta obligaciones reales y elimina porcentajes de cobertura de ejemplo. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: 355 pruebas generales API, 56 de integración MongoDB aislado y 10 pruebas dirigidas de Cumplimiento/Calidad aprobadas; compilaciones API/web y tipos móvil aprobados. Comprobadas reversión de cierre ante auditoría fallida, aislamiento por sucursal y cierre único concurrente. También corregido el guardado desde estados finales en los clientes de Calidad. Pendientes revisión visual autenticada, archivos reales y publicación conjunta. La evidencia es texto, sin adjuntos; no incluye reglas regulatorias, calendarios recurrentes ni certificación/dictamen legal. Cambios locales, sin publicar web/API ni instalar nueva APK.


### Roles — 6 de octubre de 2026
Consulta de roles asignables y creación de roles de empresa en web/móvil, con selección explícita de permisos actuales del actor y exportación individual PDF/Excel. Los roles de empresa se comparten entre sus sucursales; los de sistema se consultan. El alta y auditoría ahora forman una transacción, para evitar un rol creado cuando falla auditoría. Alta no cambia automáticamente permisos de usuarios existentes; la asignación se hace desde Usuarios.
Verificación: 355 pruebas generales API, 57 de integración MongoDB aislado y 6 pruebas dirigidas de clientes/documentos aprobadas; compilaciones API/web y tipos móvil aprobados. Probados límites de empresa, prohibición de permisos elevados, nombres reservados y alta concurrente sin duplicación. Lectura usuarios.ver y creación usuarios.editar. Pendiente edición/desactivación de roles existentes, paginación del catálogo de roles, revisión visual y publicación conjunta. La pantalla filtra localmente la lista cargada; no representa un catálogo paginado del servidor. Cambios locales, sin publicar ni nueva APK.


### Edición de roles — 6 de octubre de 2026
Edición de descripción y permisos de roles de empresa en API/web/móvil. Nombre inmutable y roles de sistema protegidos; no se permite editar el rol del propio actor ni uno con permisos superiores. Control de versión y rechazo de cambios vacíos. Rol, permisos de todos sus usuarios de la empresa (incluidas otras sucursales), incremento de sessionVersion y auditoría se guardan en una transacción. Las sesiones anteriores se revocan. La confirmación de interfaz advierte ese alcance.
La asignación de roles al crear usuarios o cambiar su acceso ahora bloquea el documento del rol dentro de la transacción para evitar copiar permisos antiguos mientras se edita. Verificación: 355 pruebas generales API, 59 de integración MongoDB aislado y 12 pruebas dirigidas de roles/acceso de clientes aprobadas; compilaciones API/web y tipos móvil aprobados. Incluye reversión ante fallo de auditoría, protección del propio rol, dos ediciones concurrentes con un solo resultado y carrera entre alta de usuario y edición de rol. Pendientes desactivación de roles, paginación del catálogo, revisión visual autenticada y actualización conjunta. Cambios locales sin publicar ni nueva APK.
