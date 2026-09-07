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
import { ApiEndpoint } from '../documentation/endpoint.decorator.js';
import {
  BookingDraftResponseDto,
  WhatsAppResponseDto,
} from '../documentation/responses.dto.js';

// The unguessable draft UUID is a capability: never publish it or log request URLs.
@Controller('booking-drafts')
export class BookingsController {
  constructor(
    @Inject(BookingsService) private readonly bookings: BookingsService,
  ) {}
  @Get()
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Listar borradores (gestión)',
    description:
      'Contiene datos personales e identificadores secretos. No utilizar desde el frontend público.',
    type: BookingDraftResponseDto,
    array: true,
    management: true,
    noStore: true,
  })
  @Header('Cache-Control', 'no-store')
  @UseGuards(ManagementGuard)
  list() {
    return this.bookings.list();
  }
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Iniciar una solicitud',
    description:
      'Crear con sportId activo. Los demás campos son opcionales al comenzar, pero si se incluyen deben ser válidos. Zona antes de sede; sede y fecha antes de turno. Guardar el UUID devuelto como secreto de acceso. No confirma reservas.',
    type: BookingDraftResponseDto,
    status: 201,
    write: true,
    noStore: true,
    errors: [404, 409],
  })
  @Post()
  @Header('Cache-Control', 'no-store')
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Recuperar una solicitud propia',
    description:
      'El UUID actúa como secreto de acceso, sin login. La lectura no revalida la disponibilidad.',
    type: BookingDraftResponseDto,
    id: true,
    noStore: true,
  })
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.get(id);
  }
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Guardar un paso de la solicitud',
    description:
      'Actualización parcial; omitir campos sin cambios, no enviar null. Cambiar deporte o zona elimina la sede previa si queda incompatible, salvo que se envíe una sede nueva válida. Cambiar deporte, zona, sede o fecha elimina el turno anterior salvo que se envíe uno nuevo válido. El contacto permanece. El cliente debe reemplazar su borrador con la respuesta completa, sin conservar campos eliminados.',
    type: BookingDraftResponseDto,
    id: true,
    write: true,
    noStore: true,
    errors: [409],
  })
  @Patch(':id')
  @Header('Cache-Control', 'no-store')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookings.update(id, dto);
  }
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Descartar una solicitud propia',
    description:
      'Elimina solo el borrador. No es una cancelación de una reserva confirmada por WhatsApp.',
    status: 204,
    id: true,
    errors: [409],
  })
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.remove(id);
  }
  @Post(':id/whatsapp')
  @ApiEndpoint({
    tag: 'Borradores',
    summary: 'Preparar el resumen y enlace de WhatsApp',
    description:
      'Sin body requerido. Revalida contacto completo, zona, sede, fecha y turno futuro disponible. Devuelve PENDING_CONFIRMATION, summary, message y url. No envía mensajes ni bloquea disponibilidad. El navegador abre la URL solo por acción del usuario; la sede confirma la reserva.',
    type: WhatsAppResponseDto,
    id: true,
    noStore: true,
  })
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  whatsapp(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookings.whatsapp(id);
  }
}
