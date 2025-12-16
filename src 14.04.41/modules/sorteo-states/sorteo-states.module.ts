// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: Estados y Transiciones
// Modulo complementario - NO modifica BLOQUE 1

import { Module } from '@nestjs/common';
import { SorteoStatesService } from './sorteo-states.service';
import { SorteoStatesController } from './sorteo-states.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [SorteoStatesController],
  providers: [SorteoStatesService],
  exports: [SorteoStatesService],
})
export class SorteoStatesModule {}
