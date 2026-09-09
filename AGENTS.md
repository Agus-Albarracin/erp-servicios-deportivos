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

## CRÍTICO: una tarea específica por rama

Preferencia permanente y explícita del usuario para este flujo de trabajo:

- Antes de editar, proponer o reutilizar el ítem de GitHub Projects y declarar
  repositorio, objetivo verificable, rama, base exacta y motivo de esa base.
- Cada rama resuelve una sola tarea específica. Puede contener varios commits,
  pero todos deben contribuir a sus criterios de aceptación. La rama no es un
  contenedor para todo lo realizado durante una sesión.
- Usar `feat|fix|refactor|docs|chore/<resultado-concreto>`, por ejemplo
  `feat/filtros-solicitudes` o `fix/confirmacion-duplicada`. No usar nombres
  genéricos como `pendientes`, `mejoras`, `cierre-documentacion` o `backend`.
- Tarea independiente: partir de `main` actualizada, comprobando la referencia
  remota cuando haya acceso autorizado. Si no se pudo comprobar, informar la
  referencia y el hash local utilizados; no afirmar que están actualizados.
- Partir de otra rama únicamente cuando sus cambios aún no integrados sean
  necesarios para esta tarea. Explicar la dependencia concreta y registrar el
  hash de base. Estar trabajando en esa rama no justifica heredarla.
- Si aparece una nueva funcionalidad o arreglo independiente, proponer otro
  ítem y preparar otra rama antes de implementarlo. Preservar el trabajo actual;
  usar un worktree cuando cambiar de rama pueda mezclar cambios.
- Repetir un nombre entre repositorios solo si todos contribuyen a la misma
  tarea concreta. Compartir sesión, tipo de archivo o etapa de cierre no basta.
- Antes de cada commit, revisar tanto el diff preparado como los commits propios
  de la rama respecto de su base. Separar tareas ajenas; no confundir commits
  heredados de una dependencia con commits propios. No crear una rama por archivo
  o por commit cuando forman parte de un mismo resultado.
- Preparar las ramas y los commits locales autorizados y entregar un resumen
  con ítem, repositorio, rama, base, hashes, títulos exactos y validaciones.
  El push queda pendiente de confirmación explícita del usuario; reutilizarla
  si ya fue otorgada para esas ramas y ese alcance. No hacer push automático.
- Para GitHub, vincular el ítem con el PR de esa tarea cuando su publicación esté
  autorizada. En ramas dependientes, declarar la dependencia y dirigir el PR a
  la base correspondiente; una vez integrada, revisar el diff contra `main`
  antes de cambiar el destino. No marcar Done solo por crear commits locales:
  distinguir preparado, publicado, en revisión e integrado.
- Al separar trabajo anterior, conservar los originales y verificar que todos
  los cambios quedan representados. No reescribir ni eliminar ramas publicadas
  como consecuencia automática de esta regla.

## Push manual

El usuario ejecuta los pushes. Después de preparar commits, entregar siempre
los comandos PowerShell exactos en orden de dependencias, con repositorio,
rama, base, hashes, títulos y destino de PR. Distinguir ramas pendientes de
las sincronizadas y explicar si el remoto solo se comparó con referencias
locales. No ejecutar push ni pedir permiso para hacerlo mientras siga vigente
este modo manual. Ver `references/project-items.md` de las skills de Git.
