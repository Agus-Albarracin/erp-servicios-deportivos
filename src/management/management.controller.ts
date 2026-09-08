import { Controller, Get, Header, Inject, UseGuards } from '@nestjs/common';
import { ManagementGuard } from '../security/management.guard.js';
import { ManagementService } from './management.service.js';
import { ApiEndpoint } from '../documentation/endpoint.decorator.js';
import { SportResponseDto, ZoneResponseDto, VenueResponseDto, VenueSportResponseDto, SlotResponseDto, BookingDraftResponseDto } from '../documentation/responses.dto.js';

/** Protected read endpoints; existing write endpoints preserve business validation. */
@Controller('management')
@UseGuards(ManagementGuard)
export class ManagementController {
  constructor(@Inject(ManagementService) private readonly management: ManagementService) {}

  @Get('sports')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar todos los deportes, incluidos inactivos', type: SportResponseDto, array: true, management: true, noStore: true })
  sports() { return this.management.list('sports'); }

  @Get('zones')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar todas las zonas', type: ZoneResponseDto, array: true, management: true, noStore: true })
  zones() { return this.management.list('zones'); }

  @Get('venues')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar todas las sedes, incluidas inactivas', type: VenueResponseDto, array: true, management: true, noStore: true })
  venues() { return this.management.list('venues'); }

  @Get('venue-sports')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar todas las relaciones sede/deporte', type: VenueSportResponseDto, array: true, management: true, noStore: true })
  relations() { return this.management.list('venueSports'); }

  @Get('slots')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar turnos disponibles, bloqueados y pasados', type: SlotResponseDto, array: true, management: true, noStore: true })
  slots() { return this.management.list('slots'); }

  @Get('booking-drafts')
  @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Listar borradores de solicitudes', description: 'Incluye datos personales y UUID secretos. No publicar ni registrar en logs. No representan reservas confirmadas.', type: BookingDraftResponseDto, array: true, management: true, noStore: true })
  drafts() { return this.management.list('drafts'); }
}
