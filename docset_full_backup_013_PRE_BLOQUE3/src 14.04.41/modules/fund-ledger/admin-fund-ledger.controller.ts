// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS
// Controller Admin para gestión de fondos
// REGLA: Si hay DUDA, el dinero NO se libera
// REGLA: Sin checklist completo, NO se libera

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
import { FundLedgerService } from './fund-ledger.service';
import {
  AdminApproveFundDto,
  AdminReleaseFundDto,
  AdminBlockFundDto,
  AdminUnblockFundDto,
  AdminVerifyChecklistDto,
} from './dto';

// Mock Guard para desarrollo
class MockAdminGuard {
  canActivate() {
    return true;
  }
}

/**
 * Controller Admin para gestión de fondos
 * DOC34 §15
 */
@Controller('admin/funds')
@UseGuards(MockAdminGuard)
export class AdminFundLedgerController {
  constructor(private readonly fundService: FundLedgerService) {}

  /**
   * GET /admin/funds/pending
   * Fondos pendientes de aprobación
   */
  @Get('pending')
  async listPending(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.fundService.listPendingFunds(pageNum, limitNum);
  }

  /**
   * GET /admin/funds/held
   * Fondos retenidos
   */
  @Get('held')
  async listHeld(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.fundService.listHeldFunds(pageNum, limitNum);
  }

  /**
   * GET /admin/funds/:id
   * Detalle de un fondo (admin)
   */
  @Get(':id')
  async getFundById(@Param('id') fundId: string) {
    return this.fundService.getFundById(fundId);
  }

  /**
   * GET /admin/funds/:id/checklist
   * Ver checklist de liberación
   */
  @Get(':id/checklist')
  async getChecklist(@Param('id') fundId: string) {
    return this.fundService.getChecklist(fundId);
  }

  /**
   * POST /admin/funds/:id/checklist/verify
   * Verificar checklist
   * DOC34 §12: Checklist OBLIGATORIO antes de liberar
   */
  @Post(':id/checklist/verify')
  @HttpCode(HttpStatus.OK)
  async verifyChecklist(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminVerifyChecklistDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    return this.fundService.adminVerifyChecklist(fundId, adminId, dto);
  }

  /**
   * POST /admin/funds/:id/approve
   * Aprobar liberación
   */
  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approveFund(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminApproveFundDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    await this.fundService.adminApprove(fundId, adminId, dto.notes);
    return { success: true, message: 'Fondo aprobado correctamente' };
  }

  /**
   * POST /admin/funds/:id/release
   * Ejecutar liberación
   * DOC34 §12: Sin checklist completo, NO se libera
   */
  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  async releaseFund(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminReleaseFundDto,
  ) {
    const adminId = req.user?.id || 'admin-mock';
    await this.fundService.adminRelease(fundId, adminId, dto.transactionRef, dto.notes);
    return { success: true, message: 'Fondos liberados correctamente' };
  }

  /**
   * POST /admin/funds/:id/block
   * Bloquear fondos
   * DOC34 §11: Si hay DUDA, el dinero NO se libera
   */
  @Post(':id/block')
  @HttpCode(HttpStatus.OK)
  async blockFund(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminBlockFundDto,
  ) {
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new BadRequestException(
        'El motivo del bloqueo es obligatorio y debe tener al menos 10 caracteres',
      );
    }
    const adminId = req.user?.id || 'admin-mock';
    await this.fundService.adminBlock(fundId, adminId, dto.reason, dto.notes);
    return { success: true, message: 'Fondos bloqueados' };
  }

  /**
   * POST /admin/funds/:id/unblock
   * Desbloquear fondos (con justificación)
   */
  @Post(':id/unblock')
  @HttpCode(HttpStatus.OK)
  async unblockFund(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: AdminUnblockFundDto,
  ) {
    if (!dto.reason || dto.reason.trim().length < 10) {
      throw new BadRequestException(
        'El motivo del desbloqueo es obligatorio y debe tener al menos 10 caracteres',
      );
    }
    const adminId = req.user?.id || 'admin-mock';
    await this.fundService.adminUnblock(fundId, adminId, dto.reason, dto.notes);
    return { success: true, message: 'Fondos desbloqueados y puestos en revisión' };
  }
}
