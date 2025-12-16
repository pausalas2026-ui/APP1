// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Modulo de premios (estructura y tipos, SIN liberacion de dinero)

import { Module } from '@nestjs/common';
import { PremiosController } from './premios.controller';
import { PremiosService } from './premios.service';

@Module({
  controllers: [PremiosController],
  providers: [PremiosService],
  exports: [PremiosService],
})
export class PremiosModule {}
