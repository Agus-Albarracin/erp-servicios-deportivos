import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ManagementGuard } from '../security/management.guard.js';
import { SlotsService } from './slots.service.js';
import { CreateSlotDto, UpdateSlotDto, SlotQueryDto } from './slots.dto.js';
import { ApiEndpoint } from '../documentation/endpoint.decorator.js';
import { SlotResponseDto } from '../documentation/responses.dto.js';
@Controller('slots')
export class SlotsController {
  constructor(@Inject(SlotsService) private readonly slots: SlotsService) {}
  @ApiEndpoint({
    tag: 'Turnos',
    summary: 'Consultar disponibilidad por fecha',
    description:
      'Requiere venueId, sportId y date. Solo devuelve turnos AVAILABLE y futuros del día local en Buenos Aires. Un día sin turnos devuelve []. No genera una grilla de horarios bloqueados.',
    type: SlotResponseDto,
    array: true,
    errors: [400, 404],
  })
  @Get()
  list(@Query() query: SlotQueryDto) {
    return this.slots.available(query);
  }
  @ApiEndpoint({
    tag: 'Turnos',
    summary: 'Obtener un turno',
    description:
      'Puede devolver turnos pasados o bloqueados; esta lectura no acredita disponibilidad.',
    type: SlotResponseDto,
    id: true,
  })
  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.slots.get(id);
  }
  @ApiEndpoint({
    tag: 'Turnos',
    summary: 'Crear un turno',
    description:
      'La sede debe ofrecer el deporte. Fin posterior al inicio. No se impone duración ni política de solapamientos: una sede puede tener varias canchas.',
    type: SlotResponseDto,
    status: 201,
    management: true,
    write: true,
    errors: [404, 409],
  })
  @Post()
  @UseGuards(ManagementGuard)
  create(@Body() dto: CreateSlotDto) {
    return this.slots.create(dto);
  }
  @ApiEndpoint({
    tag: 'Turnos',
    summary: 'Actualizar o bloquear un turno',
    description:
      'Usar status UNAVAILABLE para bloquearlo. Campos omitidos se conservan; null no es válido.',
    type: SlotResponseDto,
    id: true,
    management: true,
    write: true,
    errors: [409],
  })
  @Patch(':id')
  @UseGuards(ManagementGuard)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSlotDto) {
    return this.slots.update(id, dto);
  }
  @ApiEndpoint({
    tag: 'Turnos',
    summary: 'Eliminar un turno sin solicitudes',
    description:
      'Si hay borradores asociados devuelve 409; bloquearlo en su lugar.',
    status: 204,
    id: true,
    management: true,
    errors: [409],
  })
  @Delete(':id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.slots.remove(id);
  }
}
