import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CatalogService } from '../catalog/catalog.service.js';
import { TurneroRepository } from '../storage/turnero.repository.js';
import { SlotStatus } from '../storage/models.js';
import type { Slot } from '../storage/models.js';
import type {
  CreateSlotDto,
  UpdateSlotDto,
  SlotQueryDto,
} from './slots.dto.js';

export function localDate(instant: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(instant));
  return ['year', 'month', 'day']
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join('-');
}
@Injectable()
export class SlotsService {
  constructor(
    @Inject(TurneroRepository) private readonly repository: TurneroRepository,
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}
  get(id: string) {
    return this.catalog.get('slots', id);
  }
  async available(query: SlotQueryDto) {
    await this.catalog.assertCompatible(query.venueId, query.sportId);
    const start = new Date(`${query.date}T00:00:00-03:00`);
    const until = new Date(start.getTime() + 86_400_000);
    const from = new Date(Math.max(start.getTime(), Date.now() + 1));
    return this.repository.availableSlots(
      query.venueId,
      query.sportId,
      from,
      until,
    );
  }
  async selectable(id: string, venueId: string, sportId: string, date: string) {
    const slot = await this.get(id);
    await this.catalog.assertCompatible(venueId, sportId);
    if (
      slot.venueId !== venueId ||
      slot.sportId !== sportId ||
      localDate(slot.startsAt) !== date ||
      slot.status !== SlotStatus.AVAILABLE ||
      Date.parse(slot.startsAt) <= Date.now()
    )
      throw new BadRequestException(
        'El turno no está disponible o no corresponde a la selección',
      );
    return slot;
  }
  async create(dto: CreateSlotDto) {
    const slot = { ...dto, id: randomUUID() };
    await this.validate(slot);
    return this.repository.save('slots', slot);
  }
  async update(id: string, dto: UpdateSlotDto) {
    const slot = { ...(await this.get(id)), ...dto, id };
    await this.validate(slot);
    return this.repository.save('slots', slot);
  }
  async remove(id: string) {
    await this.get(id);
    if ((await this.repository.list('drafts')).some((d) => d.slotId === id))
      throw new ConflictException(
        'El turno tiene solicitudes; marcá su estado como UNAVAILABLE',
      );
    await this.repository.remove('slots', id);
  }
  private async validate(slot: Slot) {
    await this.catalog.assertCompatible(slot.venueId, slot.sportId);
    if (Date.parse(slot.endsAt) <= Date.parse(slot.startsAt))
      throw new BadRequestException(
        'La hora de fin debe ser posterior al inicio',
      );
    slot.startsAt = new Date(slot.startsAt).toISOString();
    slot.endsAt = new Date(slot.endsAt).toISOString();
    // No overlap policy is invented: multiple courts may share the same schedule.
  }
}
