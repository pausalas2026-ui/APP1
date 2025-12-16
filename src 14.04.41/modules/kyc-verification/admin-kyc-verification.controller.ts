// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Controller Admin para gestión de verificaciones
// REGLA MADRE: NADIE recibe dinero sin verificación previa

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { KycVerificationService } from './kyc-verification.service';
import {
  AdminApproveVerificationDto,
  AdminRejectVerificationDto,
  AdminReleaseFundsDto,
  AdminBlockFundsDto,
} from './dto';

// ============================================================================
// GUARDS (Mock para desarrollo - en producción usar AdminGuard real)
// ============================================================================

class MockAdminGuard {
  canActivate() {
    return true;
  }
}

// ============================================================================
// CONTROLLER ADMIN KYC
// DOC33 §7, §10
// ============================================================================

@Controller('admin/kyc')
@UseGuards(MockAdminGuard)
export class AdminKycVerificationController {
  constructor(private readonly kycService: KycVerificationService) {}

  /**
   * GET /admin/kyc/pending
   * Lista verificaciones pendientes de revisión manual
   * DOC33 §7 - Nivel 2 requiere revisión manual
   */
  @Get('pending')
  async listPendingVerifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('level') level?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.kycService.listPendingVerifications(pageNum, limitNum, level);
  }

  /**
   * GET /admin/kyc/:id
   * Detalle de una verificación específica
   */
  @Get(':id')
  async getVerificationDetails(@Param('id') verificationId: string) {
    return this.kycService.getVerificationDetails(verificationId);
  }

  /**
   * POST /admin/kyc/:id/approve
   * Aprueba manualmente una verificación
   * DOC33 §7 - Nivel 2 requiere aprobación manual
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveVerification(
    @Request() req: any,
    @Param('id') verificationId: string,
    @Body() dto: AdminApproveVerificationDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    await this.kycService.adminApproveVerification(verificationId, adminId, dto.notes);
    return { success: true, message: 'Verificación aprobada correctamente' };
  }

  /**
   * POST /admin/kyc/:id/reject
   * Rechaza una verificación con motivo obligatorio
   */
  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async rejectVerification(
    @Request() req: any,
    @Param('id') verificationId: string,
    @Body() dto: AdminRejectVerificationDto,
  ) {
    if (!dto.rejectionReason || dto.rejectionReason.trim().length < 10) {
      throw new BadRequestException(
        'El motivo del rechazo es obligatorio y debe tener al menos 10 caracteres'
      );
    }
    const adminId = req.user?.id || 'admin-mock';
    await this.kycService.adminRejectVerification(verificationId, adminId, dto.rejectionReason, dto.notes);
    return { success: true, message: 'Verificación rechazada' };
  }

  /**
   * GET /admin/kyc/stats
   * Estadísticas de verificaciones
   */
  @Get('stats/summary')
  async getVerificationStats() {
    return this.kycService.getVerificationStats();
  }
}

// ============================================================================
// CONTROLLER ADMIN FONDOS
// DOC33 §12, §13
// ============================================================================

@Controller('admin/funds')
@UseGuards(MockAdminGuard)
export class AdminFundsController {
  constructor(private readonly kycService: KycVerificationService) {}

  /**
   * GET /admin/funds/pending
   * Lista fondos pendientes de liberación
   */
  @Get('pending')
  async listPendingFunds(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.kycService.listPendingFunds(pageNum, limitNum, status);
  }

  /**
   * GET /admin/funds/:id
   * Detalle de un fondo específico
   */
  @Get(':id')
  async getFundDetails(@Param('id') fundId: string) {
    return this.kycService.getFundDetails(fundId);
  }

  /**
   * POST /admin/funds/:id/release
   * Libera fondos manualmente
   * DOC33 §13 - SOLO si todos los requisitos están cumplidos
   * 
   * REGLA: SIN EVIDENCIA = SIN DINERO
   */
  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  async releaseFunds(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminReleaseFundsDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    await this.kycService.adminReleaseFunds(fundId, adminId, dto.notes);
    return { success: true, message: 'Fondos liberados correctamente' };
  }

  /**
   * POST /admin/funds/:id/block
   * Bloquea fondos por sospecha de fraude
   * DOC33 §5 - Modelo antifraude
   */
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  async blockFunds(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminBlockFundsDto,
  ) {
    if (!dto.blockReason || dto.blockReason.trim().length < 10) {
      throw new BadRequestException(
        'El motivo del bloqueo es obligatorio y debe tener al menos 10 caracteres'
      );
    }
    const adminId = req.user?.id || 'admin-mock';
    await this.kycService.adminBlockFunds(fundId, adminId, dto.blockReason);
    return { success: true, message: 'Fondos bloqueados' };
  }

  /**
   * GET /admin/funds/audit/:userId
   * Historial de auditoría de fondos de un usuario
   */
  @Get('audit/:userId')
  async getFundAuditHistory(
    @Param('userId') userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    return this.kycService.getFundAuditHistory(userId, pageNum, limitNum);
  }
}
