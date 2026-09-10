import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';
import { addDays, dayOf } from '../dist/scheduling/scheduling.rules.js';
describe('Administrative reservations', () => {
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

  it('requires administration and reserves atomically; exposes time and public status without contact', async () => {
    const { query, sport, venue, zone } = await fixture();
    const slots = (await api().get('/api/slots').query(query)).body;
    const input = { sportId: sport.id, venueId: venue.id, zoneId: zone.id, date, slotId: slots[0].id, renterFirstName: 'Ana', renterLastName: 'Pérez', renterPhone: '+5491100000001' };
    const first = await create('booking-drafts', input);
    const second = await create('booking-drafts', input);
    expect(first.status).toBe('PENDING_CONFIRMATION');
    expect(first.startsAt).toBe(slots[0].startsAt);
    await api().post('/api/booking-drafts/' + first.id + '/confirm').expect(401);
    await api().post('/api/booking-drafts/' + first.id + '/whatsapp').expect(200);
    expect((await api().get('/api/slots').query(query)).body).toHaveLength(2);
    const responses = await Promise.all([first, second].map(draft => api().post('/api/booking-drafts/' + draft.id + '/confirm').set('X-API-Key', key)));
    expect(responses.map(response => response.status).sort()).toEqual([200, 409]);
    const confirmed = responses.find(response => response.status === 200)!.body;
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedAt).toBeTruthy();
    const again = await api().post('/api/booking-drafts/' + confirmed.id + '/confirm').set('X-API-Key', key).expect(200);
    expect(again.body.confirmedAt).toBe(confirmed.confirmedAt);
    await api().patch('/api/booking-drafts/' + confirmed.id).send({ renterFirstName: 'Otro' }).expect(409);
    await api().delete('/api/booking-drafts/' + confirmed.id).expect(409);
    await api().patch('/api/slots/' + slots[0].id).set('X-API-Key', key).send({ status: 'AVAILABLE' }).expect(409);
    await api().post('/api/booking-drafts').send(input).expect(400);
    const day = (await api().get('/api/scheduling/day').query(query).expect('Cache-Control', 'no-store').expect(200)).body;
    expect(day.map(slot => slot.status)).toEqual(['RESERVED', 'AVAILABLE']);
    expect(JSON.stringify(day)).not.toContain(confirmed.id);
    expect(JSON.stringify(day)).not.toContain(input.renterPhone);
    expect((await api().get('/api/slots').query(query)).body).toHaveLength(1);
    const requests = (await api().get('/api/management/booking-drafts').set('X-API-Key', key).expect(200)).body;
    expect(requests.find(draft => draft.id === confirmed.id)).toMatchObject({ status: 'CONFIRMED', startsAt: slots[0].startsAt, endsAt: slots[0].endsAt });
    const month = (await api().get('/api/scheduling/month').query({ venueId: venue.id, sportId: sport.id, month: date.slice(0, 7) })).body;
    expect(month.find(day => day.date === date)).toMatchObject({ availableCount: 1, reservedCount: 1 });
  });
  it('rejects incomplete or closed requests and preserves a reservation through closures and rule changes', async () => {
    const { query, sport, venue, zone, rule } = await fixture();
    const slots = (await api().get('/api/slots').query(query)).body;
    const incomplete = await create('booking-drafts', { sportId: sport.id });
    await api().post('/api/booking-drafts/' + incomplete.id + '/confirm').set('X-API-Key', key).expect(400);
    const draft = await create('booking-drafts', { sportId: sport.id, venueId: venue.id, zoneId: zone.id, date, slotId: slots[0].id, renterFirstName: 'Ana', renterLastName: 'Pérez', renterPhone: '+5491100000001' });
    const block = await create('scheduling/blocked-days', { venueId: venue.id, date, reason: 'Cierre' });
    await api().post('/api/booking-drafts/' + draft.id + '/confirm').set('X-API-Key', key).expect(400);
    expect(await app.get(TurneroRepository).list('reservations')).toHaveLength(0);
    await api().delete('/api/scheduling/blocked-days/' + block.id).set('X-API-Key', key).expect(204);
    await api().post('/api/booking-drafts/' + draft.id + '/confirm').set('X-API-Key', key).expect(200);
    await create('scheduling/schedules', { ...rule, durationMinutes: 30 });
    const revised = (await api().get('/api/slots').query(query)).body;
    expect(revised).toHaveLength(2);
    expect(revised.every(slot => slot.startsAt >= slots[0].endsAt)).toBe(true);
    await create('scheduling/blocked-days', { venueId: venue.id, date, reason: 'Cierre' });
    const day = (await api().get('/api/scheduling/day').query(query)).body;
    expect(day).toHaveLength(1);
    expect(day[0].status).toBe('RESERVED');
    await api().post('/api/slots').set('X-API-Key', key).send({ venueId: venue.id, sportId: sport.id, startsAt: slots[0].startsAt, endsAt: slots[0].endsAt, status: 'RESERVED' }).expect(400);
  });
  it('records external total payment once, requires confirmation and preserves reserved availability', async () => {
    const { query, sport, venue, zone } = await fixture();
    const slots = (await api().get('/api/slots').query(query)).body;
    const draft = await create('booking-drafts', { sportId: sport.id, venueId: venue.id, zoneId: zone.id, date, slotId: slots[0].id, renterFirstName: 'Ana', renterLastName: 'Pérez', renterPhone: '+5491100000001' });
    const path = '/api/booking-drafts/' + draft.id;
    expect(draft.paymentStatus).toBe('PENDING');
    await api().post(path + '/total-payment').expect(401);
    await api().post('/api/booking-drafts/not-a-uuid/total-payment').set('X-API-Key', key).expect(400);
    await api().post('/api/booking-drafts/00000000-0000-4000-8000-000000000099/total-payment').set('X-API-Key', key).expect(404);
    await api().post(path + '/total-payment').set('X-API-Key', key).expect(409);
    await api().patch(path).send({ paymentStatus: 'TOTAL_PAID', totalPaidAt: new Date().toISOString() }).expect(400);
    expect(await app.get(TurneroRepository).list('reservationPayments')).toHaveLength(0);
    const confirmed = (await api().post(path + '/confirm').set('X-API-Key', key).expect(200)).body;
    expect(confirmed.paymentStatus).toBe('RESERVATION_PAID');
    expect(confirmed).not.toHaveProperty('totalPaidAt');
    const responses = await Promise.all([1, 2].map(() => api().post(path + '/total-payment').set('X-API-Key', key).expect('Cache-Control', 'no-store').expect(200)));
    const paid = responses[0].body;
    expect(paid).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'TOTAL_PAID', confirmedAt: confirmed.confirmedAt });
    expect(Number.isNaN(Date.parse(paid.totalPaidAt))).toBe(false);
    expect(responses[1].body.totalPaidAt).toBe(paid.totalPaidAt);
    expect(await app.get(TurneroRepository).list('reservationPayments')).toHaveLength(1);
    const again = (await api().post(path + '/confirm').set('X-API-Key', key).expect(200)).body;
    expect(again).toMatchObject({ paymentStatus: 'TOTAL_PAID', totalPaidAt: paid.totalPaidAt });
    expect((await api().get(path).expect(200)).body).toEqual(paid);
    for (const listing of ['/api/management/booking-drafts', '/api/booking-drafts']) {
      expect((await api().get(listing).set('X-API-Key', key).expect(200)).body.find(item => item.id === draft.id)).toEqual(paid);
    }
    await api().patch(path).send({ renterFirstName: 'Otro' }).expect(409);
    await api().delete(path).expect(409);
    const day = (await api().get('/api/scheduling/day').query(query).expect(200)).body;
    expect(day.map(slot => slot.status)).toEqual(['RESERVED', 'AVAILABLE']);
    expect(JSON.stringify(day)).not.toContain('totalPaidAt');
    expect(JSON.stringify(day)).not.toContain('paymentStatus');
  });
  it('allows recording the total after the slot ended and the venue was deactivated', async () => {
    const { query, sport, venue, zone } = await fixture();
    const slots = (await api().get('/api/slots').query(query)).body;
    const draft = await create('booking-drafts', { sportId: sport.id, venueId: venue.id, zoneId: zone.id, date, slotId: slots[0].id, renterFirstName: 'Ana', renterLastName: 'Pérez', renterPhone: '+5491100000001' });
    const path = '/api/booking-drafts/' + draft.id;
    const confirmed = (await api().post(path + '/confirm').set('X-API-Key', key).expect(200)).body;
    // Simulate historical data without relying on the wall clock or relaxing production rules.
    const repository = app.get(TurneroRepository);
    await repository.save('slots', { ...slots[0], startsAt: '2000-01-01T12:00:00.000Z', endsAt: '2000-01-01T13:00:00.000Z' });
    await repository.save('venues', { ...venue, isActive: false });
    const paid = (await api().post(path + '/total-payment').set('X-API-Key', key).expect(200)).body;
    expect(paid).toMatchObject({ status: 'CONFIRMED', paymentStatus: 'TOTAL_PAID', confirmedAt: confirmed.confirmedAt });
    expect(await repository.get('slots', slots[0].id)).toMatchObject({ endsAt: '2000-01-01T13:00:00.000Z' });
  });
});
