# Backend del turnero

Leer primero [el contexto raíz](../AGENTS.md), [el contrato de integración](../docs/integracion.md) y [README.md](README.md). Este archivo agrega instrucciones propias de `server/`.

## Responsabilidades y fuentes

- NestJS 12; API con prefijo `/api`, puerto por defecto 4000.
- `src/catalog/`: deportes, zonas, sedes y relaciones sede/deporte.
- `src/slots/`: disponibilidad y validación de turnos.
- `src/bookings/`: solicitudes, invalidación de selecciones, WhatsApp y confirmación administrativa atómica.
- `src/scheduling/`: reglas recurrentes, cierres y disponibilidad.
- `src/management/`: listados completos protegidos para el backoffice.
- `src/storage/models.ts`: entidades públicas. DTOs de cada módulo: entradas y validaciones HTTP.
- `src/storage/`: repositorios MySQL/MariaDB; `migrations/`: SQL versionado.
- `src/configure-app.ts`: CORS, límites y validación global.

## Reglas de integración

Mantener la lógica de negocio en el backend. No relajar DTOs ni exponer endpoints de gestión para facilitar una pantalla. Si hace falta cambiar un contrato, actualizar servicio, DTO, pruebas pertinentes y `../docs/integracion.md` junto con el consumidor.

Preservar UUID públicos, respuestas sin envoltorio `data`, invalidación de sede/turno y cabeceras `no-store` de borradores. Generar WhatsApp no envía mensajes, bloquea turnos ni confirma reservas.

Nunca exponer `MANAGEMENT_API_KEY` ni credenciales DB al frontend. Los catálogos se mantienen por los endpoints protegidos; el panel administrativo está implementado en `../backoffice/` y usa un proxy autenticado.

No modificar migraciones ya aplicadas: agregar otra. No ejecutar migraciones o pruebas destructivas contra datos reales como parte de una conexión de interfaz.

## Skill de documentación de API

Para tareas de Swagger/OpenAPI o cambios en la documentación de endpoints, usar
[code-documenter](.agents/skills/code-documenter/SKILL.md) junto con su
[contexto del turnero](.agents/skills/code-documenter/PROJECT.md). Leer primero
la [guía NestJS/Swagger](.agents/skills/code-documenter/references/api-docs-nestjs-express.md).
La skill está vendorizada con licencia MIT y commit fijado en
[UPSTREAM.md](.agents/skills/code-documenter/UPSTREAM.md). Swagger está implementado y su especificación versionada se comprueba con `npm run docs:check`.

## Ejecución y comprobaciones

Desde `server/`: `npm run start:dev`, `npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`. Consultar README para preparar la base y las variables de entorno. La suite HTTP habitual usa repositorio en memoria; no demuestra conectividad con una base real. El modo MySQL de pruebas requiere una base temporal y aislada.

## CRÍTICO: proponer ítems antes de implementar

Preferencia explícita del usuario: antes de modificar código o documentación de
una tarea, presentar ítems listos para GitHub Projects con objetivo, repositorios,
criterios de aceptación, dependencias, rama y avances previstos. Una funcionalidad
puede tener varios commits. Reutilizar ítems existentes; si el trabajo ya se hizo,
identificar la propuesta como retrospectiva.

Aplicar `atomic-commits` y `git-workflow-and-versioning`, especialmente su referencia
`references/project-items.md`. Las skills están instaladas en
`C:/Users/Agust/.codex/skills/`; server y client también tienen una copia local de
`atomic-commits` en `.agents/skills/`. La propuesta no requiere una confirmación
adicional para continuar con trabajo autorizado. Publicar o modificar ítems en
GitHub requiere autorización vigente y un destino identificado.

Crear cada rama independiente desde `main` actualizada antes de editar; usar el mismo nombre en
los repositorios afectados y declarar la base real. Al terminar, relacionar los
ítems con los commits, las validaciones y los pendientes.
