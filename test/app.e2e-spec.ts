import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
// Test tsc output: DTO metadata must match the deployed application.
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';
import { createConnection } from 'mysql2/promise';
import { databaseConfig } from '../dist/storage/database.config.js';

describe('Turnero HTTP API', () => {
  let app: NestExpressApplication;
  const key = 'test-management-key';
  const api = () => request(app.getHttpServer());
  const useMysql = process.env.E2E_MYSQL === 'true';
  async function boot() {
    const builder = Test.createTestingModule({ imports: [AppModule] });
    if (!useMysql)
      builder.overrideProvider(TurneroRepository).useClass(MemoryRepository);
    const module = await builder.compile();
    app = module.createNestApplication<NestExpressApplication>({
      bodyParser: false,
    });
    configureApp(app);
    await app.init();
  }
  beforeEach(async () => {
    process.env.MANAGEMENT_API_KEY = key;
    process.env.CORS_ORIGINS = 'http://localhost:3000';
    if (useMysql) {
      // Cleanup is restricted to the disposable local test database.
      if (
        process.env.DB_HOST !== '127.0.0.1' ||
        process.env.DB_PORT !== '43306' ||
        process.env.DB_NAME !== 'turnero_test'
      )
        throw new Error('Usar exclusivamente la MariaDB local de pruebas');
      const connection = await createConnection(databaseConfig());
      try {
        for (const table of [
          'reservationPayments', 'reservations', 'generatedSlots',
          'blockedDays',
          'availabilitySchedules',
          'calendarSettings',
          'drafts',
          'slots',
          'venueSports',
          'venues',
          'sports',
          'zones',
        ])
          await connection.query(`DELETE FROM \`${table}\``);
      } finally {
        await connection.end();
      }
    }
    await boot();
  });
  afterEach(async () => {
    await app?.close();
    delete process.env.MANAGEMENT_API_KEY;
    delete process.env.CORS_ORIGINS;
  });
  async function create(path: string, body: object) {
    return (
      await api()
        .post(`/api/${path}`)
        .set('X-API-Key', key)
        .send(body)
        .expect(201)
    ).body;
  }
  async function fixture() {
    const sport = await create('sports', {
      name: 'Fútbol',
      icon: '⚽',
      isActive: true,
    });
    const zone = await create('zones', { name: 'CABA' });
    const venue = await create('venues', {
      name: 'Sede de prueba',
      zoneId: zone.id,
      address: 'Calle 123',
      latitude: -34.6,
      longitude: -58.4,
      description: 'Cancha cubierta',
      whatsappNumber: '+5491123456789',
      isActive: true,
    });
    const relation = await create('venue-sports', {
      venueId: venue.id,
      sportId: sport.id,
      isActive: true,
    });
    const slot = await create('slots', {
      venueId: venue.id,
      sportId: sport.id,
      startsAt: '2099-01-02T01:00:00Z',
      endsAt: '2099-01-02T02:00:00Z',
      status: 'AVAILABLE',
    });
    return { sport, zone, venue, relation, slot };
  }
  it('applies Helmet, CORS, validation, management protection and body limits', async () => {
    const response = await api()
      .get('/api/sports')
      .set('Origin', 'http://localhost:3000')
      .expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-security-policy']).toContain(
      "script-src 'self'",
    );
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    await api()
      .get('/api/sports')
      .set('Origin', 'https://evil.example')
      .expect(403);
    await api().post('/api/sports').send({}).expect(401);
    await api()
      .post('/api/sports')
      .set('X-API-Key', 'wrong')
      .send({})
      .expect(401);
    for (const body of [
      { name: '<script>alert(1)</script>', icon: 'x', isActive: true },
      { name: 'Fútbol', icon: 'x', isActive: 'true' },
      { name: 'Fútbol', icon: 'x', isActive: true, admin: true },
      { name: '   ', icon: 'x', isActive: true },
    ])
      await api()
        .post('/api/sports')
        .set('X-API-Key', key)
        .send(body)
        .expect(400);
    await api().get('/api/sports/not-a-uuid').expect(400);
    await api().get(`/api/sports/${randomUUID()}`).expect(404);
    await api()
      .post('/api/booking-drafts')
      .send({ value: 'a'.repeat(17_000) })
      .expect(413);
  });
  it('supports CRUD and prevents deleting referenced data', async () => {
    const { sport, zone, venue, relation, slot } = await fixture();
    await api()
      .patch(`/api/sports/${sport.id}`)
      .set('X-API-Key', key)
      .send({ name: 'Fútbol 5' })
      .expect(200)
      .expect((r) => expect(r.body.name).toBe('Fútbol 5'));
    await api()
      .patch(`/api/sports/${sport.id}`)
      .set('X-API-Key', key)
      .send({ name: null })
      .expect(400);
    await api()
      .get(`/api/venues/${venue.id}`)
      .expect(200)
      .expect((r) => expect(r.body.mapUrl).toContain('maps/search'));
    await api()
      .delete(`/api/sports/${sport.id}`)
      .set('X-API-Key', key)
      .expect(409);
    for (const [path, id] of [
      ['slots', slot.id],
      ['venue-sports', relation.id],
      ['venues', venue.id],
      ['sports', sport.id],
      ['zones', zone.id],
    ]) {
      await api()
        .delete(`/api/${path}/${id}`)
        .set('X-API-Key', key)
        .expect(204);
      await api().get(`/api/${path}/${id}`).set('X-API-Key', key).expect(404);
    }
  });
  it('filters venues and availability by zone, sport and Argentina date', async () => {
    const { sport, zone, venue, slot, relation } = await fixture();
    await api().get('/api/venues').query({ sportId: sport.id }).expect(400);
    await api()
      .get('/api/venues')
      .query({ sportId: sport.id, zoneId: zone.id })
      .expect(200)
      .expect((r) =>
        expect(r.body.map((v: { id: string }) => v.id)).toEqual([venue.id]),
      );
    await api()
      .get('/api/slots')
      .query({ venueId: venue.id, sportId: sport.id, date: '2099-01-01' })
      .expect(200)
      .expect((r) => expect(r.body[0].id).toBe(slot.id));
    await api()
      .get('/api/slots')
      .query({ venueId: venue.id, sportId: sport.id, date: '2099-01-02' })
      .expect(200)
      .expect([]);
    await api()
      .get('/api/slots')
      .query({ venueId: venue.id, sportId: sport.id, date: '2099-02-30' })
      .expect(400);
    await api()
      .patch(`/api/venue-sports/${relation.id}`)
      .set('X-API-Key', key)
      .send({ isActive: false })
      .expect(200);
    await api()
      .get('/api/venues')
      .query({ sportId: sport.id, zoneId: zone.id })
      .expect(200)
      .expect([]);
  });
  it('previews WhatsApp without reserving and rechecks blocked slots', async () => {
    const { sport, zone, venue, slot } = await fixture();
    const draft = await create('booking-drafts', {
      sportId: sport.id,
      zoneId: zone.id,
      venueId: venue.id,
      slotId: slot.id,
      date: '2099-01-01',
      renterFirstName: 'Ana',
      renterLastName: 'Pérez',
      renterPhone: '+5491198765432',
    });
    const preview = await api()
      .post(`/api/booking-drafts/${draft.id}/whatsapp`)
      .expect(200);
    expect(preview.headers['cache-control']).toBe('no-store');
    expect(preview.body.status).toBe('PENDING_CONFIRMATION');
    const url = new URL(preview.body.url);
    expect(url.hostname).toBe('wa.me');
    expect(url.searchParams.get('text')).toContain('Horario: 22:00–23:00');
    expect(url.searchParams.get('text')).toContain('Ana Pérez');
    expect(url.searchParams.get('text')).not.toContain(slot.id);
    await api()
      .get(`/api/slots/${slot.id}`)
      .expect(200)
      .expect((r) => expect(r.body.status).toBe('AVAILABLE'));
    await api()
      .patch(`/api/slots/${slot.id}`)
      .set('X-API-Key', key)
      .send({ status: 'UNAVAILABLE' })
      .expect(200);
    await api().post(`/api/booking-drafts/${draft.id}/whatsapp`).expect(400);
    await api().get('/api/booking-drafts').expect(401);
    await api().delete(`/api/booking-drafts/${draft.id}`).expect(204);
    await api().get(`/api/booking-drafts/${draft.id}`).expect(404);
  });
  it('keeps contact and invalidates incompatible selections', async () => {
    const { sport, zone, venue, slot } = await fixture();
    const draft = await create('booking-drafts', {
      sportId: sport.id,
      zoneId: zone.id,
      venueId: venue.id,
      slotId: slot.id,
      date: '2099-01-01',
      renterFirstName: 'Ana',
      renterLastName: 'Pérez',
      renterPhone: '+5491198765432',
    });
    const other = await create('sports', {
      name: 'Tenis',
      icon: '🎾',
      isActive: true,
    });
    const update = await api()
      .patch(`/api/booking-drafts/${draft.id}`)
      .send({ sportId: other.id })
      .expect(200);
    expect(update.body.renterFirstName).toBe('Ana');
    expect(update.body.zoneId).toBe(zone.id);
    expect(update.body.venueId).toBeUndefined();
    expect(update.body.slotId).toBeUndefined();
    await api().post(`/api/booking-drafts/${draft.id}/whatsapp`).expect(400);
  });
  it('rejects incomplete or incompatible selections, contacts and schedules', async () => {
    const { sport, venue, zone, slot } = await fixture();
    for (const body of [
      { sportId: sport.id, venueId: venue.id },
      { sportId: sport.id, renterPhone: '1123456789' },
      { sportId: sport.id, renterFirstName: null },
      {
        sportId: sport.id,
        zoneId: zone.id,
        venueId: venue.id,
        slotId: slot.id,
        date: '2099-01-02',
      },
    ])
      await api().post('/api/booking-drafts').send(body).expect(400);
    await api()
      .patch(`/api/slots/${slot.id}`)
      .set('X-API-Key', key)
      .send({ endsAt: '2099-01-01T01:00:00Z' })
      .expect(400);
    const draft = await create('booking-drafts', { sportId: sport.id });
    await api().post(`/api/booking-drafts/${draft.id}/whatsapp`).expect(400);
  });
  it('rate limits repeated requests', async () => {
    for (let i = 0; i < 100; i++) await api().get('/api/sports').expect(200);
    await api().get('/api/sports').expect(429);
  });
  it.skipIf(!useMysql)(
    'persists after restarting the application and rolls back failures',
    async () => {
      const { sport } = await fixture();
      const repository = app.get(TurneroRepository);
      const temporaryId = randomUUID();
      await expect(
        repository.transaction(async () => {
          await repository.save('sports', {
            id: temporaryId,
            name: 'Rollback',
            icon: 'x',
            isActive: true,
          });
          throw new Error('Rollback probe');
        }),
      ).rejects.toThrow('Rollback probe');
      await api().get(`/api/sports/${temporaryId}`).expect(404);
      await app.close();
      await boot();
      await api()
        .get(`/api/sports/${sport.id}`)
        .expect(200)
        .expect((r) => expect(r.body.name).toBe('Fútbol'));
    },
  );
});
