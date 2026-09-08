import { createHash } from 'node:crypto';
import type { AvailabilitySchedule, Slot } from '../storage/models.js';
import { SlotStatus } from '../storage/models.js';
export const businessZone = 'America/Argentina/Buenos_Aires';
export function dayOf(instant: string | Date) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: businessZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(instant));
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)!.value).join('-');
}
export function minuteOf(time: string) { const [h, m] = time.split(':').map(Number); return h * 60 + m; }
export function addDays(day: string, count: number) { return new Date(Date.parse(day + 'T12:00:00Z') + count * 86400000).toISOString().slice(0, 10); }
function stableId(input: string) {
  const bytes = createHash('sha256').update(input).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString('hex');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}
export function candidates(schedule: AvailabilitySchedule | undefined, date: string, now = new Date()): Slot[] {
  if (!schedule?.isActive || date < dayOf(now) || date > addDays(dayOf(now), schedule.horizonDays)) return [];
  const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
  if (!(schedule.weekdays & (1 << weekday))) return [];
  const result: Slot[] = [];
  const startOfDay = Date.parse(date + 'T00:00:00-03:00');
  for (let minute = minuteOf(schedule.opensAt); minute + schedule.durationMinutes <= minuteOf(schedule.closesAt); minute += schedule.durationMinutes) {
    const start = startOfDay + minute * 60000;
    if (start <= now.getTime()) continue;
    const startsAt = new Date(start).toISOString();
    const endsAt = new Date(start + schedule.durationMinutes * 60000).toISOString();
    result.push({ id: stableId(schedule.id + ':' + startsAt + ':' + endsAt), venueId: schedule.venueId, sportId: schedule.sportId, startsAt, endsAt, status: SlotStatus.AVAILABLE });
  }
  return result;
}
