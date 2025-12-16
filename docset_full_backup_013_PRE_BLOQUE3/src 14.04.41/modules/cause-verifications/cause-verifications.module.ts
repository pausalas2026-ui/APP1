// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6
// BLOQUE 2 - SUB-BLOQUE 2.4: Verificacion de causas
// Alcance cerrado: Validacion de causas (estado, flags, motivos)
// SIN: flujos de dinero, KYC, automatizaciones, panel admin

import { Module } from '@nestjs/common';
import { CauseVerificationsController } from './cause-verifications.controller';
import { CauseVerificationsService } from './cause-verifications.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CauseVerificationsController],
  providers: [CauseVerificationsService],
  exports: [CauseVerificationsService],
})
export class CauseVerificationsModule {}
