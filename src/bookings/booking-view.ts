import type { BookingDraft, Slot, Tables } from '../storage/models.js';
export function bookingView(draft: BookingDraft, slots: Slot[], reservations: Tables['reservations'][]) {
  const slot = slots.find(item => item.id === draft.slotId);
  const reservation = reservations.find(item => item.id === draft.id);
  return { ...draft, status: reservation ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
    ...(slot ? { startsAt: slot.startsAt, endsAt: slot.endsAt } : {}),
    ...(reservation ? { confirmedAt: reservation.confirmedAt } : {}) };
}
