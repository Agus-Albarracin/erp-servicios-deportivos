import { readFileSync } from 'node:fs';
import type { PoolOptions } from 'mysql2/promise';
export function databaseConfig(): PoolOptions {
  for (const name of ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'])
    if (!process.env[name]) throw new Error(`Falta configurar ${name}`);
  const port = Number(process.env.DB_PORT ?? 3306);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('DB_PORT inválido');
  if (
    process.env.DB_SSL !== undefined &&
    !['true', 'false'].includes(process.env.DB_SSL)
  )
    throw new Error('DB_SSL debe ser true o false');
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port,
    charset: 'utf8mb4_unicode_ci',
    timezone: 'Z',
    decimalNumbers: true,
    connectionLimit: 5,
    queueLimit: 50,
    waitForConnections: true,
    connectTimeout: 10_000,
    multipleStatements: false,
    ssl:
      process.env.DB_SSL === 'true'
        ? {
            rejectUnauthorized: true,
            ...(process.env.DB_SSL_CA
              ? { ca: readFileSync(process.env.DB_SSL_CA, 'utf8') }
              : {}),
          }
        : undefined,
  };
}
