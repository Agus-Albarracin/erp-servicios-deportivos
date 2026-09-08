import { ApiProperty, PartialType } from '@nestjs/swagger';
import { phone, text, uuid } from '../documentation/properties.js';
import {
  IsBoolean,
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Phone, PlainText } from '../common/validation.js';
import { ZoneName } from '../storage/models.js';

export class CreateSportDto {
  @ApiProperty(text('Nombre del deporte', 120, 'Fútbol'))
  @PlainText()
  name: string;
  @ApiProperty(text('Ícono del deporte', 80, '⚽'))
  @PlainText(80)
  icon: string;
  @ApiProperty({
    type: Boolean,
    description: 'Indica si el deporte está habilitado.',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
export class UpdateSportDto extends PartialType(CreateSportDto, {
  skipNullProperties: false,
}) {}
export class CreateZoneDto {
  @ApiProperty({
    enum: ZoneName,
    enumName: 'ZoneName',
    description: 'Zona geográfica.',
    example: ZoneName.CABA,
  })
  @IsEnum(ZoneName)
  name: ZoneName;
}
export class UpdateZoneDto extends PartialType(CreateZoneDto, {
  skipNullProperties: false,
}) {}
export class CreateVenueDto {
  @ApiProperty(text('Nombre de la sede', 120, 'Sede de ejemplo'))
  @PlainText()
  name: string;
  @ApiProperty(uuid('Zona a la que pertenece la sede'))
  @IsUUID('4')
  zoneId: string;
  @ApiProperty(text('Dirección de la sede', 250, 'Calle de ejemplo 123'))
  @PlainText(250)
  address: string;
  @ApiProperty({
    type: Number,
    minimum: -90,
    maximum: 90,
    description: 'Latitud numérica.',
    example: -34.6,
  })
  @IsNumber()
  @IsLatitude()
  latitude: number;
  @ApiProperty({
    type: Number,
    minimum: -180,
    maximum: 180,
    description: 'Longitud numérica.',
    example: -58.4,
  })
  @IsNumber()
  @IsLongitude()
  longitude: number;
  @ApiProperty(text('Descripción de la sede', 2000, 'Cancha cubierta.'))
  @PlainText(2000)
  description: string;
  @ApiProperty(phone)
  @Phone()
  whatsappNumber: string;
  @ApiProperty({
    type: Boolean,
    description: 'Sede habilitada para solicitudes.',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
export class UpdateVenueDto extends PartialType(CreateVenueDto, {
  skipNullProperties: false,
}) {}
export class CreateVenueSportDto {
  @ApiProperty(uuid('Sede que ofrece el deporte'))
  @IsUUID('4')
  venueId: string;
  @ApiProperty(uuid('Deporte ofrecido'))
  @IsUUID('4')
  sportId: string;
  @ApiProperty({
    type: Boolean,
    description: 'Relación sede/deporte habilitada.',
    example: true,
  })
  @IsBoolean()
  isActive: boolean;
}
export class UpdateVenueSportDto extends PartialType(CreateVenueSportDto, {
  skipNullProperties: false,
}) {}
export class VenueQueryDto {
  @ApiProperty(uuid('Zona seleccionada; filtro obligatorio'))
  @IsUUID('4')
  zoneId: string;
  @ApiProperty(uuid('Deporte seleccionado; filtro obligatorio'))
  @IsUUID('4')
  sportId: string;
}
