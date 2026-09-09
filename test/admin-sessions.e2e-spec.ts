import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { TurneroRepository } from '../dist/storage/turnero.repository.js';
import { MemoryRepository } from './memory.repository.js';

describe('Shared administrative sessions', () => {
  let first: NestExpressApplication;
  let second: NestExpressApplication;
  let repository: MemoryRepository;
  const key = 'session-test-management-key';
  const tokenHash = 'a'.repeat(64);
  const api = (app: NestExpressApplication, path: string) => request(app.getHttpServer()).post('/api/management/sessions' + path).set('X-API-Key', key);
  beforeEach(async () => {
    vi.stubEnv('MANAGEMENT_API_KEY', key);
    repository = new MemoryRepository();
    async function create() {
      const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(TurneroRepository).useValue(repository).compile();
      const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
      configureApp(app); await app.init(); return app;
    }
    first = await create(); second = await create();
  });
  afterEach(async () => { await first?.close(); await second?.close(); vi.unstubAllEnvs(); });

  it('keeps sessions after one instance closes and revokes them across instances', async () => {
    const created = await api(first, '').send({ tokenHash, username: 'admin' }).expect(201);
    expect(created.headers['cache-control']).toBe('no-store');
    expect(created.body.expiresAt).toBeGreaterThan(Date.now());
    expect(created.body).not.toHaveProperty('tokenHash');
    await first.close();
    await api(second, '/lookup').send({ tokenHash }).expect(200);
    await api(second, '/revoke').send({ tokenHash }).expect(204);
    await api(second, '/lookup').send({ tokenHash }).expect(404);
    await api(second, '/revoke').send({ tokenHash }).expect(204);
  });

  it('rejects missing keys, malformed input, extra fields and expired sessions', async () => {
    for (const suffix of ['', '/lookup', '/revoke']) {
      await request(first.getHttpServer()).post('/api/management/sessions' + suffix).send({ tokenHash }).expect(401);
    }
    await api(first, '').send({ tokenHash: 'not-a-hash', username: 'admin' }).expect(400);
    await api(first, '').send({ tokenHash, username: 'admin', expiresAt: Number.MAX_SAFE_INTEGER }).expect(400);
    await repository.createAdminSession({ tokenHash, username: 'admin', expiresAt: Date.now() - 1 });
    await api(second, '/lookup').send({ tokenHash }).expect(404);
  });
});
