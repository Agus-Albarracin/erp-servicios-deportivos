import { ApiProperty, PartialType } from '@nestjs/swagger';
import { date, instant, uuid } from '../documentation/properties.js';
import { IsDateString, IsIn, IsUUID, Matches } from 'class-validator';
import { SlotStatus } from '../storage/models.js';
export class CreateSlotDto {
  @ApiProperty(uuid('Sede habilitada que ofrece el deporte'))
  @IsUUID('4')
  venueId: string;
  @ApiProperty(uuid('Deporte del turno'))
  @IsUUID('4')
  sportId: string;
  @ApiProperty(
    instant(
      'Inicio con zona horaria explícita. Se normaliza a UTC.',
      '2099-01-01T18:00:00-03:00',
    ),
  )
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/)
  startsAt: string;
  @ApiProperty(
    instant(
      'Fin posterior al inicio, con zona horaria explícita. Se normaliza a UTC.',
      '2099-01-01T19:00:00-03:00',
    ),
  )
  @IsDateString({ strict: true })
  @Matches(/T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/)
  endsAt: string;
  @ApiProperty({
    enum: [SlotStatus.AVAILABLE, SlotStatus.UNAVAILABLE],
    description: 'Disponibilidad del turno.',
    example: SlotStatus.AVAILABLE,
  })
  @IsIn([SlotStatus.AVAILABLE, SlotStatus.UNAVAILABLE])
  status: SlotStatus;
}
export class UpdateSlotDto extends PartialType(CreateSlotDto, {
  skipNullProperties: false,
}) {}
export class SlotQueryDto {
  @ApiProperty(uuid('Sede elegida; filtro obligatorio'))
  @IsUUID('4')
  venueId: string;
  @ApiProperty(uuid('Deporte elegido; filtro obligatorio'))
  @IsUUID('4')
  sportId: string;
  @ApiProperty(date)
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
