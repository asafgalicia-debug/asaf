# Publicación web — 2026-10-05

Commit publicado: a8b911b (master de asafgalicia-debug/asaf).

Render confirmado: https://nucleo-erp-web.onrender.com/ sirve /assets/index-nUFeSZQL.js y contiene la URL HTTPS de la API pública. /health/ready devolvió HTTP 200, ok true y status ready.

La web publica inventario, catálogos, ventas, compras, finanzas, informes por período, empleados y auditoría, con los permisos y consultas paginadas existentes. Se incorporaron activación/desactivación de empleados, comparación de estado original y confirmación de identidad; no cambia la cuenta de acceso.

Empresa de demostración local, separada de los datos reales: 2,000 productos, 1,800 activos y 200 inactivos. Verificación visual en Render: 2,000 resultados y 100 páginas; búsqueda DEMO-PROD-2000 devuelve exactamente el último producto. No se escribieron registros de producción.

Exportación XLSX con precios numéricos y metadatos; PDF mediante Guardar como PDF del diálogo de impresión. Catálogos reales consultan todas las páginas del filtro, con límite explícito de 10,000 y cancelación; no generan un archivo parcial ante falla. Informes también incorporan Excel/PDF.

Validación: compilación web y backend; 53 pruebas web y 78 pruebas móviles aprobadas, más typecheck móvil. Pruebas XLSX leen de vuelta los 2,000 productos y verifican precio numérico; HTML PDF incluye todas las filas y escapa contenido. El navegador integrado no confirmó el evento de descarga de Excel; el guardado PDF y las acciones autenticadas requieren revisión en el navegador habitual. El usuario confirmó antes que la demostración y exportaciones de la app funcionan perfectamente en su teléfono.

No se considera terminado el ERP integral. No se integró la problemática del documento.
