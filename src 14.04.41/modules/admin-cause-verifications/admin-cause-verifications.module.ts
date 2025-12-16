// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 13
// BLOQUE ADMIN - Verificacion de causas (backend only)
// Endpoints: POST /admin/causes/:id/verify, POST /admin/causes/:id/reject
// GET /admin/causes/pending-verification

import { Module } from '@nestjs/common';
import { AdminCauseVerificationsController } from './admin-cause-verifications.controller';
import { AdminCauseVerificationsService } from './admin-cause-verifications.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AdminCauseVerificationsController],
  providers: [AdminCauseVerificationsService],
  exports: [AdminCauseVerificationsService],
})
export class AdminCauseVerificationsModule {}
