import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { SlotsController } from './slots.controller.js';
import { SlotsService } from './slots.service.js';
@Module({
  imports: [StorageModule, CatalogModule],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}
