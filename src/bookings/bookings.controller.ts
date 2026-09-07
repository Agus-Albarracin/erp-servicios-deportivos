import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ManagementGuard } from '../security/management.guard.js';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto, UpdateBookingDto } from './bookings.dto.js';

// The unguessable draft UUID is a capability: never publish it or log request URLs.
@Controller('booking-drafts')
export class BookingsController {
  constructor(
    @Inject(BookingsService) private readonly bookings: BookingsService,
  ) {}
  @Get()
  @Header('Cache-Control', 'no-store')
  @UseGuards(ManagementGuard)
  list() {
    return this.bookings.list();
  }
  @Post() @Header('Cache-Control', 'no-store') create(
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookings.create(dto);
  }
  @Get(':id') @Header('Cache-Control', 'no-store') get(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookings.get(id);
  }
  @Patch(':id') @Header('Cache-Control', 'no-store') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookings.update(id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.remove(id);
  }
  @Post(':id/whatsapp')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  whatsapp(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.whatsapp(id);
  }
}
