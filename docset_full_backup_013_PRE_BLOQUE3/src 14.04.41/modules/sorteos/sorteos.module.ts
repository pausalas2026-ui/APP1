// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Modulo de sorteos (estructura base, SIN dinero)

import { Module } from '@nestjs/common';
import { SorteosController } from './sorteos.controller';
import { SorteosService } from './sorteos.service';
import { ParticipacionesController } from './participaciones.controller';
import { ParticipacionesService } from './participaciones.service';

@Module({
  controllers: [SorteosController, ParticipacionesController],
  providers: [SorteosService, ParticipacionesService],
  exports: [SorteosService, ParticipacionesService],
})
export class SorteosModule {}
