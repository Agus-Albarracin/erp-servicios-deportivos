# PLAN-PAY-01 · Pagos externos de solicitudes

Estado: integrado localmente en las carpetas originales `server/` y `backoffice/`, junto con sesiones persistentes. Bases de integración: server `657bd4f`, backoffice `50e484d`. Migración 005 aplicada en la base local; publicación y despliegue pendientes.

## Objetivo y decisión de producto

El administrador registra pagos recibidos fuera de la plataforma. La etiqueta anterior «Confirmada» pasa a «Pagó reserva» y una acción posterior permite registrar «Pagó total». Las confirmaciones preexistentes se presentan como pago de reserva por la equivalencia solicitada; no se infiere pago total ni se verifica información bancaria histórica.

## Contrato

- `POST /api/booking-drafts/:id/confirm`: conserva autorización, validaciones, idempotencia y ocupación del turno. Representa registrar el pago de reserva. Mantiene `status: CONFIRMED` y `confirmedAt`.
- `POST /api/booking-drafts/:id/total-payment`: protegido por `X-API-Key`, sin body requerido. Requiere una reserva confirmada y devuelve 200. Acepta turnos pasados y no revalida disponibilidad o actividad de la sede.
- Ambos devuelven `paymentStatus`: `PENDING`, `RESERVATION_PAID` o `TOTAL_PAID`. El segundo estado solo existe si hay confirmación; el tercero requiere registro de pago total.
- `totalPaidAt` aparece únicamente tras registrar el total. Es el instante UTC del primer registro administrativo, no la fecha del pago bancario.
- Repetir `/total-payment` conserva esa fecha; repetir `/confirm` no revierte el pago total.
- Los listados y la lectura individual incluyen los campos adicionales. La disponibilidad pública conserva AVAILABLE/RESERVED, sin estados financieros ni contacto.
- Errores: 401 sin clave válida, 400 UUID inválido, 404 solicitud inexistente, 409 solicitud aún no confirmada y 503 si falla persistencia; siguen los límites y CORS existentes.

El PATCH público no acepta campos de pago. La nueva acción no habilita editar o eliminar datos de una reserva confirmada. No incluye importes, comprobantes, devolución, reversión de estado, conciliación ni pasarela de cobro.

## Por qué así

Conservar `CONFIRMED` evita cambiar la lógica de ocupación y el contrato del cliente público. Separar pago y disponibilidad permite registrar el total después del partido sin exigir un horario futuro libre. La tabla `reservationPayments` referencia una confirmación existente y admite un registro por reserva; el bloqueo transaccional actual serializa lectura y escritura para que los reintentos sean idempotentes.

La migración es aditiva y reanudable mediante `CREATE TABLE IF NOT EXISTS`. No cambia filas históricas ni modifica migraciones aplicadas. Se usa el número 005 porque 004 está reservado para sesiones persistentes en otra rama; esta funcionalidad no depende de esas sesiones ni altera sus archivos.

## Despliegue

1. Hacer backup y aplicar `005_reservation_payments.sql` mediante `npm run db:migrate` en el entorno objetivo.
2. Desplegar la API nueva y comprobar lectura de solicitudes y registro protegido con datos controlados.
3. Desplegar backoffice. En Solicitudes, usar «Registrar pago de reserva» y luego «Registrar pago total», confirmando que se recibió el dinero externamente.

Aplicar la migración antes del backend: los listados nuevos consultan la tabla adicional. Revertir código no debe borrar registros de pago. Mantener la tabla al volver a una versión anterior; esa versión simplemente no muestra el pago total.

## Aceptación y validación

- [x] Etiquetas, acciones y filtros de pago en backoffice.
- [x] Persistencia, autorización y conservación de disponibilidad en la API.
- [x] Reintentos idempotentes y pago total para turnos pasados.
- [x] OpenAPI generado, validado y cubierto por pruebas de contratos.
- [ ] Verificación y migración en el entorno de despliegue.

La suite HTTP usa repositorio en memoria; no demuestra ejecución de la migración sobre MySQL. Los tests de navegador usan una API fixture y cubren recuperación de error, cancelación de confirmación, persistencia al recargar y filtros.

Verificación del 2026-09-10: backend compilado, lint aprobado, una prueba unitaria
y 26 pruebas HTTP aprobadas (una prueba de MySQL omitida). OpenAPI válido con
49 operaciones en esta base de rama, incluidas las siete pruebas de Swagger.
Backoffice: lint, TypeScript y build de producción aprobados; los 13 casos de
Playwright quedaron aprobados entre la suite y la repetición del último caso
corregido. Se usó Webpack y espera de 15 segundos en una configuración local
temporal porque Turbopack rechaza la junction de dependencias del worktree.
La configuración versionada del proyecto no cambió por esa adaptación.

PLAN-PAY-01 integrado localmente en `main` de ambos repositorios. Se conservan los commits originales de pagos y sesiones. La migración 005 está aplicada en la base local; quedan pendientes el push manual y el despliegue remoto.

Integración local: se mantienen las migraciones 004 de sesiones y 005 de pagos. La API combinada documenta 52 operaciones. Los worktrees auxiliares se retiran conservando los commits y ramas originales.

Validación de la integración: 28 pruebas HTTP aprobadas (una de MySQL omitida) y flujo de pago total con error, reintento y recarga aprobado desde backoffice/.
