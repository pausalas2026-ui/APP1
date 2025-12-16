// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.2: Participaciones
// Modulo complementario - NO modifica BLOQUE 1

import { Module } from '@nestjs/common';
import { ParticipacionesCoreService } from './participaciones-core.service';
import { ParticipacionesCoreController } from './participaciones-core.controller';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [ParticipacionesCoreController],
  providers: [ParticipacionesCoreService],
  exports: [ParticipacionesCoreService],
})
export class ParticipacionesCoreModule {}
