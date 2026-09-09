import { Body, Controller, Header, HttpCode, Inject, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ManagementGuard } from '../security/management.guard.js';
import { TurneroRepository } from '../storage/turnero.repository.js';
import { ApiEndpoint } from '../documentation/endpoint.decorator.js';

export class SessionLookupDto {
  @ApiProperty({ pattern: '^[a-f0-9]{64}$', description: 'SHA-256 del identificador aleatorio. Nunca enviar la cookie completa.' })
  @IsString() @Matches(/^[a-f0-9]{64}$/)
  tokenHash!: string;
}
export class CreateAdminSessionDto extends SessionLookupDto {
  @ApiProperty({ pattern: '^[a-zA-Z0-9_.@-]{1,80}$' })
  @IsString() @Matches(/^[a-zA-Z0-9_.@-]{1,80}$/)
  username!: string;
}
export class AdminSessionResponseDto {
  @ApiProperty() username!: string;
  @ApiProperty({ description: 'Expiración absoluta, milisegundos Unix; duración de ocho horas.' }) expiresAt!: number;
}

@Controller('management/sessions')
@UseGuards(ManagementGuard)
export class AdminSessionsController {
  constructor(@Inject(TurneroRepository) private readonly repository: TurneroRepository) {}

  @Post() @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Persistir sesión administrativa validada por backoffice', description: 'Uso privado del backoffice después de validar credenciales. Caduca a las ocho horas. Solo guarda el hash del identificador.', management: true, write: true, noStore: true, status: 201, type: AdminSessionResponseDto })
  async create(@Body() dto: CreateAdminSessionDto) {
    const session = { ...dto, expiresAt: Date.now() + 8 * 60 * 60 * 1000 };
    await this.repository.createAdminSession(session);
    return { username: session.username, expiresAt: session.expiresAt };
  }

  @Post('lookup') @HttpCode(200) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Consultar una sesión administrativa vigente', management: true, write: true, noStore: true, type: AdminSessionResponseDto, errors: [404] })
  async lookup(@Body() dto: SessionLookupDto) {
    const session = await this.repository.getAdminSession(dto.tokenHash);
    if (!session) throw new NotFoundException('Sesión inexistente o vencida');
    return { username: session.username, expiresAt: session.expiresAt };
  }

  @Post('revoke') @HttpCode(204) @Header('Cache-Control', 'no-store')
  @ApiEndpoint({ tag: 'Administración', summary: 'Revocar una sesión administrativa', description: 'Idempotente. Impide reutilizar una cookie revocada desde cualquier instancia.', management: true, write: true, noStore: true, status: 204 })
  async revoke(@Body() dto: SessionLookupDto) { await this.repository.revokeAdminSession(dto.tokenHash); }
}
