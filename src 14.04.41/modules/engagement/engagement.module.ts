/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Módulo NestJS para engagement
 */

import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { GeolocationService } from './geolocation.service';
import { CauseUpdatesService } from './cause-updates.service';
import { EngagementController } from './engagement.controller';
import { AdminEngagementController } from './admin-engagement.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EngagementController, AdminEngagementController],
  providers: [MessagingService, GeolocationService, CauseUpdatesService],
  exports: [MessagingService, GeolocationService, CauseUpdatesService],
})
export class EngagementModule {}
