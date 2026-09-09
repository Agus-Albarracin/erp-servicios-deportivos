import { AdminSessionsController } from './management/admin-sessions.controller.js';
import { ManagementController } from './management/management.controller.js';
import { ManagementService } from './management/management.service.js';
import { SchedulingModule } from './scheduling/scheduling.module.js';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CatalogModule } from './catalog/catalog.module.js';
import { SlotsModule } from './slots/slots.module.js';
import { BookingsModule } from './bookings/bookings.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TransactionInterceptor } from './storage/transaction.interceptor.js';

@Module({
  imports: [StorageModule, CatalogModule, SlotsModule, BookingsModule, SchedulingModule],
  controllers: [AppController, ManagementController, AdminSessionsController],
  providers: [
    AppService,
    ManagementService,
    { provide: APP_INTERCEPTOR, useClass: TransactionInterceptor },
  ],
})
export class AppModule {}
