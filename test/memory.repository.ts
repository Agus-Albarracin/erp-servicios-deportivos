import { TurneroRepository, type AdminSession } from '../dist/storage/turnero.repository.js';
import type { Tables } from '../src/storage/models.js';
// Only tests use memory; the application always binds MariaDB.
export class MemoryRepository extends TurneroRepository {
  private readonly rows = new Map<string, unknown>();
  async createAdminSession(session: AdminSession) {
    if (this.rows.has(`session:${session.tokenHash}`)) throw new Error('Duplicate session');
    this.rows.set(`session:${session.tokenHash}`, structuredClone(session));
  }
  async getAdminSession(tokenHash: string) {
    const session = this.rows.get(`session:${tokenHash}`) as AdminSession | undefined;
    return session && session.expiresAt > Date.now() ? structuredClone(session) : undefined;
  }
  async revokeAdminSession(tokenHash: string) { this.rows.delete(`session:${tokenHash}`); }
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(work: () => Promise<T>) {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    const snapshot = structuredClone(this.rows);
    try { return await work(); }
    catch (error) { this.rows.clear(); for (const [key, value] of snapshot) this.rows.set(key, value); throw error; }
    finally { release(); }
  }
  async list<K extends keyof Tables>(
    table: K,
    where: Partial<Tables[K]> = {},
  ): Promise<Tables[K][]> {
    return [...this.rows.entries()]
      .filter(([key]) => key.startsWith(`${table}:`))
      .map(([, value]) => structuredClone(value) as Tables[K])
      .filter((item) =>
        Object.entries(where).every(
          ([key, value]) => item[key as keyof Tables[K]] === value,
        ),
      );
  }
  async availableSlots(
    venueId: string,
    sportId: string,
    from: Date,
    until: Date,
  ) {
    return (await this.list('slots', { venueId, sportId }))
      .filter(
        (s) =>
          s.status === 'AVAILABLE' &&
          Date.parse(s.startsAt) >= from.getTime() &&
          Date.parse(s.startsAt) < until.getTime(),
      )
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  async get<K extends keyof Tables>(table: K, id: string) {
    return structuredClone(this.rows.get(`${table}:${id}`)) as
      Tables[K] | undefined;
  }
  async save<K extends keyof Tables>(table: K, item: Tables[K]) {
    this.rows.set(`${table}:${item.id}`, structuredClone(item));
    return structuredClone(item);
  }
  async remove<K extends keyof Tables>(table: K, id: string) {
    this.rows.delete(`${table}:${id}`);
  }
}
