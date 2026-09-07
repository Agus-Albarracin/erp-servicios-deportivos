# API del turnero de polideportivos

Backend NestJS según `.agents/AGENTS.md`. CRUD de deportes, zonas, sedes, deportes
por sede, turnos y borradores. Genera una vista previa y un enlace de WhatsApp;
no envía mensajes, no bloquea el turno y no confirma reservas.

## Base de datos y Hostinger

Se usa **MariaDB/MySQL mediante mysql2**. Hostinger Web/Cloud ofrece MariaDB y lo
administra como MySQL en hPanel. No requiere PlanetScale ni otro proveedor.
Esquema compatible con MariaDB 10.11+ y MySQL 8.0+, InnoDB, `utf8mb4_unicode_ci`,
PK internas autoincrementales y UUID públicos únicos. Consultas parametrizadas,
claves foráneas, índices de disponibilidad y pool de cinco conexiones.

- [Motor de Hostinger](https://www.hostinger.com/support/1583226-which-database-management-system-is-used-at-hostinger/)
- [Conexión de Node.js a MySQL en Hostinger](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Acceso remoto por IP](https://www.hostinger.com/support/1583546-how-to-set-up-remote-mysql-access-in-hostinger/)

La skill `mysql` de `planetscale/database-skills`, encontrada en
[skills.sh](https://www.skills.sh/planetscale/database-skills), está vendorizada en
`.agents/skills/mysql`, junto con sus referencias, licencia y procedencia.
Se aplicaron también las reglas de `.agents/skills/nestjs-best-practices`.

## Ejecutar

Usar Node.js 22.22.3+ (o 24.15+) para cumplir los requisitos de las herramientas NestJS 12.

```powershell
npm ci
Copy-Item .env.example .env
# Completar DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME y MANAGEMENT_API_KEY.
npm run db:migrate
npm run start:dev
```

API: `http://localhost:4000/api`. `PORT` permite cambiar el puerto cuando el hosting
lo requiera. `.env` se carga al iniciar; las variables del entorno tienen prioridad.
Los datos de conexión se completan localmente o en hPanel; no pegarlos en el chat
ni subir `.env` a Git. Para conexiones desde tu PC, autorizar tu IP en Remote MySQL.
Usar TLS verificado (`DB_SSL=true`, `DB_SSL_CA` opcional) si está disponible, o túnel SSH.

Producción: `npm run build` y `npm run start:prod`. Configurar los orígenes HTTPS
reales en `CORS_ORIGINS`. El plan de Hostinger debe admitir aplicaciones Node.js;
tener una base MySQL no garantiza por sí solo que se pueda ejecutar NestJS.

## Seguridad

- Helmet y CSP antes de registrar las rutas; sin `X-Powered-By`.
- CORS con lista exacta; por defecto solo `http://localhost:3000`, sin credenciales.
- DTOs con `ValidationPipe`: rechazan campos extra, tipos incorrectos y nulos.
- Texto plano: rechaza HTML y caracteres de control. El cliente debe renderizar
  textos como texto, sin `innerHTML`/`dangerouslySetInnerHTML`.
- Teléfonos internacionales con `+` y 8–15 dígitos; ejemplo argentino `+5491123456789`.
- JSON hasta 16 KiB y 100 solicitudes/minuto/IP (contador local por proceso).
- Escrituras de catálogos y listado de borradores requieren `X-API-Key` con
  `MANAGEMENT_API_KEY`. Si falta la configuración, quedan bloqueadas.
  Esta clave es de gestión y **no debe incluirse en el bundle del frontend**.
- Los borradores públicos usan su UUID aleatorio como enlace secreto de acceso,
  sin cuentas ni login. Guardarlo localmente, no compartirlo ni registrarlo en logs.
  Quien lo conoce puede leer, modificar y eliminar ese borrador. Respuestas `no-store`.
  El listado de gestión incluye estos identificadores y datos personales.
- No se confía automáticamente en `X-Forwarded-For`; configurar proxies confiables
  explícitamente antes de desplegar detrás de uno. Con múltiples procesos, el límite
  de solicitudes requiere un almacén compartido para ser global.

## Endpoints

Todos comienzan con `/api`. UUID v4 en parámetros e identificadores de relaciones.
`POST` crea, `PATCH /:id` modifica parcialmente y `DELETE /:id` devuelve 204.

| Recurso | Lectura | Escrituras |
| --- | --- | --- |
| `sports` | GET activos, GET /:id | POST, PATCH /:id, DELETE /:id, con clave |
| `zones` | GET, GET /:id | POST, PATCH /:id, DELETE /:id, con clave |
| `venues` | GET ?zoneId=UUID&sportId=UUID; GET /:id incluye mapUrl | POST, PATCH /:id, DELETE /:id, con clave |
| `venue-sports` | GET, GET /:id, con clave | POST, PATCH /:id, DELETE /:id, con clave |
| `slots` | GET ?venueId=UUID&sportId=UUID&date=YYYY-MM-DD; GET /:id | POST, PATCH /:id, DELETE /:id, con clave |
| `booking-drafts` | GET /:id; GET listado solo con clave | POST, PATCH /:id, DELETE /:id públicos por enlace secreto |
| `booking-drafts/:id/whatsapp` | POST devuelve resumen, mensaje y URL codificada | No confirma ni consume disponibilidad |

Estados de error: 400 datos/selección inválidos; 401 clave ausente/incorrecta;
403 origen CORS no permitido; 404 registro inexistente; 409 referencia o duplicado;
413 body demasiado grande; 429 límite de solicitudes; 503 error de acceso a datos.

## Cargar catálogos

Los catálogos empiezan vacíos. Cargar por API en este orden, usando `X-API-Key`:

1. `POST /sports`: `{ "name": "Fútbol", "icon": "⚽", "isActive": true }`.
2. `POST /zones`: `{ "name": "CABA" }`. Valores: CABA, SUR, NORTE, NOROESTE, OESTE.
3. `POST /venues`: `name`, `zoneId`, `address`, `latitude` y `longitude` numéricos,
   `description`, `whatsappNumber` internacional, `isActive`.
4. `POST /venue-sports`: `venueId`, `sportId`, `isActive`.
5. `POST /slots`: `venueId`, `sportId`, `startsAt`, `endsAt`, `status`.
   Fechas ISO con zona explícita, por ejemplo `2099-01-01T18:00:00-03:00`.
   Estados: AVAILABLE o UNAVAILABLE. El fin debe ser posterior al inicio.

Los ejemplos son ilustrativos; no son datos reales precargados. No se inventan
precios, duraciones ni restricciones de solapamiento: una sede puede tener varias
canchas. Esas políticas siguen pendientes de definición.

## Flujo de borrador

1. Crear con `POST /booking-drafts` y `{ "sportId": "UUID" }`; guardar el `id`.
2. `PATCH /booking-drafts/:id` con `renterFirstName`, `renterLastName`, `renterPhone`.
3. Consultar sedes con zona y deporte; guardar `zoneId` y luego `venueId` en el borrador.
4. Mostrar la ficha de sede, dirección y `mapUrl`.
5. Consultar disponibilidad por fecha y guardar `date` y `slotId`.
6. `POST /booking-drafts/:id/whatsapp` revalida toda la selección y devuelve
   `status: PENDING_CONFIRMATION`, `summary`, `message`, `url` y el aviso de confirmación pendiente.

Se pueden enviar varios pasos válidos en una misma escritura. El frontend guía
el orden de las pantallas. El backend exige zona antes de sede y sede/fecha antes
de turno. Cambiar deporte/zona limpia la sede si deja de ser compatible; cambiar
deporte/zona/sede/fecha limpia el turno anterior salvo que se envíe uno nuevo válido.
El contacto permanece guardado. Las fechas de consulta y mensajes usan Buenos Aires;
los instantes se almacenan como DATETIME UTC. Turnos pasados o bloqueados no aparecen
como disponibles ni pueden usarse para generar WhatsApp.

El número de destino es el de la sede. El navegador abre la URL únicamente tras la
acción de la persona. Generarla no significa que haya abierto WhatsApp o enviado el mensaje.

## Migraciones y consistencia

`npm run db:migrate` aplica archivos SQL versionados de `migrations/`, con checksum
y bloqueo para evitar dos migradores simultáneos. No migra automáticamente al iniciar
la aplicación. No modifica archivos ya aplicados: agregar una nueva migración.
La DDL de MariaDB hace auto-commit; la migración inicial es reanudable tras una falla.

Para este MVP se serializan las escrituras mediante una fila de bloqueo dentro de
una transacción. Así las validaciones y el guardado ven datos coherentes entre
instancias. Las lecturas siguen concurrentes. Antes de escalar el volumen de
escritura, reemplazar este bloqueo por bloqueos específicos y control de versiones.

No se permiten eliminaciones con dependencias; desactivar los catálogos o bloquear
turnos cuando corresponda. No se hace borrado en cascada de solicitudes.
Antes de migrar una base con datos, hacer backup. La migración inicial es aditiva:
para rollback de aplicación, volver al código anterior sin borrar tablas; una
reversión de datos debe planificarse usando backup y autorización de gestión.
Después del despliegue, verificar `schema_migrations`, lectura de catálogos y un
flujo de solicitud con datos controlados.

## Validación

```powershell
npm run build
npm test
npm run test:e2e
npm run lint
```

Las pruebas HTTP usan el JavaScript compilado (incluida la metadata real de DTOs)
y un repositorio en memoria exclusivo de pruebas. Para ejecutar la misma suite con
MariaDB temporal, usar un contenedor local con base `turnero_test`, host `127.0.0.1`,
puerto `43306`; configurar DB_*, aplicar migraciones y establecer `E2E_MYSQL=true`.
Este modo limpia únicamente esa base local de pruebas y agrega comprobaciones
de persistencia tras reinicio y rollback. No apuntarlo a datos reales.
