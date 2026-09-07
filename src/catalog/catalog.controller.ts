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
  @Get('sports') async sports() {
    return (await this.catalog.list('sports')).filter((s) => s.isActive);
  }
  @Get('sports/:id') sport(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.get('sports', id);
  }
  @Post('sports') @UseGuards(ManagementGuard) createSport(
    @Body() dto: CreateSportDto,
  ) {
    return this.catalog.create('sports', dto);
  }
  @Patch('sports/:id') @UseGuards(ManagementGuard) updateSport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSportDto,
  ) {
    return this.catalog.update('sports', id, dto);
  }
  @Delete('sports/:id') @HttpCode(204) @UseGuards(ManagementGuard) deleteSport(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.remove('sports', id);
  }

  @Get('zones') zones() {
    return this.catalog.list('zones');
  }
  @Get('zones/:id') zone(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.get('zones', id);
  }
  @Post('zones') @UseGuards(ManagementGuard) createZone(
    @Body() dto: CreateZoneDto,
  ) {
    return this.catalog.create('zones', dto);
  }
  @Patch('zones/:id') @UseGuards(ManagementGuard) updateZone(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.catalog.update('zones', id, dto);
  }
  @Delete('zones/:id') @HttpCode(204) @UseGuards(ManagementGuard) deleteZone(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.remove('zones', id);
  }

  @Get('venues') venues(@Query() query: VenueQueryDto) {
    return this.catalog.availableVenues(query.zoneId, query.sportId);
  }
  @Get('venues/:id') async venue(@Param('id', ParseUUIDPipe) id: string) {
    const venue = await this.catalog.get('venues', id);
    return {
      ...venue,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`,
    };
  }
  @Post('venues') @UseGuards(ManagementGuard) createVenue(
    @Body() dto: CreateVenueDto,
  ) {
    return this.catalog.create('venues', dto);
  }
  @Patch('venues/:id') @UseGuards(ManagementGuard) updateVenue(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.catalog.update('venues', id, dto);
  }
  @Delete('venues/:id') @HttpCode(204) @UseGuards(ManagementGuard) deleteVenue(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.remove('venues', id);
  }

  @Get('venue-sports') @UseGuards(ManagementGuard) relations() {
    return this.catalog.list('venueSports');
  }
  @Get('venue-sports/:id') @UseGuards(ManagementGuard) relation(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.catalog.get('venueSports', id);
  }
  @Post('venue-sports') @UseGuards(ManagementGuard) createRelation(
    @Body() dto: CreateVenueSportDto,
  ) {
    return this.catalog.create('venueSports', dto);
  }
  @Patch('venue-sports/:id') @UseGuards(ManagementGuard) updateRelation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVenueSportDto,
  ) {
    return this.catalog.update('venueSports', id, dto);
  }
  @Delete('venue-sports/:id')
  @HttpCode(204)
  @UseGuards(ManagementGuard)
  deleteRelation(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.remove('venueSports', id);
  }
}
