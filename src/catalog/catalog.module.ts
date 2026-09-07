import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module.js';
import { CatalogController } from './catalog.controller.js';
import { CatalogService } from './catalog.service.js';
@Module({
  imports: [StorageModule],
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
