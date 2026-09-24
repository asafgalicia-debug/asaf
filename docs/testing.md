# Pruebas y validaciÃ³n

## Comandos

Desde `backend`, por separado:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Vitest ejecuta los tests unitarios/modelados y las pruebas HTTP de `tests/health.test.ts`, que inician la app en un puerto efÃ­mero y revisan salud, rutas, autenticaciÃ³n, errores y cabeceras.

## Ãšltima evidencia comunicada

- Fase 24: `typecheck` correcto; 67 archivos y 110 pruebas aprobadas.
- Fase 25: tras corregir el tipo `INVALID_JSON`, 67 archivos y 112 pruebas aprobadas.
- Fase 26: `typecheck` correcto. La suite completa no se volviÃ³ a ejecutar despuÃ©s de los ajustes de Ã­ndices y pool.

Por tanto, la evidencia de 112 pruebas corresponde al estado previo a Fase 26; vuelve a ejecutar `npm.cmd test` para certificar el Ã¡rbol actual.

## Alcance

La mayorÃ­a de pruebas de mÃ³dulos usa mocks de modelos Mongo. Las pruebas HTTP actuales no son pruebas E2E del navegador ni comprueban una conexiÃ³n real a Atlas. Para una validaciÃ³n completa faltan escenarios E2E de web/mÃ³vil, pruebas de carga y pruebas de integraciÃ³n controladas contra base de datos temporal.
