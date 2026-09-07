import type { Tables } from './models.js';

export abstract class TurneroRepository {
  abstract transaction<T>(work: () => Promise<T>): Promise<T>;
  abstract list<K extends keyof Tables>(
    table: K,
    where?: Partial<Tables[K]>,
  ): Promise<Tables[K][]>;
  abstract availableSlots(
    venueId: string,
    sportId: string,
    from: Date,
    until: Date,
  ): Promise<Tables['slots'][]>;
  abstract get<K extends keyof Tables>(
    table: K,
    id: string,
  ): Promise<Tables[K] | undefined>;
  abstract save<K extends keyof Tables>(
    table: K,
    value: Tables[K],
  ): Promise<Tables[K]>;
  abstract remove<K extends keyof Tables>(table: K, id: string): Promise<void>;
}
