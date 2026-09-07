import { Module } from '@nestjs/common';
import { TurneroRepository } from './turnero.repository.js';
import { MysqlRepository } from './mysql.repository.js';
@Module({
  providers: [{ provide: TurneroRepository, useClass: MysqlRepository }],
  exports: [TurneroRepository],
})
export class StorageModule {}
