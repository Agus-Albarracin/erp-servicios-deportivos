import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TurneroRepository } from '../storage/turnero.repository.js';
import type { Tables } from '../storage/models.js';

type CatalogTable = 'sports' | 'zones' | 'venues' | 'venueSports';
@Injectable()
export class CatalogService {
  constructor(
    @Inject(TurneroRepository) private readonly repository: TurneroRepository,
  ) {}
  async get<K extends keyof Tables>(table: K, id: string): Promise<Tables[K]> {
    const item = await this.repository.get(table, id);
    if (!item) throw new NotFoundException('Registro no encontrado');
    return item;
  }
  async list<K extends CatalogTable>(table: K) {
    return this.repository.list(table);
  }
  async create<K extends CatalogTable>(table: K, dto: Omit<Tables[K], 'id'>) {
    const item = { ...dto, id: randomUUID() } as Tables[K];
    await this.validate(table, item);
    return this.repository.save(table, item);
  }
  async update<K extends CatalogTable>(
    table: K,
    id: string,
    dto: Partial<Omit<Tables[K], 'id'>>,
  ) {
    const item = { ...(await this.get(table, id)), ...dto, id } as Tables[K];
    await this.validate(table, item);
    return this.repository.save(table, item);
  }
  async remove(table: CatalogTable, id: string) {
    await this.get(table, id);
    const [venues, relations, slots, drafts] = await Promise.all(
      ['venues', 'venueSports', 'slots', 'drafts'].map((t) =>
        this.repository.list(t as keyof Tables),
      ),
    );
    const key = {
      sports: 'sportId',
      zones: 'zoneId',
      venues: 'venueId',
      venueSports: '',
    }[table];
    if (
      key &&
      [...venues, ...relations, ...slots, ...drafts].some(
        (item) => (item as unknown as Record<string, unknown>)[key] === id,
      )
    )
      throw new ConflictException(
        'El registro tiene referencias; desactivalo o eliminá primero sus dependencias',
      );
    if (table === 'venueSports') {
      const relation = await this.get('venueSports', id);
      if (
        (await this.repository.list('slots')).some(
          (s) =>
            s.venueId === relation.venueId && s.sportId === relation.sportId,
        )
      )
        throw new ConflictException('La relación tiene turnos; desactivala');
    }
    await this.repository.remove(table, id);
  }
  async assertCompatible(venueId: string, sportId: string, zoneId?: string) {
    const [venue, sport, relations] = await Promise.all([
      this.get('venues', venueId),
      this.get('sports', sportId),
      this.repository.list('venueSports', { venueId, sportId, isActive: true }),
    ]);
    if (
      !venue.isActive ||
      !sport.isActive ||
      (zoneId !== undefined && venue.zoneId !== zoneId) ||
      !relations.some(
        (r) => r.venueId === venueId && r.sportId === sportId && r.isActive,
      )
    )
      throw new BadRequestException(
        'La sede no está habilitada para la zona y el deporte elegidos',
      );
    return { venue, sport };
  }
  async availableVenues(zoneId: string, sportId: string) {
    await this.get('zones', zoneId);
    const sport = await this.get('sports', sportId);
    if (!sport.isActive) return [];
    const relations = await this.repository.list('venueSports', {
      sportId,
      isActive: true,
    });
    const venueIds = new Set(relations.map((r) => r.venueId));
    return (
      await this.repository.list('venues', { zoneId, isActive: true })
    ).filter((v) => venueIds.has(v.id));
  }
  private async validate<K extends CatalogTable>(table: K, item: Tables[K]) {
    if (table === 'zones') {
      const zone = item as Tables['zones'];
      if (
        (await this.repository.list('zones')).some(
          (z) => z.name === zone.name && z.id !== zone.id,
        )
      )
        throw new ConflictException('La zona ya existe');
    }
    if (table === 'venues')
      await this.get('zones', (item as Tables['venues']).zoneId);
    if (table === 'venueSports') {
      const relation = item as Tables['venueSports'];
      await this.get('venues', relation.venueId);
      await this.get('sports', relation.sportId);
      if (
        (await this.repository.list('venueSports')).some(
          (r) =>
            r.id !== relation.id &&
            r.venueId === relation.venueId &&
            r.sportId === relation.sportId,
        )
      )
        throw new ConflictException('La sede ya tiene ese deporte');
      const previous = await this.repository.get('venueSports', relation.id);
      if (
        previous &&
        (previous.venueId !== relation.venueId ||
          previous.sportId !== relation.sportId) &&
        (await this.repository.list('slots')).some(
          (s) =>
            s.venueId === previous.venueId && s.sportId === previous.sportId,
        )
      )
        throw new ConflictException(
          'No se puede cambiar una relación con turnos asociados',
        );
    }
  }
}
