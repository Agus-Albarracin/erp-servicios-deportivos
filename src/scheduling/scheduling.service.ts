import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CatalogService } from '../catalog/catalog.service.js';
import { TurneroRepository } from '../storage/turnero.repository.js';
import type { Slot } from '../storage/models.js';
import { SlotStatus } from '../storage/models.js';
import type { BlockedDayDto, CalendarQueryDto, CalendarSettingsDto, ScheduleDto } from './scheduling.dto.js';
import { candidates, dayOf, minuteOf } from './scheduling.rules.js';
const settingsId = '00000000-0000-4000-8000-000000000001';
@Injectable()
export class SchedulingService {
  constructor(@Inject(TurneroRepository) private readonly repository: TurneroRepository, @Inject(CatalogService) private readonly catalog: CatalogService) {}
  async settings() { return { calendarEnabled: (await this.repository.get('calendarSettings', settingsId))?.calendarEnabled ?? false }; }
  async updateSettings(dto: CalendarSettingsDto) { await this.repository.save('calendarSettings', { id: settingsId, ...dto }); return this.settings(); }
  schedules() { return this.repository.list('availabilitySchedules'); }
  blockedDays() { return this.repository.list('blockedDays'); }
  async saveSchedule(dto: ScheduleDto) {
    if (minuteOf(dto.closesAt) <= minuteOf(dto.opensAt) || minuteOf(dto.closesAt) - minuteOf(dto.opensAt) < dto.durationMinutes)
      throw new BadRequestException('El cierre debe ser posterior a la apertura y permitir al menos un turno completo.');
    const relations = await this.repository.list('venueSports', { venueId: dto.venueId, sportId: dto.sportId });
    if (!relations.length) throw new BadRequestException('Primero asociá el deporte a la sede.');
    if (dto.isActive) await this.catalog.assertCompatible(dto.venueId, dto.sportId);
    const previous = (await this.repository.list('availabilitySchedules', { venueId: dto.venueId, sportId: dto.sportId }))[0];
    return this.repository.save('availabilitySchedules', { ...dto, id: previous?.id ?? randomUUID() });
  }
  async blockDay(dto: BlockedDayDto) {
    await this.catalog.get('venues', dto.venueId);
    if (dto.date < dayOf(new Date())) throw new BadRequestException('No se puede bloquear un día pasado.');
    const previous = (await this.repository.list('blockedDays', { venueId: dto.venueId, date: dto.date }))[0];
    return this.repository.save('blockedDays', { ...dto, id: previous?.id ?? randomUUID() });
  }
  async unblockDay(id: string) {
    if (!(await this.repository.get('blockedDays', id))) throw new NotFoundException('Bloqueo no encontrado');
    await this.repository.remove('blockedDays', id);
  }
  private async snapshot(venueId: string, sportId: string) {
    const [schedules, blocks, stored, origins, reservations] = await Promise.all([
      this.repository.list('availabilitySchedules', { venueId, sportId }),
      this.repository.list('blockedDays', { venueId }),
      this.repository.list('slots', { venueId, sportId }),
      this.repository.list('generatedSlots'),
      this.repository.list('reservations'),
    ]);
    return { reservations, schedule: schedules[0], blocks: new Set(blocks.map(block => block.date)), stored, origins: new Set(origins.map(origin => origin.id)) };
  }
  private preview(snapshot: Awaited<ReturnType<SchedulingService['snapshot']>>, date: string): Slot[] {
    if (snapshot.blocks.has(date)) return [];
    const generated = candidates(snapshot.schedule, date);
    const generatedIds = new Set(generated.map(slot => slot.id));
    const existing = snapshot.stored.filter(slot => dayOf(slot.startsAt) === date);
    const result = existing.filter(slot => slot.status === SlotStatus.AVAILABLE && Date.parse(slot.startsAt) > Date.now() && (!snapshot.origins.has(slot.id) || generatedIds.has(slot.id)));
    const existingIds = new Set(existing.map(slot => slot.id));
    for (const slot of generated) {
      // A manually entered slot at the exact same time takes precedence, including its blocked state.
      if (!existingIds.has(slot.id) && !existing.some(other => other.startsAt === slot.startsAt && other.endsAt === slot.endsAt)) result.push(slot);
    }
    const reservedIds = new Set(snapshot.reservations.map(item => item.slotId));
    const reservedAutomatic = snapshot.stored.filter(slot => reservedIds.has(slot.id) && snapshot.origins.has(slot.id));
    return result.filter(slot => !reservedIds.has(slot.id) && !((snapshot.origins.has(slot.id) || generatedIds.has(slot.id)) && reservedAutomatic.some(other => slot.startsAt < other.endsAt && slot.endsAt > other.startsAt))).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  async month(query: CalendarQueryDto) {
    await this.catalog.assertCompatible(query.venueId, query.sportId);
    const snapshot = await this.snapshot(query.venueId, query.sportId);
    const [year, month] = query.month.split('-').map(Number);
    if (year < 2000 || year > 2200) throw new BadRequestException('Mes fuera de rango.');
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return Array.from({ length }, (_, index) => {
      const date = query.month + '-' + String(index + 1).padStart(2, '0');
      return { date, availableCount: this.preview(snapshot, date).length, reservedCount: snapshot.stored.filter(slot => dayOf(slot.startsAt) === date && snapshot.reservations.some(item => item.slotId === slot.id)).length, blocked: snapshot.blocks.has(date) };
    });
  }
  async available(venueId: string, sportId: string, date: string) {
    await this.catalog.assertCompatible(venueId, sportId);
    // The existing UUID slot contract is preserved. Generation is idempotent and serialized;
    // month previews are read-only, and only the requested day is materialized.
    return this.repository.transaction(async () => {
      const snapshot = await this.snapshot(venueId, sportId);
      const available = this.preview(snapshot, date);
      const storedIds = new Set(snapshot.stored.map(slot => slot.id));
      for (const slot of available) if (!storedIds.has(slot.id)) {
        await this.repository.save('slots', slot);
        await this.repository.save('generatedSlots', { id: slot.id, scheduleId: snapshot.schedule!.id });
      }
      return available;
    });
  }
  async day(venueId: string, sportId: string, date: string) {
    const available = await this.available(venueId, sportId, date);
    const [stored, reservations] = await Promise.all([this.repository.list('slots', { venueId, sportId }), this.repository.list('reservations')]);
    const reserved = new Set(reservations.map(item => item.slotId));
    return [...available.filter(slot => !reserved.has(slot.id)), ...stored.filter(slot => dayOf(slot.startsAt) === date && reserved.has(slot.id)).map(slot => ({ ...slot, status: SlotStatus.RESERVED }))].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  async effectiveSlots(slots: Slot[]) {
    const reserved = new Set((await this.repository.list('reservations')).map(item => item.slotId));
    const [blocks, origins, schedules] = await Promise.all([this.repository.list('blockedDays'), this.repository.list('generatedSlots'), this.repository.list('availabilitySchedules')]);
    const closed = new Set(blocks.map(block => block.venueId + ':' + block.date));
    const source = new Map(origins.map(origin => [origin.id, origin.scheduleId]));
    const rules = new Map(schedules.map(schedule => [schedule.id, schedule]));
    const expected = new Map<string, Set<string>>();
    return slots.map(slot => {
      if (reserved.has(slot.id)) return { ...slot, status: SlotStatus.RESERVED };
      const date = dayOf(slot.startsAt);
      let blocked = closed.has(slot.venueId + ':' + date);
      const scheduleId = source.get(slot.id);
      if (scheduleId) {
        const key = scheduleId + ':' + date;
        if (!expected.has(key)) expected.set(key, new Set(candidates(rules.get(scheduleId), date).map(item => item.id)));
        blocked ||= !expected.get(key)!.has(slot.id);
      }
      return blocked ? { ...slot, status: SlotStatus.UNAVAILABLE } : slot;
    });
  }
  async allowed(slot: Slot) {
    if ((await this.repository.list('reservations', { slotId: slot.id })).length) return false;
    if ((await this.repository.list('blockedDays', { venueId: slot.venueId, date: dayOf(slot.startsAt) })).length) return false;
    const origin = await this.repository.get('generatedSlots', slot.id);
    if (!origin) return true;
    const snapshot = await this.snapshot(slot.venueId, slot.sportId);
    return this.preview(snapshot, dayOf(slot.startsAt)).some(candidate => candidate.id === slot.id);
  }
}
