export enum ZoneName {
  CABA = 'CABA',
  SUR = 'SUR',
  NORTE = 'NORTE',
  NOROESTE = 'NOROESTE',
  OESTE = 'OESTE',
}
export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
}
export interface Sport {
  id: string;
  name: string;
  icon: string;
  isActive: boolean;
}
export interface Zone {
  id: string;
  name: ZoneName;
}
export interface Venue {
  id: string;
  name: string;
  zoneId: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string;
  whatsappNumber: string;
  isActive: boolean;
}
export interface VenueSport {
  id: string;
  venueId: string;
  sportId: string;
  isActive: boolean;
}
export interface Slot {
  id: string;
  venueId: string;
  sportId: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
}
export interface BookingDraft {
  id: string;
  sportId: string;
  renterFirstName?: string;
  renterLastName?: string;
  renterPhone?: string;
  zoneId?: string;
  venueId?: string;
  slotId?: string;
  date?: string;
}
export interface Tables {
  sports: Sport;
  zones: Zone;
  venues: Venue;
  venueSports: VenueSport;
  slots: Slot;
  drafts: BookingDraft;
}
