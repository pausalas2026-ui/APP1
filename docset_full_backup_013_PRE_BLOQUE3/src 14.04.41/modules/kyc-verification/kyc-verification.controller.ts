// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Controller principal de verificación KYC
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
} from '@nestjs/common';
import { KycVerificationService } from './kyc-verification.service';
import {
  StartVerificationDto,
  UploadDocumentDto,
  UploadSelfieDto,
  RequestWithdrawalDto,
} from './dto';
import { TriggerEvent } from './kyc-verification.constants';

// ============================================================================
// GUARDS (Mock para desarrollo - en producción usar AuthGuard real)
// ============================================================================

class MockAuthGuard {
  canActivate() {
    return true;
  }
}

// ============================================================================
// CONTROLLER DE VERIFICACIÓN KYC - ENDPOINTS USUARIO
// DOC33 §16
// ============================================================================

@Controller('verification')
@UseGuards(MockAuthGuard)
export class KycVerificationController {
  constructor(private readonly kycService: KycVerificationService) {}

  /**
   * GET /verification/status
   * Obtiene el estado actual de verificación del usuario
   * DOC33 §4
   */
  @Get('status')
  async getVerificationStatus(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.kycService.getVerificationStatus(userId);
  }

  /**
   * POST /verification/start
   * Inicia un nuevo proceso de verificación KYC
   * DOC33 §5, §6
   */
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  async startVerification(
    @Request() req: any,
    @Body() dto: StartVerificationDto,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.kycService.startVerification(userId, dto);
  }

  /**
   * POST /verification/:id/upload-document
   * Sube documento de identidad para verificación
   * DOC33 §6
   */
  @Post(':id/upload-document')
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @Request() req: any,
    @Param('id') verificationId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    await this.kycService.uploadDocument(userId, verificationId, dto);
    return { success: true, message: 'Documento subido correctamente' };
  }

  /**
   * POST /verification/:id/upload-selfie
   * Sube selfie/prueba de vida para verificación
   * DOC33 §6
   */
  @Post(':id/upload-selfie')
  @HttpCode(HttpStatus.OK)
  async uploadSelfie(
    @Request() req: any,
    @Param('id') verificationId: string,
    @Body() dto: UploadSelfieDto,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    await this.kycService.uploadSelfie(userId, verificationId, dto);
    return { success: true, message: 'Selfie subido correctamente' };
  }

  /**
   * GET /verification/check-required
   * Verifica si se requiere KYC para una acción específica
   * DOC33 §5
   */
  @Get('check-required')
  async checkIfRequired(
    @Request() req: any,
    @Query('action') action: TriggerEvent,
    @Query('amount') amount?: string,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    const amountNum = amount ? parseFloat(amount) : undefined;
    return this.kycService.checkIfVerificationRequired(userId, action, amountNum);
  }
}

// ============================================================================
// CONTROLLER DE FONDOS - ENDPOINTS USUARIO
// DOC33 §12, §13
// ============================================================================

@Controller('funds')
@UseGuards(MockAuthGuard)
export class FundsController {
  constructor(private readonly kycService: KycVerificationService) {}

  /**
   * GET /funds/balance
   * Obtiene el balance de fondos del usuario
   * DOC33 §12
   */
  @Get('balance')
  async getFundsBalance(@Request() req: any) {
    const userId = req.user?.id || 'mock-user-id';
    return this.kycService.getFundsBalance(userId);
  }

  /**
   * GET /funds/history
   * Obtiene historial de movimientos de fondos
   */
  @Get('history')
  async getFundsHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    return this.kycService.getFundsHistory(userId, pageNum, limitNum, status);
  }

  /**
   * GET /funds/requirements
   * Obtiene requisitos para liberar fondos
   * DOC33 §13 - Checklist obligatorio
   */
  @Get('requirements')
  async getWithdrawalRequirements(
    @Request() req: any,
    @Query('sourceId') sourceId?: string,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.kycService.getWithdrawalRequirements(userId, sourceId);
  }

  /**
   * POST /funds/request-withdrawal
   * Solicita retiro de fondos
   * DOC33 §13 - SOLO si todos los requisitos están cumplidos
   */
  @Post('request-withdrawal')
  @HttpCode(HttpStatus.CREATED)
  async requestWithdrawal(
    @Request() req: any,
    @Body() dto: RequestWithdrawalDto,
  ) {
    const userId = req.user?.id || 'mock-user-id';
    return this.kycService.requestWithdrawal(userId, dto);
  }
}
