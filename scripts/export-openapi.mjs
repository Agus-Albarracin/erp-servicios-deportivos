import { mkdir, writeFile } from 'node:fs/promises';
import { NestFactory } from '@nestjs/core';
import SwaggerParser from '@apidevtools/swagger-parser';
import { AppModule } from '../dist/app.module.js';
import { configureApp } from '../dist/configure-app.js';
import { createApiDocument } from '../dist/documentation/swagger.js';

// No .env, listen() or init(): documentation is generated without connecting to a database.
const app = await NestFactory.create(AppModule, {
  logger: false,
  bodyParser: false,
});
try {
  configureApp(app);
  const document = createApiDocument(app);
  await SwaggerParser.validate(structuredClone(document));
  await mkdir(new URL('../docs/', import.meta.url), { recursive: true });
  await writeFile(
    new URL('../docs/openapi.json', import.meta.url),
    JSON.stringify(document, null, 2) + '\n',
  );
  const operations = Object.values(document.paths).flatMap((path) =>
    Object.entries(path).filter(([method]) =>
      ['get', 'post', 'patch', 'delete'].includes(method),
    ),
  );
  console.log(
    `OpenAPI válido: ${operations.length} operaciones. Exportado a docs/openapi.json.`,
  );
} finally {
  await app.close();
}
