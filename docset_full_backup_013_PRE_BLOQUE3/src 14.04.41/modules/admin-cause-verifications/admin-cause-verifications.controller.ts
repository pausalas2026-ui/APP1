// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 13
// BLOQUE ADMIN - Controller de verificacion de causas
// Endpoints administrativos para verificar/rechazar causas

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
import { AdminCauseVerificationsService } from './admin-cause-verifications.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RejectCauseDto } from './dto/reject-cause.dto';
import { ReviewNotesDto } from './dto/review-notes.dto';

@Controller('admin/causes')
@UseGuards(JwtAuthGuard)
export class AdminCauseVerificationsController {
  constructor(
    private readonly adminCauseVerificationsService: AdminCauseVerificationsService,
  ) {}

  /**
   * GET /api/v1/admin/causes/pending-verification
   * Obtener causas pendientes de verificacion
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Get('pending-verification')
  async getPendingVerifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminCauseVerificationsService.getPendingVerifications(page, limit);
  }

  /**
   * GET /api/v1/admin/causes/stats
   * Estadisticas de verificacion
   */
  @Get('stats')
  async getStats() {
    return this.adminCauseVerificationsService.getStats();
  }

  /**
   * GET /api/v1/admin/causes/:causaId/verification-details
   * Detalles completos de verificacion
   */
  @Get(':causaId/verification-details')
  async getVerificationDetails(@Param('causaId') causaId: string) {
    return this.adminCauseVerificationsService.getVerificationDetails(causaId);
  }

  /**
   * POST /api/v1/admin/causes/:causaId/start-review
   * Iniciar revision de causa (PENDING -> UNDER_REVIEW)
   */
  @Post(':causaId/start-review')
  async startReview(@Request() req: any, @Param('causaId') causaId: string) {
    return this.adminCauseVerificationsService.startReview(causaId, req.user.id);
  }

  /**
   * POST /api/v1/admin/causes/:causaId/verify
   * Aprobar causa (UNDER_REVIEW -> APPROVED)
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post(':causaId/verify')
  async verifyCause(
    @Request() req: any,
    @Param('causaId') causaId: string,
    @Body() dto: ReviewNotesDto,
  ) {
    return this.adminCauseVerificationsService.verifyCause(
      causaId,
      req.user.id,
      dto.notes,
    );
  }

  /**
   * POST /api/v1/admin/causes/:causaId/reject
   * Rechazar causa (UNDER_REVIEW -> REJECTED)
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post(':causaId/reject')
  async rejectCause(
    @Request() req: any,
    @Param('causaId') causaId: string,
    @Body() dto: RejectCauseDto,
  ) {
    return this.adminCauseVerificationsService.rejectCause(
      causaId,
      req.user.id,
      dto.rejectionReason,
      dto.notes,
    );
  }
}
