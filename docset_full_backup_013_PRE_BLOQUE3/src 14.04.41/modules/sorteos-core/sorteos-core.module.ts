// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: Core de Sorteos
// Modulo complementario - NO modifica BLOQUE 1

import { Module } from '@nestjs/common';
import { SorteosCoreService } from './sorteos-core.service';
import { SorteosCoreController } from './sorteos-core.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SorteosCoreController],
  providers: [SorteosCoreService],
  exports: [SorteosCoreService],
})
export class SorteosCoreModule {}
