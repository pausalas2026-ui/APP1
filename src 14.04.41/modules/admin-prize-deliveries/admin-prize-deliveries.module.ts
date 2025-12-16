// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 4, 5, 13
// BLOQUE ADMIN - Verificacion de entregas de premios (backend only)
// Endpoints: POST /admin/prize-deliveries/:id/verify, dispute
// SIN liberacion real de dinero

import { Module } from '@nestjs/common';
import { AdminPrizeDeliveriesController } from './admin-prize-deliveries.controller';
import { AdminPrizeDeliveriesService } from './admin-prize-deliveries.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AdminPrizeDeliveriesController],
  providers: [AdminPrizeDeliveriesService],
  exports: [AdminPrizeDeliveriesService],
})
export class AdminPrizeDeliveriesModule {}
