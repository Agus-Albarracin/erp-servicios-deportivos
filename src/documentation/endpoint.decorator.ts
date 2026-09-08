import { applyDecorators } from '@nestjs/common';
import type { Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ApiErrorDto } from './responses.dto.js';

interface EndpointOptions {
  tag: string;
  summary: string;
  description?: string;
  type?: Type<unknown>;
  array?: boolean;
  status?: number;
  management?: boolean;
  id?: boolean;
  write?: boolean;
  noStore?: boolean;
  errors?: number[];
}
const errors: Record<number, string> = {
  400: 'Datos inválidos, campos extra o nulos, selección incompatible o turno no disponible.',
  401: 'X-API-Key ausente o incorrecta, o clave de gestión sin configurar.',
  403: 'Origen no permitido por CORS.',
  404: 'Registro o relación referenciada inexistente.',
  409: 'Duplicado o registro con dependencias que impiden la operación.',
  413: 'El JSON supera 16 KiB.',
  429: 'Se superaron 100 solicitudes por minuto por IP.',
  503: 'No se pudo acceder a la base de datos.',
};

export function ApiFailure(status: number) {
  return applyDecorators(
    ApiExtraModels(ApiErrorDto),
    ApiResponse({
      status,
      description: errors[status],
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ApiErrorDto) },
          example: { statusCode: status, message: errors[status] },
        },
      },
    }),
  );
}

/** Documents the real contract; it does not replace guards, validation or caching headers. */
export function ApiEndpoint(options: EndpointOptions) {
  const codes = new Set([403, 429, 503, ...(options.errors ?? [])]);
  if (options.id) {
    codes.add(400);
    codes.add(404);
  }
  if (options.write) {
    codes.add(400);
    codes.add(413);
  }
  if (options.management) codes.add(401);
  return applyDecorators(
    ApiTags(options.tag),
    ApiOperation({
      summary: options.summary,
      description: options.description,
      security: options.management ? [{ ManagementKey: [] }] : [],
    }),
    ApiResponse({
      status: options.status ?? 200,
      description:
        options.status === 204
          ? 'Eliminado. Sin cuerpo de respuesta.'
          : 'Operación completada. Respuesta directa, sin envoltorio data.',
      ...(options.type
        ? { type: options.type, isArray: options.array ?? false }
        : {}),
      ...(options.noStore
        ? {
            headers: {
              'Cache-Control': {
                description: 'El borrador no debe cachearse.',
                schema: { type: 'string', example: 'no-store' },
              },
            },
          }
        : {}),
    }),
    ...(options.management ? [ApiSecurity('ManagementKey')] : []),
    ...(options.id
      ? [
          ApiParam({
            name: 'id',
            type: String,
            format: 'uuid',
            description:
              options.tag === 'Borradores'
                ? 'UUID secreto del borrador. Usar únicamente uno propio; no publicarlo.'
                : 'UUID público del registro.',
            example: '00000000-0000-4000-8000-000000000001',
          }),
        ]
      : []),
    ...Array.from(codes, ApiFailure),
  );
}
