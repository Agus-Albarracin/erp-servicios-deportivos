import type { ApiPropertyOptions } from '@nestjs/swagger';

// Synthetic examples only. These IDs do not refer to stored requests.
export const uuid = (description: string): ApiPropertyOptions => ({
  type: String,
  format: 'uuid',
  description,
  example: '00000000-0000-4000-8000-000000000001',
});
export const text = (
  description: string,
  maxLength = 120,
  example = 'Ejemplo',
): ApiPropertyOptions => ({
  type: String,
  description: `${description}. Texto plano; se eliminan espacios extremos.`,
  minLength: 1,
  maxLength,
  pattern: '^[^<>\\u0000-\\u001f\\u007f]*$',
  example,
});
export const phone: ApiPropertyOptions = {
  type: String,
  description: 'Teléfono internacional con + y 8–15 dígitos, sin espacios.',
  pattern: '^\\+[1-9]\\d{7,14}$',
  example: '+5491100000000',
};
export const date: ApiPropertyOptions = {
  type: String,
  format: 'date',
  pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  description: 'Día local en America/Argentina/Buenos_Aires.',
  example: '2099-01-01',
};
export const instant = (
  description: string,
  example: string,
): ApiPropertyOptions => ({
  type: String,
  format: 'date-time',
  description,
  pattern: 'T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d{1,3})?(?:Z|[+-]\\d{2}:\\d{2})$',
  example,
});
