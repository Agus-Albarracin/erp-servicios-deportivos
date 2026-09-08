import { ApiEndpoint } from '../documentation/endpoint.decorator.js';
import {
  SportResponseDto,
  ZoneResponseDto,
  VenueResponseDto,
  VenueDetailResponseDto,
  VenueSportResponseDto,
} from '../documentation/responses.dto.js';
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
import { CatalogService } from './catalog.service.js';
import {
  CreateSportDto,
  UpdateSportDto,
  CreateZoneDto,
  UpdateZoneDto,
  CreateVenueDto,
  UpdateVenueDto,
  CreateVenueSportDto,
  UpdateVenueSportDto,
  VenueQueryDto,
} from './catalog.dto.js';
import { ManagementGuard } from '../security/management.guard.js';

@Controller()
export class CatalogController {
  constructor(
    @Inject(CatalogService) private readonly catalog: CatalogService,
  ) {}
  @ApiEndpoint({
    tag: 'Deportes',
    summary: 'Listar deportes activos',
    description: 'Devuelve únicamente deportes activos.',
    type: SportResponseDto,
    array: true,
    management: false,
  })
  @Get('sports')
  async sports() {
    return (await this.catalog.list('sports')).filter((s) => s.isActive);
  }
  @ApiEndpoint({
    tag: 'Deportes',
    summary: 'Obtener el deporte',
    description:
      'Lectura por UUID. La lectura individual no filtra por estado activo.',
    type: SportResponseDto,
    id: true,
    management: false,
  })
  @Get('sports/:id')
  sport(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.get('sports', id);
  }
  @ApiEndpoint({
    tag: 'Deportes',
    summary: 'Crear el deporte',
    type: SportResponseDto,
    status: 201,
    management: true,
    write: true,
    errors: [409],
  })
  @Post('sports')
  @UseGuards(ManagementGuard)
  createSport(@Body() dto: CreateSportDto) {
    return this.catalog.create('sports', dto);
  }
  @ApiEndpoint({
    tag: 'Deportes',
    summary: 'Actualizar el deporte',
    description:
      'Actualización parcial. Omitir campos que no cambian; no se aceptan null ni campos extra.',
    type: SportResponseDto,
    id: true,
    management: true,
    write: true,
    errors: [409],
  })
  @Patch('sports/:id')
  @UseGuards(ManagementGuard)
  updateSport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSportDto,
  ) {
    return this.catalog.update('sports', id, dto);
  }
  @ApiEndpoint({
    tag: 'Deportes',
    summary: 'Eliminar el deporte',
    description:
      'No elimina en cascada. Si tiene dependencias, desactivar el recurso o resolverlas antes.',
    status: 204,
    id: true,
    management: true,
    errors: [409],
  })
  @Delete('sports/:id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  deleteSport(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.remove('sports', id);
  }

  @ApiEndpoint({
    tag: 'Zonas',
    summary: 'Listar zonas',
    description:
      'Valores geográficos permitidos: CABA, SUR, NORTE, NOROESTE y OESTE.',
    type: ZoneResponseDto,
    array: true,
    management: false,
  })
  @Get('zones')
  zones() {
    return this.catalog.list('zones');
  }
  @ApiEndpoint({
    tag: 'Zonas',
    summary: 'Obtener la zona',
    description:
      'Lectura por UUID. La lectura individual no filtra por estado activo.',
    type: ZoneResponseDto,
    id: true,
    management: false,
  })
  @Get('zones/:id')
  zone(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.get('zones', id);
  }
  @ApiEndpoint({
    tag: 'Zonas',
    summary: 'Crear la zona',
    type: ZoneResponseDto,
    status: 201,
    management: true,
    write: true,
    errors: [409],
  })
  @Post('zones')
  @UseGuards(ManagementGuard)
  createZone(@Body() dto: CreateZoneDto) {
    return this.catalog.create('zones', dto);
  }
  @ApiEndpoint({
    tag: 'Zonas',
    summary: 'Actualizar la zona',
    description:
      'Actualización parcial. Omitir campos que no cambian; no se aceptan null ni campos extra.',
    type: ZoneResponseDto,
    id: true,
    management: true,
    write: true,
    errors: [409],
  })
  @Patch('zones/:id')
  @UseGuards(ManagementGuard)
  updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.catalog.update('zones', id, dto);
  }
  @ApiEndpoint({
    tag: 'Zonas',
    summary: 'Eliminar la zona',
    description:
      'No elimina en cascada. Si tiene dependencias, desactivar el recurso o resolverlas antes.',
    status: 204,
    id: true,
    management: true,
    errors: [409],
  })
  @Delete('zones/:id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  deleteZone(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.remove('zones', id);
  }

  @ApiEndpoint({
    tag: 'Sedes',
    summary: 'Listar sedes compatibles',
    description:
      'Requiere zoneId y sportId. Devuelve sedes activas de esa zona con la relación sede/deporte activa. Sin coincidencias devuelve un array vacío.',
    type: VenueResponseDto,
    array: true,
    management: false,
    errors: [400, 404],
  })
  @Get('venues')
  venues(@Query() query: VenueQueryDto) {
    return this.catalog.availableVenues(query.zoneId, query.sportId);
  }
  @ApiEndpoint({
    tag: 'Sedes',
    summary: 'Obtener la sede',
    description:
      'Incluye mapUrl. La lectura por ID puede devolver una sede desactivada; comprobar isActive.',
    type: VenueDetailResponseDto,
    id: true,
    management: false,
  })
  @Get('venues/:id')
  async venue(@Param('id', ParseUUIDPipe) id: string) {
    const venue = await this.catalog.get('venues', id);
    return {
      ...venue,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`,
    };
  }
  @ApiEndpoint({
    tag: 'Sedes',
    summary: 'Crear la sede',
    type: VenueResponseDto,
    status: 201,
    management: true,
    write: true,
    errors: [404, 409],
  })
  @Post('venues')
  @UseGuards(ManagementGuard)
  createVenue(@Body() dto: CreateVenueDto) {
    return this.catalog.create('venues', dto);
  }
  @ApiEndpoint({
    tag: 'Sedes',
    summary: 'Actualizar la sede',
    description:
      'Actualización parcial. Omitir campos que no cambian; no se aceptan null ni campos extra.',
    type: VenueResponseDto,
    id: true,
    management: true,
    write: true,
    errors: [409],
  })
  @Patch('venues/:id')
  @UseGuards(ManagementGuard)
  updateVenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.catalog.update('venues', id, dto);
  }
  @ApiEndpoint({
    tag: 'Sedes',
    summary: 'Eliminar la sede',
    description:
      'No elimina en cascada. Si tiene dependencias, desactivar el recurso o resolverlas antes.',
    status: 204,
    id: true,
    management: true,
    errors: [409],
  })
  @Delete('venues/:id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  deleteVenue(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.remove('venues', id);
  }

  @ApiEndpoint({
    tag: 'Deportes por sede',
    summary: 'Listar relaciones sede/deporte',
    description:
      'Operación de gestión. El frontend público filtra sedes mediante GET /api/venues.',
    type: VenueSportResponseDto,
    array: true,
    management: true,
  })
  @Get('venue-sports')
  @UseGuards(ManagementGuard)
  relations() {
    return this.catalog.list('venueSports');
  }
  @ApiEndpoint({
    tag: 'Deportes por sede',
    summary: 'Obtener la relación sede/deporte',
    description:
      'Lectura por UUID. La lectura individual no filtra por estado activo.',
    type: VenueSportResponseDto,
    id: true,
    management: true,
  })
  @Get('venue-sports/:id')
  @UseGuards(ManagementGuard)
  relation(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.get('venueSports', id);
  }
  @ApiEndpoint({
    tag: 'Deportes por sede',
    summary: 'Crear la relación sede/deporte',
    type: VenueSportResponseDto,
    status: 201,
    management: true,
    write: true,
    errors: [404, 409],
  })
  @Post('venue-sports')
  @UseGuards(ManagementGuard)
  createRelation(@Body() dto: CreateVenueSportDto) {
    return this.catalog.create('venueSports', dto);
  }
  @ApiEndpoint({
    tag: 'Deportes por sede',
    summary: 'Actualizar la relación sede/deporte',
    description:
      'Actualización parcial. Omitir campos que no cambian; no se aceptan null ni campos extra.',
    type: VenueSportResponseDto,
    id: true,
    management: true,
    write: true,
    errors: [409],
  })
  @Patch('venue-sports/:id')
  @UseGuards(ManagementGuard)
  updateRelation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueSportDto,
  ) {
    return this.catalog.update('venueSports', id, dto);
  }
  @ApiEndpoint({
    tag: 'Deportes por sede',
    summary: 'Eliminar la relación sede/deporte',
    description:
      'No elimina en cascada. Si tiene dependencias, desactivar el recurso o resolverlas antes.',
    status: 204,
    id: true,
    management: true,
    errors: [409],
  })
  @Delete('venue-sports/:id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  deleteRelation(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.remove('venueSports', id);
  }
}
