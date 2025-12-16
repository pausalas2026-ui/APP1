// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 13
// BLOQUE ADMIN - Controller de verificacion de entregas
// Endpoints administrativos para verificar/disputar entregas

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AdminPrizeDeliveriesService } from './admin-prize-deliveries.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { DisputeDeliveryDto } from './dto/dispute-delivery.dto';
import { ReviewNotesDto } from './dto/review-notes.dto';

@Controller('admin/prize-deliveries')
@UseGuards(JwtAuthGuard)
export class AdminPrizeDeliveriesController {
  constructor(
    private readonly adminPrizeDeliveriesService: AdminPrizeDeliveriesService,
  ) {}

  /**
   * GET /api/v1/admin/prize-deliveries/pending-review
   * Obtener entregas pendientes de revision
   */
  @Get('pending-review')
  async getPendingReview(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminPrizeDeliveriesService.getPendingReview(page, limit);
  }

  /**
   * GET /api/v1/admin/prize-deliveries/stats
   * Estadisticas de entregas
   */
  @Get('stats')
  async getStats() {
    return this.adminPrizeDeliveriesService.getStats();
  }

  /**
   * GET /api/v1/admin/prize-deliveries/:id/details
   * Detalles completos de entrega
   */
  @Get(':id/details')
  async getDeliveryDetails(@Param('id') id: string) {
    return this.adminPrizeDeliveriesService.getDeliveryDetails(id);
  }

  /**
   * POST /api/v1/admin/prize-deliveries/:id/start-review
   * Iniciar revision (EVIDENCE_SUBMITTED -> UNDER_REVIEW)
   */
  @Post(':id/start-review')
  async startReview(@Request() req: any, @Param('id') id: string) {
    return this.adminPrizeDeliveriesService.startReview(id, req.user.id);
  }

  /**
   * POST /api/v1/admin/prize-deliveries/:id/verify
   * Verificar entrega (UNDER_REVIEW -> VERIFIED)
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post(':id/verify')
  async verifyDelivery(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: ReviewNotesDto,
  ) {
    return this.adminPrizeDeliveriesService.verifyDelivery(id, req.user.id, dto.notes);
  }

  /**
   * POST /api/v1/admin/prize-deliveries/:id/dispute
   * Marcar disputa (UNDER_REVIEW -> DISPUTED)
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post(':id/dispute')
  async markDisputed(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: DisputeDeliveryDto,
  ) {
    return this.adminPrizeDeliveriesService.markDisputed(id, req.user.id, dto.reason);
  }

  /**
   * POST /api/v1/admin/prize-deliveries/:id/release-money
   * Marcar dinero como liberado (VERIFIED -> COMPLETED)
   * Referencia: DOCUMENTO 32 seccion 13, 15.1
   * NOTA: Solo marca, NO transfiere dinero real
   */
  @Post(':id/release-money')
  async releaseMoney(@Request() req: any, @Param('id') id: string) {
    return this.adminPrizeDeliveriesService.markMoneyReleased(id, req.user.id);
  }
}
