import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { SlotsModule } from '../slots/slots.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
@Module({
  imports: [StorageModule, CatalogModule, SlotsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
