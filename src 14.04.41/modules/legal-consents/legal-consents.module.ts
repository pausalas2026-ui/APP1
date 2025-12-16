/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Módulo NestJS para gestión de consentimientos legales
 */

import { Module } from '@nestjs/common';
import { LegalConsentsService } from './legal-consents.service';
import { LegalConsentsController } from './legal-consents.controller';
import { AdminLegalConsentsController } from './admin-legal-consents.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LegalConsentsController, AdminLegalConsentsController],
  providers: [LegalConsentsService],
  exports: [LegalConsentsService],
})
export class LegalConsentsModule {}
