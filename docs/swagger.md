# Swagger / OpenAPI del turnero

Con el backend iniciado en su puerto predeterminado:

- Interfaz: http://localhost:4000/api/docs
- Especificación JSON: http://localhost:4000/api/openapi.json
- Copia versionada: [openapi.json](openapi.json).

Iniciar desde `server/` con `npm run start:dev` o `npm run start`. La aplicación
necesita la base configurada y sus migraciones aplicadas, igual que antes. Si ya
estaba corriendo sin modo watch, reiniciarla para cargar Swagger. El puerto depende
de `PORT`. La exportación offline que se describe abajo no necesita base de datos.

## Uso

1. Abrir el grupo del recurso y elegir un endpoint.
2. Revisar descripción, parámetros, request body y respuestas.
3. Para operaciones protegidas, pulsar **Authorize** e ingresar la clave de
   `MANAGEMENT_API_KEY` en el esquema `ManagementKey`. Se envía como `X-API-Key`.
   La UI no conserva la autorización al recargar y no contiene claves precargadas.
4. Pulsar **Try it out**, completar datos y luego **Execute**.

Las operaciones se ejecutan contra la base configurada en el backend. Los UUIDs
de ejemplo son ficticios: reemplazarlos por los devueltos al crear registros.
La secuencia de carga es deportes, zonas, sedes, relaciones sede/deporte y turnos.
El listado de borradores y todas las operaciones de `venue-sports` requieren clave.
Las lecturas públicas de catálogos y las operaciones individuales de borradores
no usan esa clave, excepto `POST /booking-drafts/:id/confirm`, que es administrativo. El UUID del borrador es un secreto de acceso; no compartirlo.

## Cobertura

| Recurso | Operaciones documentadas |
| --- | ---: |
| General (`GET /api`) | 1 |
| Deportes | 5 |
| Zonas | 5 |
| Sedes | 5 |
| Deportes por sede | 5 |
| Turnos | 5 |
| Borradores, WhatsApp y confirmación administrativa | 7 |
| Administración | 9 / 9 |
| Calendario y disponibilidad recurrente | 9 |
| **Total** | **51 / 51** |

Se documentan los 6 DTOs de creación, sus 6 variantes PATCH, los DTOs de filtros,
los modelos de respuesta, enums, errores y seguridad. Las pruebas comparan las
rutas y guards reales con OpenAPI; también verifican que el archivo exportado
coincida con el generado. Swagger UI y sus archivos internos no son operaciones
del dominio y no aparecen en este conteo.

El contrato conserva respuestas directas sin envoltorio `data`. Los PATCH no
aceptan `null` ni claves desconocidas. Las propiedades ausentes en una respuesta
de borrador pueden haberse invalidado: reemplazar el estado local con la respuesta.
El endpoint de WhatsApp devuelve `PENDING_CONFIRMATION`; no envía el mensaje,
no ocupa el turno y no confirma una reserva. La confirmación protegida devuelve
`CONFIRMED` y `confirmedAt`; el horario se muestra como `RESERVED`. El endpoint
público `/scheduling/day` no expone datos de solicitantes.

## Configuración y seguridad

- `SWAGGER_ENABLED=true`: habilita UI y JSON explícitamente.
- `SWAGGER_ENABLED=false`: deshabilita ambos.
- Sin variable: se habilitan salvo cuando `NODE_ENV=production`.
- Swagger usa archivos locales, sin un validador remoto ni claves incorporadas.
- Helmet permanece activo; no se habilitan scripts inline ni se elimina CSP.
- CORS acepta solicitudes del mismo origen de la API, necesarias para Swagger,
  y mantiene `CORS_ORIGINS` para orígenes externos como el frontend. Los guards
  siguen controlando cada operación; habilitar Swagger no otorga permisos de gestión.
- Las opciones de despliegue detrás de un proxy siguen dependiendo de la
  configuración real de protocolo, host y proxies confiables.

## Generar y comprobar

```powershell
npm run docs:generate
npm run docs:check
npm run lint
npm test
npm run test:e2e
```

`docs:generate` compila, genera `docs/openapi.json` y valida OpenAPI con
`@apidevtools/swagger-parser`. No carga `.env`, no inicia el servidor y no llama
al ciclo de inicialización de la base de datos.

`docs:check` usa el código compilado y un repositorio en memoria. Verifica la
especificación, las 51 operaciones, los guards, los esquemas, la UI servida, CORS,
la desactivación de documentación y ejemplos ejecutables del flujo completo.
La suite habitual de HTTP también cubre las validaciones originales, incluido
el rechazo de valores nulos al cambiar a `PartialType` de `@nestjs/swagger`.

Al cambiar endpoints o DTOs: actualizar sus decoradores, ejecutar `docs:generate`,
revisar el diff de JSON y ejecutar `docs:check`. Mantener alineados README y el
contrato de integración en la raíz del workspace.

## Evidencia de esta implementación

- Documento OpenAPI validado y comparado con su copia versionada.
- Cobertura de rutas y guards: 51/51.
- Siete pruebas específicas de Swagger aprobadas.
- Verificación en Chromium headless: UI renderizada, **Try it out** sobre
  `GET /api/sports` devuelve 200; un POST del mismo origen sin clave llega al guard
  y devuelve 401; sin errores de scripts o CSP. Se utilizó un backend aislado en
  memoria, sin consultar ni modificar la base real.

Fuentes: [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction),
[tipos y parámetros](https://docs.nestjs.com/openapi/types-and-parameters),
[seguridad](https://docs.nestjs.com/openapi/security), y la skill local
[`code-documenter`](../.agents/skills/code-documenter/SKILL.md).
