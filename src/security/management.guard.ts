import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class ManagementGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.MANAGEMENT_API_KEY;
    const supplied = context
      .switchToHttp()
      .getRequest<Request>()
      .header('x-api-key');
    if (
      !expected ||
      !supplied ||
      Buffer.byteLength(expected) !== Buffer.byteLength(supplied) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
    ) {
      throw new UnauthorizedException('Se requiere la clave de gestión');
    }
    return true;
  }
}
