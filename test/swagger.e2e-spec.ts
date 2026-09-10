import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import type {
  OpenAPIObject,
  OperationObject,
  SchemaObject,
} from '@nestjs/swagger';
import SwaggerParser from '@apidevtools/swagger-parser';
import request from 'supertest';
import { readFile } from 'node:fs/promises';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import {
  configureSwagger,
  createApiDocument,
} from '../dist/documentation/swagger.js';
import { AppController } from '../dist/app.controller.js';
import { CatalogController } from '../dist/catalog/catalog.controller.js';
import { SlotsController } from '../dist/slots/slots.controller.js';
import { BookingsController } from '../dist/bookings/bookings.controller.js';
import { SchedulingController } from '../dist/scheduling/scheduling.controller.js';
import { ManagementController } from '../dist/management/management.controller.js';
import { ManagementGuard } from '../dist/security/management.guard.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';

describe('Swagger and OpenAPI contract', () => {
  let app: NestExpressApplication;
  let document: OpenAPIObject;
  const key = 'swagger-test-key-not-a-real-secret';
  const api = () => request(app.getHttpServer());
  const schema = (name: string): SchemaObject => {
    const value = document.components?.schemas?.[name];
    if (!value || '$ref' in value) throw new Error(`Missing schema: ${name}`);
    return value;
  };
  async function buildApp() {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TurneroRepository)
      .useClass(MemoryRepository)
      .compile();
    const instance = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(instance);
    configureSwagger(instance);
    await instance.init();
    return instance;
  }
  beforeAll(async () => {
    vi.stubEnv('SWAGGER_ENABLED', 'true');
    vi.stubEnv('MANAGEMENT_API_KEY', key);
    vi.stubEnv('CORS_ORIGINS', 'http://localhost:3000');
    app = await buildApp();
    document = createApiDocument(app);
  });
  afterAll(async () => {
    await app?.close();
    vi.unstubAllEnvs();
  });

  it('validates the specification and keeps the exported artifact current', async () => {
    await SwaggerParser.validate(structuredClone(document));
    const exported = JSON.parse(
      await readFile(new URL('../docs/openapi.json', import.meta.url), 'utf8'),
    );
    expect(exported).toEqual(document);
    expect(JSON.stringify(document)).not.toContain(key);
  });

  it('documents all 49 routes and matches actual management guards', () => {
    let count = 0;
    for (const controller of [
      AppController,
      CatalogController,
      SlotsController,
      BookingsController,
      ManagementController,
      SchedulingController,
    ]) {
      for (const name of Object.getOwnPropertyNames(controller.prototype)) {
        if (name === 'constructor') continue;
        const handler = controller.prototype[name];
        const method = Reflect.getMetadata(METHOD_METADATA, handler);
        if (method === undefined) continue;
        const parts = [
          'api',
          Reflect.getMetadata(PATH_METADATA, controller),
          Reflect.getMetadata(PATH_METADATA, handler),
        ];
        const path =
          '/' +
          parts
            .join('/')
            .split('/')
            .filter(Boolean)
            .join('/')
            .replace(/:([\w]+)/g, '{$1}');
        const verb = RequestMethod[method].toLowerCase();
        const operation = document.paths[path]?.[verb] as
          OperationObject | undefined;
        expect(operation, `${verb} ${path}`).toBeDefined();
        expect(operation!.summary).toBeTruthy();
        expect(operation!.tags?.length).toBe(1);
        expect(operation!.responses).toBeDefined();
        const guards = [...(Reflect.getMetadata(GUARDS_METADATA, controller) ?? []), ...(Reflect.getMetadata(GUARDS_METADATA, handler) ?? [])];
        expect(operation!.security ?? []).toEqual(
          guards.includes(ManagementGuard) ? [{ ManagementKey: [] }] : [],
        );
        count++;
      }
    }
    const actual = Object.values(document.paths).reduce(
      (total, path) =>
        total +
        Object.keys(path!).filter((method) =>
          ['get', 'post', 'patch', 'delete'].includes(method),
        ).length,
      0,
    );
    expect(count).toBe(49);
    expect(actual).toBe(count);
  });

  it('describes optional PATCH fields, query filters, response bodies and API keys', () => {
    expect(schema('CreateBookingDto').required).toEqual(['sportId']);
    for (const entity of [
      'Sport',
      'Zone',
      'Venue',
      'VenueSport',
      'Slot',
      'Booking',
    ]) {
      expect(schema(`Update${entity}Dto`).required ?? []).toEqual([]);
      expect(schema(`Update${entity}Dto`).additionalProperties).toBe(false);
      for (const property of Object.values(
        schema(`Update${entity}Dto`).properties ?? {},
      )) {
        expect(property).not.toHaveProperty('nullable', true);
      }
    }
    expect(schema('CreateBookingDto').properties?.renterPhone).toMatchObject({
      pattern: '^\\+[1-9]\\d{7,14}$',
    });
    expect(schema('BookingDraftResponseDto').required).toEqual(
      expect.arrayContaining(['sportId', 'id']),
    );
    expect(schema('BookingDraftResponseDto').properties?.paymentStatus).toMatchObject({ enum: ['PENDING', 'RESERVATION_PAID', 'TOTAL_PAID'] });
    expect(document.paths['/api/booking-drafts/{id}/total-payment']!.post!.responses).toHaveProperty('409');
    expect(schema('BookingSummaryDto').required).toHaveLength(6);
    expect(schema('WhatsAppResponseDto').properties?.status).toMatchObject({
      enum: ['PENDING_CONFIRMATION'],
    });
    expect(document.components?.securitySchemes?.ManagementKey).toMatchObject({
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
    });
    expect(document.paths['/api/slots']!.get!.parameters).toEqual(
      expect.arrayContaining(
        ['venueId', 'sportId', 'date'].map((name) =>
          expect.objectContaining({ name, in: 'query', required: true }),
        ),
      ),
    );
    expect(document.paths['/api/venues']!.get!.parameters).toHaveLength(2);
    const deleted =
      document.paths['/api/booking-drafts/{id}']!.delete!.responses['204'];
    expect(deleted).not.toHaveProperty('content');
    expect(
      document.paths['/api/booking-drafts/{id}/whatsapp']!.post!.responses,
    ).toHaveProperty('200');
    expect(
      document.paths['/api/booking-drafts/{id}/whatsapp']!.post!.responses,
    ).not.toHaveProperty('201');
  });

  it('serves local Swagger assets and JSON with Helmet still enabled', async () => {
    const ui = await api().get('/api/docs').expect(200);
    expect(ui.text).toContain('swagger-ui');
    expect(ui.headers['content-security-policy']).toContain(
      "script-src 'self'",
    );
    expect(ui.headers['x-content-type-options']).toBe('nosniff');
    await api().get('/api/docs/swagger-ui-bundle.js').expect(200);
    const init = await api().get('/api/docs/swagger-ui-init.js').expect(200);
    expect(init.text).toContain('"persistAuthorization": false');
    expect(init.text).not.toContain(key);
    const json = await api().get('/api/openapi.json').expect(200);
    expect(json.body).toEqual(document);
  });

  it('accepts same-origin Swagger requests while rejecting unlisted foreign origins', async () => {
    await api()
      .post('/api/sports')
      .set('Host', 'localhost:4000')
      .set('Origin', 'http://localhost:4000')
      .send({})
      .expect(401);
    await api()
      .get('/api/sports')
      .set('Host', 'localhost:4000')
      .set('Origin', 'https://untrusted.example')
      .expect(403);
    await api()
      .get('/api/sports')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
  });

  it('executes documented DTO examples through the complete request flow', async () => {
    const example = (name: string) =>
      Object.fromEntries(
        Object.entries(schema(name).properties ?? {}).map(
          ([field, property]) => [
            field,
            '$ref' in property ? undefined : property.example,
          ],
        ),
      );
    async function create(path: string, body: object, management = true) {
      const req = api().post(`/api/${path}`);
      if (management) req.set('X-API-Key', key);
      return (await req.send(body).expect(201)).body;
    }
    const sport = await create('sports', example('CreateSportDto'));
    const zone = await create('zones', example('CreateZoneDto'));
    const venue = await create('venues', {
      ...example('CreateVenueDto'),
      zoneId: zone.id,
    });
    await create('venue-sports', {
      ...example('CreateVenueSportDto'),
      sportId: sport.id,
      venueId: venue.id,
    });
    const slot = await create('slots', {
      ...example('CreateSlotDto'),
      sportId: sport.id,
      venueId: venue.id,
    });
    const draft = await create('booking-drafts', { sportId: sport.id }, false);
    await api()
      .patch(`/api/booking-drafts/${draft.id}`)
      .send({
        renterFirstName: 'Ana',
        renterLastName: 'Ejemplo',
        renterPhone: '+5491100000000',
        zoneId: zone.id,
        venueId: venue.id,
        date: '2099-01-01',
        slotId: slot.id,
      })
      .expect(200);
    const preview = await api()
      .post(`/api/booking-drafts/${draft.id}/whatsapp`)
      .expect(200);
    expect(preview.headers['cache-control']).toBe('no-store');
    expect(Object.keys(preview.body).sort()).toEqual(
      schema('WhatsAppResponseDto').required!.slice().sort(),
    );
    expect(preview.body.status).toBe('PENDING_CONFIRMATION');
    expect(preview.body.summary.venue).not.toHaveProperty('mapUrl');
    expect(preview.body.message).toContain('18:00–19:00');
    const detail = await api().get(`/api/venues/${venue.id}`).expect(200);
    expect(detail.body.mapUrl).toContain('https://www.google.com/maps');
    await api()
      .patch(`/api/booking-drafts/${draft.id}`)
      .send({ renterPhone: null })
      .expect(400);
  });

  it('can disable docs without disabling API routes', async () => {
    vi.stubEnv('SWAGGER_ENABLED', 'false');
    const disabled = await buildApp();
    try {
      await request(disabled.getHttpServer()).get('/api/docs').expect(404);
      await request(disabled.getHttpServer())
        .get('/api/openapi.json')
        .expect(404);
      await request(disabled.getHttpServer()).get('/api/sports').expect(200);
    } finally {
      await disabled.close();
      vi.stubEnv('SWAGGER_ENABLED', 'true');
    }
  });
});
