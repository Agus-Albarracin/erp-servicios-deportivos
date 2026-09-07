import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

// The domain accepts plain text only. Reject markup instead of silently altering it.
export function PlainText(max = 120) {
  return applyDecorators(
    Transform(({ value }: { value: unknown }) =>
      typeof value === 'string' ? value.trim() : value,
    ),
    IsString(),
    MinLength(1),
    MaxLength(max),
    // eslint-disable-next-line no-control-regex -- Plain-text fields must reject control characters.
    Matches(/^[^<>\u0000-\u001f\u007f]*$/u, {
      message:
        'El campo debe contener texto plano sin HTML ni caracteres de control',
    }),
  );
}

export function Phone() {
  return applyDecorators(
    IsString(),
    Matches(/^\+[1-9]\d{7,14}$/, {
      message: 'Usar teléfono internacional, por ejemplo +5491123456789',
    }),
  );
}
