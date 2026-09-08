import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { SchedulingController } from './scheduling.controller.js';
import { SchedulingService } from './scheduling.service.js';
@Module({ imports: [StorageModule, CatalogModule], controllers: [SchedulingController], providers: [SchedulingService], exports: [SchedulingService] })
export class SchedulingModule {}
