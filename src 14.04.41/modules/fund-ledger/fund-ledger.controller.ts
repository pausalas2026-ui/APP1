// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS
// Controller de fondos para usuarios
// REGLA: El dinero NUNCA está "libre" hasta que se cumplen TODAS las condiciones

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
} from '@nestjs/common';
import { FundLedgerService } from './fund-ledger.service';
import { FundLedgerStatus } from './fund-ledger.constants';
import { RequestReleaseDto } from './dto';

// Mock Guard para desarrollo
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

/**
 * Controller de fondos para usuarios
 * DOC34 §15
 */
@Controller('funds')
@UseGuards(MockAuthGuard)
export class FundLedgerController {
  constructor(private readonly fundService: FundLedgerService) {}

  /**
   * GET /funds/balance
   * Balance por estado
   */
  @Get('balance')
  async getBalance(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.fundService.getBalance(userId);
  }

  /**
   * GET /funds/ledger
   * Historial completo de fondos
   */
  @Get('ledger')
  async getLedger(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: FundLedgerStatus,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.fundService.getLedger(userId, pageNum, limitNum, status);
  }

  /**
   * GET /funds/:id
   * Detalle de un fondo específico
   */
  @Get(':id')
  async getFundById(@Request() req: any, @Param('id') fundId: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.fundService.getFundById(fundId, userId);
  }

  /**
   * GET /funds/:id/history
   * Historial de estados de un fondo
   */
  @Get(':id/history')
  async getFundHistory(@Request() req: any, @Param('id') fundId: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.fundService.getFundHistory(fundId, userId);
  }

  /**
   * POST /funds/:id/request-release
   * Solicitar liberación de un fondo
   */
  @Post(':id/request-release')
  @HttpCode(HttpStatus.OK)
  async requestRelease(
    @Request() req: any,
    @Param('id') fundId: string,
    @Body() dto: RequestReleaseDto,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.fundService.requestRelease(fundId, userId, dto.notes);
  }

  /**
   * GET /funds/:id/release-requirements
   * Ver qué falta para liberar
   */
  @Get(':id/release-requirements')
  async getReleaseRequirements(@Request() req: any, @Param('id') fundId: string) {
    const userId = req.user?.id || 'mock-user-id';
    return this.fundService.getReleaseRequirements(fundId, userId);
  }
}
