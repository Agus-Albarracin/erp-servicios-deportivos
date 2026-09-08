import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';
import { addDays, dayOf } from '../dist/scheduling/scheduling.rules.js';
describe('Recurring availability and calendar settings', () => {
  let app: NestExpressApplication;
  const key = 'scheduling-test-only';
  const api = () => request(app.getHttpServer());
  const date = addDays(dayOf(new Date()), 1);
  beforeEach(async () => {
    process.env.MANAGEMENT_API_KEY = key;
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(TurneroRepository).useClass(MemoryRepository).compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApp(app); await app.init();
  });
  afterEach(async () => { await app.close(); delete process.env.MANAGEMENT_API_KEY; });
  async function create(path: string, body: object) { return (await api().post('/api/' + path).set('X-API-Key', key).send(body).expect(201)).body; }
  async function fixture() {
    const sport = await create('sports', { name: 'Tenis', icon: 'T', isActive: true });
    const zone = await create('zones', { name: 'CABA' });
    const venue = await create('venues', { name: 'Sede', zoneId: zone.id, address: 'Calle 123', latitude: -34.6, longitude: -58.4, description: 'Prueba', whatsappNumber: '+5491100000000', isActive: true });
    await create('venue-sports', { venueId: venue.id, sportId: sport.id, isActive: true });
    const rule = { venueId: venue.id, sportId: sport.id, weekdays: 127, opensAt: '09:00', closesAt: '11:00', durationMinutes: 60, horizonDays: 30, isActive: true };
    await create('scheduling/schedules', rule);
    const query = { venueId: venue.id, sportId: sport.id, date };
    return { sport, zone, venue, rule, query };
  }
  it('defaults to the classic view and protects every configuration write', async () => {
    expect((await api().get('/api/scheduling/settings').expect(200)).body).toEqual({ calendarEnabled: false });
    await api().patch('/api/scheduling/settings').send({ calendarEnabled: true }).expect(401);
    await api().post('/api/scheduling/schedules').send({}).expect(401);
    await api().post('/api/scheduling/blocked-days').send({}).expect(401);
    await api().get('/api/scheduling/schedules').expect(401);
    await api().get('/api/scheduling/blocked-days').expect(401);
    await api().delete('/api/scheduling/blocked-days/00000000-0000-4000-8000-000000000001').expect(401);
    await api().patch('/api/scheduling/settings').set('X-API-Key', key).send({ calendarEnabled: true }).expect(200);
    expect((await api().get('/api/scheduling/settings').expect('Cache-Control', 'no-store')).body.calendarEnabled).toBe(true);
    await api().patch('/api/scheduling/settings').set('X-API-Key', key).send({ calendarEnabled: null }).expect(400);
  });
  it('previews without inserting slots, generates a day idempotently, and observes the booking horizon', async () => {
    const { query, venue, sport } = await fixture();
    const repository = app.get(TurneroRepository);
    const calendar = await api().get('/api/scheduling/month').query({ venueId: venue.id, sportId: sport.id, month: date.slice(0, 7) }).expect(200);
    expect(calendar.body.find(day => day.date === date).availableCount).toBe(2);
    expect(await repository.list('slots')).toHaveLength(0);
    const first = await api().get('/api/slots').query(query).expect(200);
    const second = await api().get('/api/slots').query(query).expect(200);
    expect(first.body).toEqual(second.body);
    expect(first.body).toHaveLength(2);
    expect(first.body[0].startsAt).toBe(date + 'T12:00:00.000Z');
    expect(await repository.list('slots')).toHaveLength(2);
    expect((await api().get('/api/slots').query({ ...query, date: addDays(date, 90) }).expect(200)).body).toEqual([]);
  });
  it('blocks both views and revalidates an existing draft before WhatsApp; reopening preserves individually blocked slots', async () => {
    const { query, venue, sport, zone } = await fixture();
    const slots = (await api().get('/api/slots').query(query).expect(200)).body;
    const draft = await create('booking-drafts', { sportId: sport.id, zoneId: zone.id, venueId: venue.id, date, slotId: slots[0].id, renterFirstName: 'Ana', renterLastName: 'Pérez', renterPhone: '+5491100000001' });
    await api().patch('/api/slots/' + slots[1].id).set('X-API-Key', key).send({ status: 'UNAVAILABLE' }).expect(200);
    const block = await create('scheduling/blocked-days', { venueId: venue.id, date, reason: 'Mantenimiento interno' });
    expect((await api().get('/api/slots').query(query).expect(200)).body).toEqual([]);
    const managed = (await api().get('/api/management/slots').set('X-API-Key', key).expect(200)).body;
    expect(managed.every(slot => slot.status === 'UNAVAILABLE')).toBe(true);
    const month = (await api().get('/api/scheduling/month').query({ venueId: venue.id, sportId: sport.id, month: date.slice(0, 7) })).body;
    expect(month.find(day => day.date === date)).toEqual({ date, availableCount: 0, reservedCount: 0, blocked: true });
    expect(JSON.stringify(month)).not.toContain('Mantenimiento interno');
    await api().post('/api/booking-drafts/' + draft.id + '/whatsapp').expect(400);
    await api().patch('/api/booking-drafts/' + draft.id).send({ slotId: slots[0].id }).expect(400);
    await api().delete('/api/scheduling/blocked-days/' + block.id).set('X-API-Key', key).expect(204);
    expect((await api().get('/api/slots').query(query).expect(200)).body.map(slot => slot.id)).toEqual([slots[0].id]);
    await api().post('/api/booking-drafts/' + draft.id + '/whatsapp').expect(200);
  });
  it('invalidates obsolete generated slots after rule changes and retains manually entered slots', async () => {
    const { query, venue, sport, zone, rule } = await fixture();
    const original = (await api().get('/api/slots').query(query).expect(200)).body;
    await create('scheduling/schedules', { ...rule, opensAt: '14:00', closesAt: '16:00' });
    await api().post('/api/booking-drafts').send({ sportId: sport.id, zoneId: zone.id, venueId: venue.id, date, slotId: original[0].id }).expect(400);
    const manual = await create('slots', { venueId: venue.id, sportId: sport.id, startsAt: date + 'T18:00:00-03:00', endsAt: date + 'T19:00:00-03:00', status: 'AVAILABLE' });
    const revised = (await api().get('/api/slots').query(query).expect(200)).body;
    expect(revised).toHaveLength(3);
    expect(revised.some(slot => slot.id === manual.id)).toBe(true);
    await api().delete('/api/slots/' + original[0].id).set('X-API-Key', key).expect(409);
    await api().patch('/api/slots/' + original[0].id).set('X-API-Key', key).send({ endsAt: date + 'T19:00:00-03:00' }).expect(400);
  });
  it('rejects invalid schedules, null values and impossible dates', async () => {
    const { rule, venue } = await fixture();
    for (const patch of [{ weekdays: 0 }, { weekdays: 128 }, { durationMinutes: 0 }, { opensAt: '25:00' }, { closesAt: '08:00' }, { horizonDays: 500 }, { isActive: null }]) {
      await api().post('/api/scheduling/schedules').set('X-API-Key', key).send({ ...rule, ...patch }).expect(400);
    }
    await api().post('/api/scheduling/blocked-days').set('X-API-Key', key).send({ venueId: venue.id, date: '2026-02-30', reason: 'Cierre' }).expect(400);
    await api().post('/api/scheduling/blocked-days').set('X-API-Key', key).send({ venueId: venue.id, date: '2020-01-01', reason: 'Cierre' }).expect(400);
  });
});
