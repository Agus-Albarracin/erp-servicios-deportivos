import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';

async function bootstrap() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  const port = Number(process.env.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT inválido');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });
  configureApp(app);
  await app.listen(port);
}
await bootstrap();
