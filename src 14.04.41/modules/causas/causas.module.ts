// DOCUMENTO 06 - MODULOS CLAVE
// Modulo de causas/ONGs (estructura y estados, SIN liberacion de dinero)

import { Module } from '@nestjs/common';
import { CausasController } from './causas.controller';
import { CausasService } from './causas.service';

@Module({
  controllers: [CausasController],
  providers: [CausasService],
  exports: [CausasService],
})
export class CausasModule {}
