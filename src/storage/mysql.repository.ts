import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createPool } from 'mysql2/promise';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { TurneroRepository } from './turnero.repository.js';
import type { Tables } from './models.js';
import { databaseConfig } from './database.config.js';

// SQL identifiers are exclusively defined here, never taken from HTTP input.
const columns: { [K in keyof Tables]: readonly (keyof Tables[K])[] } = {
  reservationPayments: ['id', 'totalPaidAt'],
  reservations: ['id', 'slotId', 'confirmedAt'],
  calendarSettings: ['id', 'calendarEnabled'],
  availabilitySchedules: ['id', 'venueId', 'sportId', 'isActive', 'weekdays', 'opensAt', 'closesAt', 'durationMinutes', 'horizonDays'],
  blockedDays: ['id', 'venueId', 'date', 'reason'],
  generatedSlots: ['id', 'scheduleId'],
  sports: ['id', 'name', 'icon', 'isActive'],
  zones: ['id', 'name'],
  venues: [
    'id',
    'name',
    'zoneId',
    'address',
    'latitude',
    'longitude',
    'description',
    'whatsappNumber',
    'isActive',
  ],
  venueSports: ['id', 'venueId', 'sportId', 'isActive'],
  slots: ['id', 'venueId', 'sportId', 'startsAt', 'endsAt', 'status'],
  drafts: [
    'id',
    'sportId',
    'renterFirstName',
    'renterLastName',
    'renterPhone',
    'zoneId',
    'venueId',
    'slotId',
    'date',
  ],
};
@Injectable()
export class MysqlRepository
  extends TurneroRepository
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;
  private readonly context = new AsyncLocalStorage<PoolConnection>();
  private readonly logger = new Logger(MysqlRepository.name);
  async onModuleInit() {
    this.pool = createPool(databaseConfig());
    try {
      await this.pool.query('SELECT pk FROM application_lock WHERE pk = 1');
    } catch {
      await this.pool.end();
      throw new Error(
        'No se pudo iniciar la base de datos. Revisá DB_* y ejecutá npm run db:migrate.',
      );
    }
  }
  async onModuleDestroy() {
    if (this.pool) await this.pool.end();
  }
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      // Serialize the small MVP's mutations across instances to avoid lost draft updates
      // and availability changes between validation and writing. Reads remain concurrent.
      await connection.query(
        'SELECT pk FROM application_lock WHERE pk = 1 FOR UPDATE',
      );
      const result = await this.context.run(connection, work);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  async list<K extends keyof Tables>(
    table: K,
    where: Partial<Tables[K]> = {},
  ): Promise<Tables[K][]> {
    const fields = columns[table].filter((field) => where[field] !== undefined);
    const values = fields.map((field) => where[field]) as (
      string | number | boolean
    )[];
    return this.select(
      table,
      fields.length
        ? ` WHERE ${fields.map((field) => `\`${String(field)}\` = ?`).join(' AND ')}`
        : '',
      values,
    );
  }
  availableSlots(venueId: string, sportId: string, from: Date, until: Date) {
    return this.select(
      'slots',
      ' WHERE venueId = ? AND sportId = ? AND status = ? AND startsAt >= ? AND startsAt < ? ORDER BY startsAt',
      [venueId, sportId, 'AVAILABLE', from, until],
    );
  }
  async get<K extends keyof Tables>(table: K, id: string) {
    return (await this.select(table, ' WHERE id = ?', [id]))[0];
  }
  async save<K extends keyof Tables>(
    table: K,
    item: Tables[K],
  ): Promise<Tables[K]> {
    const fields = columns[table];
    const values = fields.map((field) => {
      const value = item[field];
      return (field === 'startsAt' || field === 'endsAt' || field === 'confirmedAt' || field === 'totalPaidAt') &&
        typeof value === 'string'
        ? new Date(value)
        : (value ?? null);
    });
    try {
      const existing = await this.get(table, item.id);
      if (existing)
        await this.executor.execute(
          `UPDATE \`${table}\` SET ${fields.map((field) => `\`${String(field)}\` = ?`).join(', ')} WHERE id = ?`,
          [...values, item.id],
        );
      else
        await this.executor.execute(
          `INSERT INTO \`${table}\` (${fields.map((field) => `\`${String(field)}\``).join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`,
          values,
        );
      return item;
    } catch (error) {
      return this.fail(error);
    }
  }
  async remove<K extends keyof Tables>(table: K, id: string) {
    try {
      await this.executor.execute(`DELETE FROM \`${table}\` WHERE id = ?`, [
        id,
      ]);
    } catch (error) {
      this.fail(error);
    }
  }
  private get executor() {
    return this.context.getStore() ?? this.pool;
  }
  private async select<K extends keyof Tables>(
    table: K,
    suffix: string,
    values: (string | number | boolean | Date)[] = [],
  ): Promise<Tables[K][]> {
    try {
      const [rows] = await this.executor.execute<RowDataPacket[]>(
        `SELECT ${columns[table].map((field) => `\`${String(field)}\``).join(', ')} FROM \`${table}\`${suffix}`,
        values,
      );
      return rows.map(
        (row) =>
          Object.fromEntries(
            Object.entries(row)
              .filter(([, value]) => value !== null)
              .map(([key, value]) => [
                key,
                (key === 'isActive' || key === 'calendarEnabled')
                  ? Boolean(value)
                  : value instanceof Date
                    ? value.toISOString()
                    : value,
              ]),
          ) as unknown as Tables[K],
      );
    } catch (error) {
      return this.fail(error);
    }
  }
  private fail(error: unknown): never {
    const code = (error as { code?: string }).code;
    if (
      [
        'ER_DUP_ENTRY',
        'ER_ROW_IS_REFERENCED_2',
        'ER_NO_REFERENCED_ROW_2',
      ].includes(code ?? '')
    )
      throw new ConflictException(
        'El registro está duplicado o tiene referencias incompatibles',
      );
    if (code === 'ER_NO_SUCH_TABLE') throw new ServiceUnavailableException('La base necesita actualizarse. Ejecutá npm run db:migrate en server.');
    this.logger.error(`Database operation failed (${code ?? 'unknown'})`);
    throw new ServiceUnavailableException('No se pudo acceder a los datos');
  }
}
