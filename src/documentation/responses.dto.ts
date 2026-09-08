import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateSportDto,
  CreateZoneDto,
  CreateVenueDto,
  CreateVenueSportDto,
} from '../catalog/catalog.dto.js';
import { CreateSlotDto } from '../slots/slots.dto.js';
import { CreateBookingDto } from '../bookings/bookings.dto.js';
import type {
  Sport,
  Zone,
  Venue,
  VenueSport,
  Slot,
  BookingDraft,
} from '../storage/models.js';
import { SlotStatus } from '../storage/models.js';
import { phone, text, uuid } from './properties.js';

export class SportResponseDto extends CreateSportDto implements Sport {
  @ApiProperty(uuid('Identificador público del deporte')) id: string;
}
export class ZoneResponseDto extends CreateZoneDto implements Zone {
  @ApiProperty(uuid('Identificador público de la zona')) id: string;
}
export class VenueResponseDto extends CreateVenueDto implements Venue {
  @ApiProperty(uuid('Identificador público de la sede')) id: string;
}
export class VenueDetailResponseDto extends VenueResponseDto {
  @ApiProperty({
    type: String,
    format: 'uri',
    description: 'Enlace a Google Maps construido con las coordenadas.',
    example: 'https://www.google.com/maps/search/?api=1&query=-34.6,-58.4',
  })
  mapUrl: string;
}
export class VenueSportResponseDto
  extends CreateVenueSportDto
  implements VenueSport
{
  @ApiProperty(uuid('Identificador público de la relación')) id: string;
}
export class SlotResponseDto extends CreateSlotDto implements Slot {
  @ApiProperty({ enum: SlotStatus, description: 'Estado efectivo. RESERVED solo se obtiene por confirmación administrativa.' }) declare status: SlotStatus;
  @ApiProperty(uuid('Identificador público del turno')) id: string;
}
export class BookingDraftResponseDto
  extends CreateBookingDto
  implements BookingDraft
{
  @ApiProperty({ enum: ['PENDING_CONFIRMATION', 'CONFIRMED'] }) status: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) startsAt?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) endsAt?: string;
  @ApiPropertyOptional({ type: String, format: 'date-time' }) confirmedAt?: string;
  @ApiProperty(
    uuid(
      'UUID secreto de acceso al borrador. Quien lo conoce puede leerlo, modificarlo y eliminarlo. No publicarlo ni registrarlo.',
    ),
  )
  id: string;
}
export class BookingSummaryDto {
  @ApiProperty({
    type: () => SportResponseDto,
    description: 'Deporte elegido.',
  })
  sport: SportResponseDto;
  @ApiProperty({
    type: () => VenueResponseDto,
    description: 'Sede elegida; no incluye mapUrl.',
  })
  venue: VenueResponseDto;
  @ApiProperty({
    type: () => SlotResponseDto,
    description: 'Turno revalidado.',
  })
  slot: SlotResponseDto;
  @ApiProperty(text('Nombre del solicitante', 80, 'Ana'))
  renterFirstName: string;
  @ApiProperty(text('Apellido del solicitante', 80, 'Ejemplo'))
  renterLastName: string;
  @ApiProperty(phone) renterPhone: string;
}
export class WhatsAppResponseDto {
  @ApiProperty({
    type: String,
    enum: ['PENDING_CONFIRMATION'],
    description: 'Generar el enlace no confirma una reserva.',
  })
  status: 'PENDING_CONFIRMATION';
  @ApiProperty({
    type: String,
    example: 'Gestionar por WhatsApp',
    description: 'Texto de la acción.',
  })
  label: string;
  @ApiProperty({
    type: String,
    example: 'La reserva queda pendiente de confirmación por la sede.',
    description: 'Aviso para mostrar al usuario.',
  })
  notice: string;
  @ApiProperty({
    type: () => BookingSummaryDto,
    description: 'Datos completos de la solicitud.',
  })
  summary: BookingSummaryDto;
  @ApiProperty({
    type: String,
    description:
      'Mensaje en español, con fecha y horario de Buenos Aires y sin IDs internos.',
    example: 'Hola, quiero consultar por este turno:…',
  })
  message: string;
  @ApiProperty({
    type: String,
    format: 'uri',
    description:
      'Enlace wa.me de la sede con el mensaje codificado. Abrir solo tras una acción del usuario.',
    example: 'https://wa.me/5491100000000?text=Hola',
  })
  url: string;
}
export class ApiErrorDto {
  @ApiProperty({
    type: Number,
    example: 400,
    description: 'Código de estado HTTP.',
  })
  statusCode: number;
  @ApiProperty({
    description: 'Mensaje de negocio o lista de errores de validación.',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'El turno no está disponible',
  })
  message: string | string[];
  @ApiPropertyOptional({
    type: String,
    example: 'Bad Request',
    description:
      'Nombre del error; puede omitirse, por ejemplo en el límite de solicitudes.',
  })
  error?: string;
}
