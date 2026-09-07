import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API del turnero de polideportivos')
    .setVersion('1.0.0')
    .setDescription(
      'Flujo: deporte → contacto → zona y sede → detalle → fecha y turno → vista previa de WhatsApp. Los catálogos empiezan vacíos. Cargarlos con clave de gestión en el orden deportes, zonas, sedes, relaciones sede/deporte y turnos. Los UUID de los ejemplos son ficticios. Generar WhatsApp no envía mensajes, no bloquea disponibilidad y no confirma reservas. Los borradores se acceden mediante UUID secreto, sin login. JSON de hasta 16 KiB; 100 solicitudes/minuto/IP.',
    )
    .addTag('General', 'Respuesta inicial del servicio.')
    .addTag('Deportes', 'Catálogo de deportes.')
    .addTag('Zonas', 'Zonas geográficas.')
    .addTag('Sedes', 'Sedes, compatibilidad y ubicación.')
    .addTag(
      'Deportes por sede',
      'Relaciones administradas con clave de gestión.',
    )
    .addTag(
      'Turnos',
      'Disponibilidad por fecha de Buenos Aires; instantes en UTC.',
    )
    .addTag(
      'Borradores',
      'Solicitudes pendientes, accesibles mediante UUID secreto.',
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description:
          'Clave de gestión solo para operaciones protegidas. No se almacena en la documentación.',
      },
      'ManagementKey',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    autoTagControllers: false,
  });
  // DTO validation rejects unknown keys; expose that restriction in the request schemas.
  for (const [name, schema] of Object.entries(
    document.components?.schemas ?? {},
  )) {
    if (
      (name.startsWith('Create') || name.startsWith('Update')) &&
      !('$ref' in schema)
    )
      schema.additionalProperties = false;
  }
  return document;
}

export function configureSwagger(app: INestApplication) {
  const setting = process.env.SWAGGER_ENABLED;
  if (setting !== undefined && !['true', 'false'].includes(setting))
    throw new Error('SWAGGER_ENABLED debe ser true o false');
  if (
    setting === 'false' ||
    (setting === undefined && process.env.NODE_ENV === 'production')
  )
    return;
  SwaggerModule.setup('api/docs', app, () => createApiDocument(app), {
    jsonDocumentUrl: 'api/openapi.json',
    raw: ['json'],
    customSiteTitle: 'Documentación del turnero',
    swaggerOptions: {
      persistAuthorization: false,
      validatorUrl: null,
      docExpansion: 'none',
      displayRequestDuration: true,
    },
  });
}
