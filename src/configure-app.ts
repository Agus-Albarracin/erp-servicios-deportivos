import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

export function configureApp(app: NestExpressApplication) {
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    origins.length === 0 ||
    origins.some((origin) => {
      try {
        const url = new URL(origin);
        return (
          !['http:', 'https:'].includes(url.protocol) || url.origin !== origin
        );
      } catch {
        return true;
      }
    })
  )
    throw new Error(
      'CORS_ORIGINS debe contener orígenes HTTP(S) exactos separados por comas',
    );
  app.disable('x-powered-by');
  app.use(helmet());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) callback(null, true);
      else callback(new ForbiddenException('Origen no permitido'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key'],
    credentials: false,
  });
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 100,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiadas solicitudes; intentá nuevamente más tarde',
      },
    }),
  );
  app.useBodyParser('json', { limit: '16kb' });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
    }),
  );
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
}
