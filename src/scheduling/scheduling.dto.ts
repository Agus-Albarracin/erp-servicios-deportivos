import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsUUID, Matches, Max, Min } from 'class-validator';
import { PlainText } from '../common/validation.js';
export class CalendarSettingsDto {
  @ApiProperty({ description: 'Vista inicial calendario en client y backoffice.' })
  @IsBoolean() calendarEnabled: boolean;
}
export class ScheduleDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') venueId: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') sportId: string;
  @ApiProperty() @IsBoolean() isActive: boolean;
  @ApiProperty({ minimum: 1, maximum: 127, description: 'Máscara semanal: domingo=1, lunes=2, ... sábado=64.' })
  @IsInt() @Min(1) @Max(127) weekdays: number;
  @ApiProperty({ example: '09:00' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) opensAt: string;
  @ApiProperty({ example: '22:00' }) @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) closesAt: string;
  @ApiProperty({ minimum: 15, maximum: 720 }) @IsInt() @Min(15) @Max(720) durationMinutes: number;
  @ApiProperty({ minimum: 1, maximum: 365 }) @IsInt() @Min(1) @Max(365) horizonDays: number;
}
export class ScheduleResponseDto extends ScheduleDto {
  @ApiProperty({ format: 'uuid' }) id: string;
}
export class BlockedDayDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') venueId: string;
  @ApiProperty({ format: 'date' }) @IsDateString({ strict: true }) @Matches(/^\d{4}-\d{2}-\d{2}$/) date: string;
  @ApiProperty({ maxLength: 120 }) @PlainText(120) reason: string;
}
export class BlockedDayResponseDto extends BlockedDayDto {
  @ApiProperty({ format: 'uuid' }) id: string;
}
export class CalendarQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') venueId: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID('4') sportId: string;
  @ApiProperty({ example: '2026-09' }) @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month: string;
}
export class CalendarDayDto {
  @ApiProperty({ type: Number, description: 'Cantidad de turnos confirmados del día' }) reservedCount: number;
  @ApiProperty({ format: 'date' }) date: string;
  @ApiProperty() availableCount: number;
  @ApiProperty() blocked: boolean;
}
