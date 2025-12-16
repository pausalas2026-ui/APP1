// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 4 y 5
// BLOQUE 2 - SUB-BLOQUE 2.3: Entregas de premios
// Flujo de evidencia SIN liberacion de dinero

import { Module } from '@nestjs/common';
import { PrizeDeliveriesController } from './prize-deliveries.controller';
import { PrizeDeliveriesService } from './prize-deliveries.service';

@Module({
  controllers: [PrizeDeliveriesController],
  providers: [PrizeDeliveriesService],
  exports: [PrizeDeliveriesService],
})
export class PrizeDeliveriesModule {}
