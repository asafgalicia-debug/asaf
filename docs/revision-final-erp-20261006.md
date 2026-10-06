# Revisión final del alcance actual de Núcleo ERP

Fecha: 6 de octubre de 2026. Base revisada: 93b09ed y correcciones de tipos de esta revisión.

## Resultado

La revisión técnica automatizada de las funciones actuales queda aprobada para preparar una actualización candidata. Todavía no equivale a una aceptación final de uso real ni a una publicación: faltan revisión autenticada de las interfaces, generación/instalación de la APK nueva y comprobación posterior al despliegue.

El usuario confirmó que solicitará módulos nuevos o ampliaciones tipo Odoo cuando los necesite. No se agregan funciones nuevas para cerrar esta entrega. PDF y Excel son informes opcionales, no pasos obligatorios del trabajo. La problemática del documento está excluida.

## Alcance revisado

| Área | Funciones implementadas | Límite de esta entrega |
|---|---|---|
| Acceso y administración | Inicio de sesión, perfil, verificación de correo, usuarios, roles, permisos, departamentos y auditoría | Los cambios de empresa/sucursal no permiten cambiar libremente la sucursal de sesión |
| Empresa y sucursales | Consulta y edición de empresa, alta/edición y consulta paginada de sucursales | No incluye altas/bajas de empresa ni administración de estados de sucursales |
| Catálogos | Clientes, proveedores, productos, categorías, almacenes; altas, ediciones, búsquedas y páginas | La demostración de 2,000 productos está separada de la empresa del usuario |
| Inventario | Entradas, salidas, transferencias, existencias e historial | Cantidades a seis decimales; sin valoración contable automática |
| Ventas, compras y finanzas | Operaciones comerciales, estados, conciliación comercial con stock/caja, cuentas y movimientos | Los registros internos no ejecutan transferencias bancarias |
| Producción | Órdenes, receta de hasta 20 insumos, entregas parciales, consumo acumulado, costos manuales y auditoría atómica | Hasta 50 entregas; costos opcionales informados, sin asientos ni valoración de inventario |
| Proyectos, CRM y logística | Proyectos y avance, oportunidades y etapas, seguimiento de envíos | No conecta transportistas externos ni convierte oportunidades automáticamente en ventas |
| Empleados | Consulta, alta, edición, estado y asignación de departamento | No incorpora un motor de cálculo de nómina |
| Mantenimiento, calidad y activos | Órdenes, inspecciones y resultados, registro/estados de activos | Sin depreciación, repuestos automáticos ni certificación externa |
| Soporte, riesgos y cumplimiento | Tickets y cierre, planes de mitigación, obligaciones y evidencia escrita | Sin adjuntos, SLA automático ni dictámenes regulatorios |
| Facturación | Borradores administrativos desde ventas, consulta, cancelación e informes | No emite comprobantes fiscales; el alcance fiscal sigue sin confirmación del usuario |
| Avisos e informes | Bandeja interna, indicadores y reportes por periodo, informes PDF/Excel opcionales | Email/push operativos, integraciones externas e IA quedan como ampliaciones futuras; la verificación de correo es un flujo independiente |

Esta tabla enumera funciones presentes, no certifica que todos los módulos sean equivalentes a Odoo ni convierte rutas de API en funciones terminadas.

## Hallazgos corregidos

La comprobación completa de tipos incluye también las pruebas. Se corrigió una consulta sobre la unión de modelos de venta/compra usando funciones concretas para consultar el estado, y se tipó el resultado de las operaciones de producción. Las pruebas ya se ejecutaban, pero esos errores impedían aprobar el comando completo de tipos. No se cambió el comportamiento de las operaciones por estas correcciones.

También se reorganiza el estado vigente de cierre para evitar que notas históricas de funciones faltantes se interpreten como pendientes actuales: producción parcial y consumo de insumos sí están implementados en la versión local.

## Evidencia técnica

- Tipos de backend, web y móvil: aprobados.
- Configuración Android: 17 pruebas aprobadas.
- Dependencias: React web 18.3.1/react-dom compatible; móvil React 19.0.0/React Native 0.79.6 compatible.
- Pruebas de clientes: 265 aprobadas.
- API general: 355 pruebas aprobadas; integración en MongoDB aislado: 69 aprobadas. Total con clientes y configuración Android: 706 pruebas aprobadas.
- Compilaciones de API/web verificadas en la copia temporal fuera de OneDrive. La advertencia de tamaño de bundle web se conserva; no impide la compilación.
- No se modificaron registros de la empresa en Render para esta revisión.

## Publicado e instalado actualmente

La API y la web publicaron el commit 5c8a276 con release `2026.10.06.2`. La APK 1.0.2 se compiló, verificó e instaló en el emulador con conexión a la API. El registro de entrega está en `output/revision-publicacion-1.0.2-20261006.md`.

Después se publicó el commit 37ba85d: retiro de los accesos de demostración, espera acotada de login web y selección de etiqueta de empresa según sesión. La web publicada ya confirma estos cambios. PDF/Excel son informes opcionales. La siguiente APK, 1.0.3, incorpora el retiro de demostración.

ADB únicamente detectó el emulador; no se confirmó un teléfono físico conectado. Falta revisar los módulos visualmente con una sesión autenticada.

## Pendientes para aceptar y entregar esta versión

1. Revisar interfaces autenticadas con roles de consulta y gestión: navegación, guardar/cancelar, sesión expirada, búsquedas y páginas.
2. Revisar los flujos críticos en interfaz: venta/cobro, compra/pago, transferencias, producción parcial, administración de acceso y auditoría. La reversión, concurrencia y aislamiento están cubiertos automáticamente; falta evidencia visual de uso real.
3. Generar la APK nueva, verificar versión, firma y conexión a la API; instalar y probar en teléfono. Verificar guardado/compartir de informes opcionales cuando se utilicen.
4. Publicación API/web en Render verificada; comprobar las interfaces con una sesión real.
5. Entregar la APK identificando su versión real y completar la aceptación en teléfono físico.

La emisión fiscal, nuevos conectores y otros módulos no se ejecutan sin una solicitud concreta y su configuración. Si se necesita emisión fiscal para esta entrega, debe definirse ese alcance antes de darla por aceptada; los borradores actuales siguen identificados como administrativos.
