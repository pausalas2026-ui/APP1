/**
 * KYC Verification Controller
 * 
 * DOCUMENTO 33 - Sistema de Verificación KYC
 * ==========================================
 * 
 * REGLA FUNDAMENTAL: "NADIE recibe dinero sin verificación previa"
 * 
 * Endpoints para usuarios:
 * - GET  /verification/status - Estado actual de verificación
 * - POST /verification/start - Iniciar proceso KYC
 * - POST /verification/upload-document - Subir documento de identidad
 * - POST /verification/upload-selfie - Subir selfie de verificación
 * - GET  /verification/session/:id - Estado de sesión específica
 * 
 * Endpoints de fondos:
 * - GET  /funds/balance - Balance disponible
 * - GET  /funds/history - Historial de fondos
 * - POST /funds/request-withdrawal - Solicitar retiro
 * - GET  /funds/requirements - Requisitos para retiro
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
import {
  StartVerificationDto,
  UploadDocumentDto,
  UploadSelfieDto,
  WithdrawalRequestDto,
  VerificationStatusResponseDto,
  FundBalanceResponseDto,
  FundHistoryResponseDto,
  WithdrawalRequirementsResponseDto,
  VerificationSessionResponseDto,
} from './dto';
import { TriggerType, KycLevel } from './kyc-verification.constants';

// ============================================================================
// GUARDS (Mock para desarrollo)
// ============================================================================

/**
 * Guard de autenticación mock
 * En producción usar el AuthGuard real del módulo auth
 */
class MockAuthGuard {
  canActivate() {
    return true;
  }
}

// ============================================================================
// CONTROLLER PRINCIPAL
// ============================================================================

@Controller()
export class KycVerificationController {
  constructor(private readonly kycService: KycVerificationService) {}

  // ==========================================================================
  // ENDPOINTS DE VERIFICACIÓN - /verification/*
  // ==========================================================================

  /**
   * GET /verification/status
   * 
   * Obtiene el estado actual de verificación del usuario autenticado.
   * Incluye nivel actual, documentos pendientes, y estado de fondos.
   */
  @Get('verification/status')
  @UseGuards(MockAuthGuard)
  async getVerificationStatus(
    @Request() req: any,
  ): Promise<VerificationStatusResponseDto> {
    // En desarrollo usamos un userId mock
    const userId = req.user?.id || 'mock-user-id';
    
    const status = await this.kycService.getUserVerificationStatus(userId);
    const requirements = await this.kycService.getVerificationRequirements(userId);
    
    return {
      userId,
      currentStatus: status.status,
      kycLevel: status.kycLevel,
      lastUpdated: status.lastUpdated,
      pendingDocuments: requirements.pendingDocuments,
      canReceiveFunds: status.status === 'VERIFIED',
      verificationExpiry: status.verificationExpiry,
      rejectionReason: status.rejectionReason,
    };
  }

  /**
   * POST /verification/start
   * 
   * Inicia un nuevo proceso de verificación KYC.
   * Puede ser disparado manualmente o automáticamente por:
   * - Solicitud de retiro
   * - Pago de premio
   * - Umbral de ganancias alcanzado
   * - Creación de causa propia
   */
  @Post('verification/start')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async startVerification(
    @Request() req: any,
    @Body() dto: StartVerificationDto,
  ): Promise<VerificationSessionResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    
    // Validar tipo de trigger
    const validTriggers = Object.values(TriggerType);
    if (dto.triggerType && !validTriggers.includes(dto.triggerType as TriggerType)) {
      throw new BadRequestException(
        `Tipo de trigger inválido. Valores permitidos: ${validTriggers.join(', ')}`
      );
    }
    
    const session = await this.kycService.startVerification(
      userId,
      dto.kycLevel as KycLevel,
      dto.triggerType as TriggerType,
      dto.triggerReference,
    );
    
    return {
      sessionId: session.sessionId,
      status: session.status,
      kycLevel: session.kycLevel,
      requiredDocuments: session.requiredDocuments,
      expiresAt: session.expiresAt,
      providerSessionUrl: session.providerSessionUrl,
      instructions: this.getVerificationInstructions(session.kycLevel),
    };
  }

  /**
   * POST /verification/upload-document
   * 
   * Sube un documento de identidad para verificación.
   * Documentos aceptados: DNI, Pasaporte, Licencia de conducir.
   * 
   * IMPORTANTE: Este endpoint recibe la URL del documento ya subido
   * a un servicio de almacenamiento (S3, etc.). No recibe el archivo directamente.
   */
  @Post('verification/upload-document')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async uploadDocument(
    @Request() req: any,
    @Body() dto: UploadDocumentDto,
  ): Promise<{ success: boolean; message: string; documentId: string }> {
    const userId = req.user?.id || 'mock-user-id';
    
    const result = await this.kycService.uploadDocument(
      userId,
      dto.sessionId,
      dto.documentType,
      dto.documentUrl,
      dto.documentSide,
    );
    
    return {
      success: result.success,
      message: result.message,
      documentId: result.documentId,
    };
  }

  /**
   * POST /verification/upload-selfie
   * 
   * Sube selfie para verificación facial.
   * Usado para comparar con el documento de identidad.
   */
  @Post('verification/upload-selfie')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async uploadSelfie(
    @Request() req: any,
    @Body() dto: UploadSelfieDto,
  ): Promise<{ success: boolean; message: string; selfieId: string }> {
    const userId = req.user?.id || 'mock-user-id';
    
    const result = await this.kycService.uploadSelfie(
      userId,
      dto.sessionId,
      dto.selfieUrl,
      dto.livenessCheckPassed,
    );
    
    return {
      success: result.success,
      message: result.message,
      selfieId: result.selfieId,
    };
  }

  /**
   * GET /verification/session/:id
   * 
   * Obtiene el estado detallado de una sesión de verificación específica.
   */
  @Get('verification/session/:id')
  @UseGuards(MockAuthGuard)
  async getVerificationSession(
    @Request() req: any,
    @Param('id') sessionId: string,
  ): Promise<VerificationSessionResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    
    // El service debe validar que la sesión pertenece al usuario
    const session = await this.kycService.getVerificationSession(userId, sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión de verificación no encontrada');
    }
    
    return {
      sessionId: session.sessionId,
      status: session.status,
      kycLevel: session.kycLevel,
      requiredDocuments: session.requiredDocuments,
      uploadedDocuments: session.uploadedDocuments,
      expiresAt: session.expiresAt,
      providerSessionUrl: session.providerSessionUrl,
      instructions: this.getVerificationInstructions(session.kycLevel),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  // ==========================================================================
  // ENDPOINTS DE FONDOS - /funds/*
  // ==========================================================================

  /**
   * GET /funds/balance
   * 
   * Obtiene el balance de fondos del usuario.
   * Incluye fondos disponibles, retenidos y pendientes.
   */
  @Get('funds/balance')
  @UseGuards(MockAuthGuard)
  async getFundBalance(
    @Request() req: any,
  ): Promise<FundBalanceResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    
    const balance = await this.kycService.getUserFundBalance(userId);
    
    return {
      userId,
      availableBalance: balance.available,
      heldBalance: balance.held,
      pendingBalance: balance.pending,
      totalEarnings: balance.totalEarnings,
      totalWithdrawn: balance.totalWithdrawn,
      currency: 'EUR',
      lastUpdated: balance.lastUpdated,
      verificationRequired: balance.verificationRequired,
      verificationRequiredReason: balance.verificationRequiredReason,
    };
  }

  /**
   * GET /funds/history
   * 
   * Obtiene el historial de movimientos de fondos.
   * Incluye premios recibidos, retiros, y cambios de estado.
   */
  @Get('funds/history')
  @UseGuards(MockAuthGuard)
  async getFundHistory(
    @Request() req: any,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: string,
    @Query('type') type?: string,
  ): Promise<FundHistoryResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    
    const history = await this.kycService.getUserFundHistory(
      userId,
      pageNum,
      limitNum,
      status,
      type,
    );
    
    return {
      userId,
      transactions: history.transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: history.total,
        totalPages: Math.ceil(history.total / limitNum),
      },
    };
  }

  /**
   * POST /funds/request-withdrawal
   * 
   * Solicita un retiro de fondos.
   * 
   * REGLA CRÍTICA: Si el usuario no está verificado (KYC),
   * los fondos quedan en estado PENDING_VERIFICATION y se
   * inicia automáticamente el proceso de KYC.
   */
  @Post('funds/request-withdrawal')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async requestWithdrawal(
    @Request() req: any,
    @Body() dto: WithdrawalRequestDto,
  ): Promise<{
    success: boolean;
    withdrawalId: string;
    status: string;
    message: string;
    requiresVerification: boolean;
    verificationSessionId?: string;
  }> {
    const userId = req.user?.id || 'mock-user-id';
    
    // Validar monto mínimo
    if (dto.amount < 1) {
      throw new BadRequestException('El monto mínimo de retiro es 1 EUR');
    }
    
    // Verificar si requiere KYC
    const verificationCheck = await this.kycService.checkIfVerificationRequired(
      userId,
      TriggerType.WITHDRAWAL_REQUEST,
      dto.amount,
    );
    
    if (verificationCheck.required && !verificationCheck.isVerified) {
      // Iniciar proceso de KYC automáticamente
      const session = await this.kycService.startVerification(
        userId,
        verificationCheck.requiredLevel,
        TriggerType.WITHDRAWAL_REQUEST,
        `withdrawal-request-${Date.now()}`,
      );
      
      // Crear solicitud de retiro en estado pendiente
      const withdrawal = await this.kycService.createPendingWithdrawal(
        userId,
        dto.amount,
        dto.paymentMethod,
        dto.paymentDetails,
        session.sessionId,
      );
      
      return {
        success: true,
        withdrawalId: withdrawal.id,
        status: 'PENDING_VERIFICATION',
        message: 'Retiro pendiente de verificación KYC. Complete el proceso de verificación para procesar su retiro.',
        requiresVerification: true,
        verificationSessionId: session.sessionId,
      };
    }
    
    // Usuario ya verificado - procesar retiro
    const withdrawal = await this.kycService.processWithdrawalRequest(
      userId,
      dto.amount,
      dto.paymentMethod,
      dto.paymentDetails,
    );
    
    return {
      success: true,
      withdrawalId: withdrawal.id,
      status: withdrawal.status,
      message: 'Solicitud de retiro procesada correctamente',
      requiresVerification: false,
    };
  }

  /**
   * GET /funds/requirements
   * 
   * Obtiene los requisitos para poder retirar fondos.
   * Indica qué documentos faltan y el nivel de KYC requerido.
   */
  @Get('funds/requirements')
  @UseGuards(MockAuthGuard)
  async getWithdrawalRequirements(
    @Request() req: any,
    @Query('amount') amount?: string,
  ): Promise<WithdrawalRequirementsResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const requestedAmount = amount ? parseFloat(amount) : undefined;
    
    const requirements = await this.kycService.getVerificationRequirements(userId);
    const status = await this.kycService.getUserVerificationStatus(userId);
    
    // Determinar nivel requerido según monto
    let requiredLevel = KycLevel.LEVEL_1;
    if (requestedAmount && requestedAmount > 500) {
      requiredLevel = KycLevel.LEVEL_2;
    }
    
    const canWithdraw = 
      status.status === 'VERIFIED' && 
      this.kycLevelSufficient(status.kycLevel, requiredLevel);
    
    return {
      userId,
      currentKycLevel: status.kycLevel,
      requiredKycLevel: requiredLevel,
      isVerified: status.status === 'VERIFIED',
      canWithdraw,
      pendingDocuments: requirements.pendingDocuments,
      minimumWithdrawal: 1,
      maximumWithdrawal: this.getMaxWithdrawal(status.kycLevel),
      processingTime: '1-3 días hábiles',
      availablePaymentMethods: this.getAvailablePaymentMethods(status.kycLevel),
    };
  }

  // ==========================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================================================

  /**
   * Genera instrucciones de verificación según el nivel
   */
  private getVerificationInstructions(level: string): string[] {
    const baseInstructions = [
      'Asegúrese de que su documento sea legible y esté vigente',
      'La foto del documento debe mostrar las 4 esquinas claramente',
      'La selfie debe ser tomada en un lugar bien iluminado',
      'No use filtros ni edite las imágenes',
    ];
    
    if (level === KycLevel.LEVEL_2) {
      return [
        ...baseInstructions,
        'Para nivel 2, se requiere verificación adicional de domicilio',
        'Prepare un comprobante de domicilio reciente (menos de 3 meses)',
      ];
    }
    
    return baseInstructions;
  }

  /**
   * Verifica si el nivel KYC actual es suficiente para el requerido
   */
  private kycLevelSufficient(current: string, required: string): boolean {
    const levels = { 'LEVEL_1': 1, 'LEVEL_2': 2 };
    return (levels[current] || 0) >= (levels[required] || 1);
  }

  /**
   * Obtiene el monto máximo de retiro según nivel KYC
   */
  private getMaxWithdrawal(kycLevel: string): number {
    switch (kycLevel) {
      case KycLevel.LEVEL_2:
        return 50000;
      case KycLevel.LEVEL_1:
        return 5000;
      default:
        return 0;
    }
  }

  /**
   * Obtiene métodos de pago disponibles según nivel KYC
   */
  private getAvailablePaymentMethods(kycLevel: string): string[] {
    const basic = ['bank_transfer'];
    
    if (kycLevel === KycLevel.LEVEL_2) {
      return [...basic, 'paypal', 'wire_transfer'];
    }
    
    if (kycLevel === KycLevel.LEVEL_1) {
      return basic;
    }
    
    return [];
  }
}
