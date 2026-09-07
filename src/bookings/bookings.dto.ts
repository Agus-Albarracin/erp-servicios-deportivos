import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsUUID, Matches, ValidateIf } from 'class-validator';
import { Phone, PlainText } from '../common/validation.js';
export class CreateBookingDto {
  @IsUUID('4') sportId: string;
  @ValidateIf((_object, value) => value !== undefined)
  @PlainText(80)
  renterFirstName?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @PlainText(80)
  renterLastName?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @Phone()
  renterPhone?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  zoneId?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  venueId?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsUUID('4')
  slotId?: string;
  @ValidateIf((_object, value) => value !== undefined)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
}
export class UpdateBookingDto extends PartialType(CreateBookingDto, {
  skipNullProperties: false,
}) {}
