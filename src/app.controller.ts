import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiFailure } from './documentation/endpoint.decorator.js';

@Controller()
@ApiTags('General')
export class AppController {
  constructor(@Inject(AppService) private readonly appService: AppService) {}

  @Get()
  @ApiFailure(403)
  @ApiFailure(429)
  @ApiOperation({
    summary: 'Obtener la respuesta inicial del servicio',
    description:
      'Devuelve texto. No es un chequeo completo de salud de la base de datos.',
    security: [],
  })
  @ApiResponse({
    status: 200,
    description: 'Respuesta inicial.',
    content: {
      'text/html': { schema: { type: 'string', example: 'Hello World!' } },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
