import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createConnection } from 'mysql2/promise';
import { databaseConfig } from '../dist/storage/database.config.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const connection = await createConnection(databaseConfig());
try {
  const [locks] = await connection.execute("SELECT GET_LOCK('turnero_migrations', 30) AS acquired");
  if (Number(locks[0].acquired) !== 1) throw new Error('Otra migración está en ejecución');
  await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name VARCHAR(120) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB');
  for (const name of readdirSync(new URL('../migrations/', import.meta.url)).filter(name => name.endsWith('.sql')).sort()) {
    const sql = readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8');
    const checksum = createHash('sha256').update(sql).digest('hex');
    const [applied] = await connection.execute('SELECT checksum FROM schema_migrations WHERE name = ?', [name]);
    if (applied.length) {
      if (applied[0].checksum !== checksum) throw new Error(`La migración aplicada fue modificada: ${name}`);
      continue;
    }
    // These SQL files contain plain DDL, without stored procedures or semicolons in literals.
    // DDL auto-commits in MariaDB: initial statements are restartable after a partial failure.
    for (const statement of sql.replace(/^--.*$/gm, '').split(';').map(value => value.trim()).filter(Boolean)) await connection.query(statement);
    await connection.execute('INSERT INTO schema_migrations (name, checksum) VALUES (?, ?)', [name, checksum]);
    console.log(`Aplicada: ${name}`);
  }
} catch (error) {
  console.error(`Migración fallida (${error.code ?? error.message}). No se imprimen credenciales ni consultas.`);
  process.exitCode = 1;
} finally {
  await connection.query("SELECT RELEASE_LOCK('turnero_migrations')");
  await connection.end();
}
