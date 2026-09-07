import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsEnum, IsUUID, Matches } from 'class-validator';
import { SlotStatus } from '../storage/models.js';
export class CreateSlotDto {
  @IsUUID('4') venueId: string;
  @IsUUID('4') sportId: string;
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/)
  startsAt: string;
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/)
  endsAt: string;
  @IsEnum(SlotStatus) status: SlotStatus;
}
export class UpdateSlotDto extends PartialType(CreateSlotDto, {
  skipNullProperties: false,
}) {}
export class SlotQueryDto {
  @IsUUID('4') venueId: string;
  @IsUUID('4') sportId: string;
  @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
}
