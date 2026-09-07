import { PartialType } from '@nestjs/mapped-types';
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
  @PlainText() name: string;
  @PlainText(80) icon: string;
  @IsBoolean() isActive: boolean;
}
export class UpdateSportDto extends PartialType(CreateSportDto, {
  skipNullProperties: false,
}) {}
export class CreateZoneDto {
  @IsEnum(ZoneName) name: ZoneName;
}
export class UpdateZoneDto extends PartialType(CreateZoneDto, {
  skipNullProperties: false,
}) {}
export class CreateVenueDto {
  @PlainText() name: string;
  @IsUUID('4') zoneId: string;
  @PlainText(250) address: string;
  @IsNumber() @IsLatitude() latitude: number;
  @IsNumber() @IsLongitude() longitude: number;
  @PlainText(2000) description: string;
  @Phone() whatsappNumber: string;
  @IsBoolean() isActive: boolean;
}
export class UpdateVenueDto extends PartialType(CreateVenueDto, {
  skipNullProperties: false,
}) {}
export class CreateVenueSportDto {
  @IsUUID('4') venueId: string;
  @IsUUID('4') sportId: string;
  @IsBoolean() isActive: boolean;
}
export class UpdateVenueSportDto extends PartialType(CreateVenueSportDto, {
  skipNullProperties: false,
}) {}
export class VenueQueryDto {
  @IsUUID('4') zoneId: string;
  @IsUUID('4') sportId: string;
}
