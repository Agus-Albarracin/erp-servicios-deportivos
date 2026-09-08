import { Body, Controller, Delete, Get, Header, HttpCode, Inject, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ManagementGuard } from '../security/management.guard.js';
import { ApiEndpoint } from '../documentation/endpoint.decorator.js';
import { SlotQueryDto } from '../slots/slots.dto.js';
import { SlotResponseDto } from '../documentation/responses.dto.js';
import { SchedulingService } from './scheduling.service.js';
import { BlockedDayDto, BlockedDayResponseDto, CalendarDayDto, CalendarQueryDto, CalendarSettingsDto, ScheduleDto, ScheduleResponseDto } from './scheduling.dto.js';
@Controller('scheduling')
export class SchedulingController {
  constructor(@Inject(SchedulingService) private readonly scheduling: SchedulingService) {}
  @Get('settings') @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Consultar vista inicial del sistema', type: CalendarSettingsDto, noStore: true })
  settings() { return this.scheduling.settings(); }
  @Patch('settings') @UseGuards(ManagementGuard) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Configurar vista inicial de client y backoffice', type: CalendarSettingsDto, management: true, write: true, noStore: true })
  updateSettings(@Body() dto: CalendarSettingsDto) { return this.scheduling.updateSettings(dto); }
  @Get('schedules') @UseGuards(ManagementGuard) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Listar horarios recurrentes', type: ScheduleResponseDto, array: true, management: true, noStore: true })
  schedules() { return this.scheduling.schedules(); }
  @Post('schedules') @UseGuards(ManagementGuard) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Guardar horario recurrente por sede y deporte', description: 'Crea o reemplaza la regla de la pareja. No elimina turnos ni solicitudes anteriores. Desactivar la regla oculta sus turnos automáticos.', type: ScheduleResponseDto, status: 201, management: true, write: true, noStore: true, errors: [404, 409] })
  saveSchedule(@Body() dto: ScheduleDto) { return this.scheduling.saveSchedule(dto); }
  @Get('blocked-days') @UseGuards(ManagementGuard) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Listar cierres de sedes', type: BlockedDayResponseDto, array: true, management: true, noStore: true })
  blockedDays() { return this.scheduling.blockedDays(); }
  @Post('blocked-days') @UseGuards(ManagementGuard) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Bloquear un día completo de una sede', description: 'Afecta todos sus deportes, turnos manuales y automáticos. Impide seleccionar y generar WhatsApp; no envía cancelaciones ni elimina borradores.', type: BlockedDayResponseDto, status: 201, management: true, write: true, noStore: true, errors: [404, 409] })
  blockDay(@Body() dto: BlockedDayDto) { return this.scheduling.blockDay(dto); }
  @Delete('blocked-days/:id') @HttpCode(204) @UseGuards(ManagementGuard)
  @ApiEndpoint({ tag: 'Calendario', summary: 'Reabrir un día bloqueado', status: 204, management: true, id: true })
  unblockDay(@Param('id', ParseUUIDPipe) id: string) { return this.scheduling.unblockDay(id); }
  @Get('day') @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Consultar horarios disponibles y reservados de un día', description: 'Solo datos de horarios: no expone contactos ni identificadores de solicitudes. RESERVED no se puede seleccionar. /slots conserva su contrato de disponibles.', type: SlotResponseDto, array: true, noStore: true, errors: [400, 404] })
  day(@Query() query: SlotQueryDto) { return this.scheduling.day(query.venueId, query.sportId, query.date); }
  @Get('month') @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Calendario', summary: 'Consultar días y cantidad de turnos de un mes', description: 'Solo lectura, en Buenos Aires. Los motivos internos de cierre no se publican.', type: CalendarDayDto, array: true, noStore: true, errors: [400, 404] })
  month(@Query() query: CalendarQueryDto) { return this.scheduling.month(query); }
}
