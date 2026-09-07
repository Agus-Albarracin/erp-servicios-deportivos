import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CatalogService } from '../catalog/catalog.service.js';
import { SlotsService } from '../slots/slots.service.js';
import { TurneroRepository } from '../storage/turnero.repository.js';
import type { BookingDraft } from '../storage/models.js';
import type { CreateBookingDto, UpdateBookingDto } from './bookings.dto.js';

@Injectable()
export class BookingsService {
  constructor(
    @Inject(TurneroRepository) private readonly repository: TurneroRepository,
    @Inject(CatalogService) private readonly catalog: CatalogService,
    @Inject(SlotsService) private readonly slots: SlotsService,
  ) {}
  list() {
    return this.repository.list('drafts');
  }
  get(id: string) {
    return this.catalog.get('drafts', id);
  }
  async create(dto: CreateBookingDto) {
    const draft = { ...dto, id: randomUUID() };
    await this.validate(draft);
    return this.repository.save('drafts', draft);
  }
  async update(id: string, dto: UpdateBookingDto) {
    const previous = await this.get(id);
    const draft = { ...previous, ...dto, id };
    const sportChanged = draft.sportId !== previous.sportId;
    const zoneChanged = draft.zoneId !== previous.zoneId;
    if (
      (sportChanged || zoneChanged) &&
      draft.venueId &&
      dto.venueId === undefined
    ) {
      try {
        await this.catalog.assertCompatible(
          draft.venueId,
          draft.sportId,
          draft.zoneId,
        );
      } catch (error) {
        if (!(error instanceof BadRequestException)) throw error;
        delete draft.venueId;
      }
    }
    if (
      (sportChanged ||
        zoneChanged ||
        draft.venueId !== previous.venueId ||
        draft.date !== previous.date) &&
      dto.slotId === undefined
    )
      delete draft.slotId;
    await this.validate(draft);
    return this.repository.save('drafts', draft);
  }
  async remove(id: string) {
    await this.get(id);
    await this.repository.remove('drafts', id);
  }
  async whatsapp(id: string) {
    const draft = await this.get(id);
    await this.validate(draft);
    if (
      !draft.renterFirstName ||
      !draft.renterLastName ||
      !draft.renterPhone ||
      !draft.zoneId ||
      !draft.venueId ||
      !draft.slotId ||
      !draft.date
    )
      throw new BadRequestException(
        'Completá todos los pasos antes de gestionar por WhatsApp',
      );
    const { sport, venue } = await this.catalog.assertCompatible(
      draft.venueId,
      draft.sportId,
      draft.zoneId,
    );
    const slot = await this.slots.selectable(
      draft.slotId,
      draft.venueId,
      draft.sportId,
      draft.date,
    );
    const options = { timeZone: 'America/Argentina/Buenos_Aires' };
    const date = new Intl.DateTimeFormat('es-AR', {
      ...options,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(slot.startsAt));
    const time = new Intl.DateTimeFormat('es-AR', {
      ...options,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    const message = `Hola, quiero consultar por este turno:\n\nDeporte: ${sport.name}\nSede: ${venue.name}\nDirección: ${venue.address}\nFecha: ${date}\nHorario: ${time.format(new Date(slot.startsAt))}–${time.format(new Date(slot.endsAt))}\n\nSolicitante: ${draft.renterFirstName} ${draft.renterLastName}\nTeléfono: ${draft.renterPhone}`;
    return {
      status: 'PENDING_CONFIRMATION',
      label: 'Gestionar por WhatsApp',
      notice: 'La reserva queda pendiente de confirmación por la sede.',
      summary: {
        sport,
        venue,
        slot,
        renterFirstName: draft.renterFirstName,
        renterLastName: draft.renterLastName,
        renterPhone: draft.renterPhone,
      },
      message,
      url: `https://wa.me/${venue.whatsappNumber.slice(1)}?text=${encodeURIComponent(message)}`,
    };
  }
  private async validate(draft: BookingDraft) {
    if (!(await this.catalog.get('sports', draft.sportId)).isActive)
      throw new BadRequestException('El deporte no está habilitado');
    if (draft.zoneId) await this.catalog.get('zones', draft.zoneId);
    if (draft.venueId) {
      if (!draft.zoneId)
        throw new BadRequestException(
          'Elegí una zona antes de seleccionar la sede',
        );
      await this.catalog.assertCompatible(
        draft.venueId,
        draft.sportId,
        draft.zoneId,
      );
    }
    if (draft.slotId) {
      if (!draft.venueId || !draft.date)
        throw new BadRequestException('Elegí sede y fecha antes del turno');
      await this.slots.selectable(
        draft.slotId,
        draft.venueId,
        draft.sportId,
        draft.date,
      );
    }
  }
}
