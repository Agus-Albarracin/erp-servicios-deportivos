import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';
import { createApiDocument } from '../dist/documentation/swagger.js';

describe('Administrative catalog access', () => {
  let app: NestExpressApplication;
  const key = 'management-test-only';
  const paths = ['sports', 'zones', 'venues', 'venue-sports', 'slots', 'booking-drafts'];
  beforeEach(async () => {
    process.env.MANAGEMENT_API_KEY = key;
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(TurneroRepository).useClass(MemoryRepository).compile();
    app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    configureApp(app);
    await app.init();
  });
  afterEach(async () => { await app.close(); delete process.env.MANAGEMENT_API_KEY; });

  it('protects every administrative list and never caches it', async () => {
    for (const path of paths) {
      await request(app.getHttpServer()).get(`/api/management/${path}`).expect(401);
      await request(app.getHttpServer()).get(`/api/management/${path}`).set('X-API-Key', 'wrong').expect(401);
      const response = await request(app.getHttpServer()).get(`/api/management/${path}`).set('X-API-Key', key).expect(200).expect('Cache-Control', 'no-store');
      expect(response.body).toEqual([]);
    }
    delete process.env.MANAGEMENT_API_KEY;
    await request(app.getHttpServer()).get('/api/management/sports').set('X-API-Key', key).expect(401);
  });

  it('includes inactive catalogs and blocked/past slots while public filtering remains intact', async () => {
    const repository = app.get(TurneroRepository);
    const sportId = '00000000-0000-4000-8000-000000000001';
    const venueId = '00000000-0000-4000-8000-000000000002';
    const zoneId = '00000000-0000-4000-8000-000000000003';
    await repository.save('sports', { id: sportId, name: 'Inactive', icon: 'x', isActive: false });
    await repository.save('venues', { id: venueId, name: 'Inactive venue', zoneId, isActive: false, address: 'Calle 123', description: 'Sede', latitude: -34, longitude: -58, whatsappNumber: '+5491100000000' });
    await repository.save('slots', { id: '00000000-0000-4000-8000-000000000004', venueId, sportId, startsAt: '2020-01-01T10:00:00Z', endsAt: '2020-01-01T11:00:00Z', status: 'UNAVAILABLE' });
    for (const resource of ['sports', 'venues', 'slots']) {
      const response = await request(app.getHttpServer()).get(`/api/management/${resource}`).set('X-API-Key', key).expect(200);
      expect(response.body).toHaveLength(1);
    }
    const response = await request(app.getHttpServer()).get('/api/sports').expect(200);
    expect(response.body).toEqual([]);
  });

  it('documents all six lists with security and array responses', () => {
    const document = createApiDocument(app);
    for (const resource of paths) {
      const operation = document.paths[`/api/management/${resource}`]?.get;
      expect(operation?.security).toContainEqual({ ManagementKey: [] });
      expect(operation?.responses['200']).toBeDefined();
      expect(operation?.responses['401']).toBeDefined();
    }
  });
});
