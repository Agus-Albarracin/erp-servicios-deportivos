import type { BookingDraft, Slot, Tables } from '../storage/models.js';
export function bookingView(draft: BookingDraft, slots: Slot[], reservations: Tables['reservations'][], payments: Tables['reservationPayments'][]) {
  const slot = slots.find(item => item.id === draft.slotId);
  const reservation = reservations.find(item => item.id === draft.id);
  const payment = reservation && payments.find(item => item.id === draft.id);
  return { ...draft, status: reservation ? 'CONFIRMED' : 'PENDING_CONFIRMATION',
    paymentStatus: reservation ? (payment ? 'TOTAL_PAID' : 'RESERVATION_PAID') : 'PENDING',
    ...(slot ? { startsAt: slot.startsAt, endsAt: slot.endsAt } : {}),
    ...(reservation ? { confirmedAt: reservation.confirmedAt } : {}),
    ...(payment ? { totalPaidAt: payment.totalPaidAt } : {}) };
}
