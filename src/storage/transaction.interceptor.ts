import { Inject, Injectable } from '@nestjs/common';
import type {
  CallHandler,
  ExecutionContext,
  NestInterceptor,
} from '@nestjs/common';
import { defer, lastValueFrom } from 'rxjs';
import { TurneroRepository } from './turnero.repository.js';
@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    @Inject(TurneroRepository) private readonly repository: TurneroRepository,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    if (
      !['POST', 'PATCH', 'DELETE'].includes(
        context.switchToHttp().getRequest<{ method: string }>().method,
      )
    )
      return next.handle();
    return defer(() =>
      this.repository.transaction(() => lastValueFrom(next.handle())),
    );
  }
}
