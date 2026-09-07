import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { date, phone, text, uuid } from '../documentation/properties.js';
import { IsDateString, IsUUID, Matches, ValidateIf } from 'class-validator';
import { Phone, PlainText } from '../common/validation.js';
export class CreateBookingDto {
  @ApiProperty(uuid('Deporte activo elegido; único campo obligatorio al crear'))
  @IsUUID('4')
  sportId: string;
  @ApiPropertyOptional(text('Nombre del solicitante', 80, 'Ana'))
  @ValidateIf((_object, value) => value !== undefined)
  @PlainText(80)
  renterFirstName?: string;
  @ApiPropertyOptional(text('Apellido del solicitante', 80, 'Ejemplo'))
  @ValidateIf((_object, value) => value !== undefined)
  @PlainText(80)
  renterLastName?: string;
  @ApiPropertyOptional(phone)
  @ValidateIf((_object, value) => value !== undefined)
  @Phone()
  renterPhone?: string;
  @ApiPropertyOptional(
    uuid('Zona seleccionada; requerida antes de elegir sede'),
  )
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  zoneId?: string;
  @ApiPropertyOptional(uuid('Sede habilitada compatible con zona y deporte'))
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  venueId?: string;
  @ApiPropertyOptional(
    uuid('Turno futuro y disponible de la sede, deporte y fecha seleccionados'),
  )
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  slotId?: string;
  @ApiPropertyOptional(date)
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
export class UpdateBookingDto extends PartialType(CreateBookingDto, {
  skipNullProperties: false,
}) {}
