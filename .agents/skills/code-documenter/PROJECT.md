# Aplicación al turnero

Leer junto con `SKILL.md`, `references/api-docs-nestjs-express.md` y, cuando
corresponda, `references/interactive-api-docs.md`.

- El formato solicitado es Swagger/OpenAPI para NestJS; no hace falta volver a
  preguntar por el formato cuando la tarea ya lo establece.
- Verificar compatibilidad con la versión instalada de NestJS antes de agregar
  `@nestjs/swagger`. Consultar https://docs.nestjs.com/openapi/introduction.
- Los ejemplos de la skill son ilustrativos. Documentar los controllers, DTOs y
  respuestas reales del turnero; no copiar recursos `users`, JWT o paginación.
- La API tiene prefijo `/api` y devuelve objetos o arrays directos, sin `data`.
- Las operaciones protegidas usan `X-API-Key`; las operaciones públicas no deben
  aparecer como protegidas. No incluir claves reales en ejemplos o configuración.
- Los UUID de borradores son secretos de acceso. Usar UUID ficticios en ejemplos.
- Cubrir parámetros, campos requeridos/opcionales, UUID, fechas, enums, respuestas
  y errores. Documentar también las invalidaciones de sede/turno al modificar un borrador.
- WhatsApp devuelve una vista previa y una URL: no envía mensajes, bloquea turnos
  ni confirma reservas. Reflejar `PENDING_CONFIRMATION`.
- Mantener concordancia con `server/README.md` y `docs/integracion.md` en la raíz.
- Validar el documento generado y la interfaz servida, incluidas las cabeceras
  de seguridad existentes. Las anotaciones no sustituyen validación ni guards.

Swagger está implementado en `src/documentation/` del backend y se publica en
`/api/docs`, con JSON en `/api/openapi.json`. Consultar `docs/swagger.md` del
backend para exportación, pruebas y configuración. Mantener sus 32 operaciones
documentadas al modificar contratos.
