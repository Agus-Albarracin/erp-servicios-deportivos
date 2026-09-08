import { Inject, Injectable } from '@nestjs/common';
import { TurneroRepository } from '../storage/turnero.repository.js';
import { SchedulingService } from '../scheduling/scheduling.service.js';
import { bookingView } from '../bookings/booking-view.js';
import type { BookingDraft, Slot, Tables } from '../storage/models.js';

/** Complete lists for authenticated administration, including inactive records. */
@Injectable()
export class ManagementService {
  constructor(@Inject(TurneroRepository) private readonly repository: TurneroRepository, @Inject(SchedulingService) private readonly scheduling: SchedulingService) {}

  async list<K extends keyof Tables>(table: K): Promise<Tables[K][]> {
    const rows = await this.repository.list(table);
    if (table === 'drafts') {
      const [slots, reservations] = await Promise.all([this.repository.list('slots'), this.repository.list('reservations')]);
      return (rows as BookingDraft[]).map(draft => bookingView(draft, slots, reservations)) as Tables[K][];
    }
    return table === 'slots' ? await this.scheduling.effectiveSlots(rows as Slot[]) as Tables[K][] : rows;
  }
}
