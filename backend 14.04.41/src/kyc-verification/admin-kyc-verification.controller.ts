/**
 * Admin KYC Verification Controller
 * 
 * DOCUMENTO 33 - Sistema de Verificación KYC (Panel Admin)
 * =========================================================
 * 
 * Endpoints administrativos para gestión de verificaciones:
 * - GET    /admin/kyc/pending - Listar verificaciones pendientes
 * - GET    /admin/kyc/:sessionId - Detalle de verificación
 * - POST   /admin/kyc/:sessionId/approve - Aprobar verificación
 * - POST   /admin/kyc/:sessionId/reject - Rechazar verificación
 * - GET    /admin/kyc/stats - Estadísticas de verificación
 */

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
  NotFoundException,
} from '@nestjs/common';
import { KycVerificationService } from './kyc-verification.service';

// ============================================================================
// GUARDS (Mock para desarrollo)
// ============================================================================

/**
 * Guard de admin mock
 * En producción usar el AdminGuard real
 */
class MockAdminGuard {
  canActivate() {
    return true;
  }
}

// ============================================================================
// DTOs ESPECÍFICOS DE ADMIN
// ============================================================================

class ApproveVerificationDto {
  notes?: string;
}

class RejectVerificationDto {
  reason: string;
}

// ============================================================================
// CONTROLLER ADMIN
// ============================================================================

@Controller('admin/kyc')
@UseGuards(MockAdminGuard)
export class AdminKycVerificationController {
  constructor(private readonly kycService: KycVerificationService) {}

  /**
   * GET /admin/kyc/pending
   * 
   * Lista todas las verificaciones pendientes de revisión
   */
  @Get('pending')
  async listPendingVerifications(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    const result = await this.kycService.listPendingVerifications(pageNum, limitNum);
    
    return {
      success: true,
      data: result.sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  /**
   * GET /admin/kyc/stats
   * 
   * Obtiene estadísticas de verificación
   */
  @Get('stats')
  async getVerificationStats() {
    const pending = await this.kycService.listPendingVerifications(1, 1000);
    
    // En una implementación real, estas estadísticas vendrían de la base de datos
    return {
      success: true,
      data: {
        pending: pending.total,
        approvedToday: 0, // TODO: Implementar con queries reales
        rejectedToday: 0,
        averageProcessingTime: '2.5 horas',
        completionRate: 85,
      },
    };
  }

  /**
   * GET /admin/kyc/:sessionId
   * 
   * Obtiene los detalles completos de una verificación
   */
  @Get(':sessionId')
  async getVerificationDetails(@Param('sessionId') sessionId: string) {
    const session = await this.kycService.getVerificationDetails(sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión de verificación no encontrada');
    }
    
    return {
      success: true,
      data: session,
    };
  }

  /**
   * POST /admin/kyc/:sessionId/approve
   * 
   * Aprueba manualmente una verificación
   */
  @Post(':sessionId/approve')
  @HttpCode(HttpStatus.OK)
  async approveVerification(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: ApproveVerificationDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    
    await this.kycService.adminApproveVerification(sessionId, adminId, dto.notes);
    
    return {
      success: true,
      message: 'Verificación aprobada correctamente',
      sessionId,
      approvedBy: adminId,
    };
  }

  /**
   * POST /admin/kyc/:sessionId/reject
   * 
   * Rechaza una verificación con motivo obligatorio
   */
  @Post(':sessionId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectVerification(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body() dto: RejectVerificationDto,
  ) {
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new BadRequestException(
        'El motivo del rechazo es obligatorio y debe tener al menos 10 caracteres'
      );
    }
    
    const adminId = req.user?.id || 'admin-mock';
    
    await this.kycService.adminRejectVerification(sessionId, adminId, dto.reason);
    
    return {
      success: true,
      message: 'Verificación rechazada',
      sessionId,
      rejectedBy: adminId,
      reason: dto.reason,
    };
  }
}
