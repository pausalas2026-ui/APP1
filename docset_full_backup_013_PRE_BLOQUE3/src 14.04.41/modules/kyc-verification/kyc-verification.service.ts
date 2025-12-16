// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Servicio principal de verificación
// REGLA MADRE: NADIE recibe dinero sin verificación previa
// SIN integración real con proveedores - solo estructura

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  VerificationStatus,
  KycLevel,
  TriggerEvent,
  FundStatus,
  KycProvider,
  ActorType,
  KycAuditAction,
  KYC_CONFIG,
  KYC_MESSAGES,
  TRIGGER_REQUIRED_LEVEL,
  CAN_RECEIVE_MONEY,
  isValidFundTransition,
  canUserReceiveMoney,
} from './kyc-verification.constants';
import {
  StartVerificationDto,
  UploadDocumentDto,
  UploadSelfieDto,
  VerificationStatusResponseDto,
  RequestWithdrawalDto,
  FundsBalanceResponseDto,
  WithdrawalRequirementsDto,
} from './dto';

@Injectable()
export class KycVerificationService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SECCIÓN 1: VERIFICACIÓN DE USUARIO
  // ============================================

  /**
   * Obtener estado de verificación del usuario
   * DOC33 §4
   */
  async getVerificationStatus(userId: string): Promise<VerificationStatusResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const verification = await this.prisma.userVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const pendingFunds = await this.getPendingFundsAmount(userId);
    const status = (verification?.status as VerificationStatus) || VerificationStatus.NOT_VERIFIED;

    return {
      userId,
      status,
      level: verification?.level as KycLevel || null,
      canReceiveMoney: canUserReceiveMoney(status),
      verifiedAt: verification?.verifiedAt || null,
      expiresAt: verification?.expiresAt || null,
      attempts: verification?.attempts || 0,
      maxAttempts: KYC_CONFIG.MAX_VERIFICATION_ATTEMPTS,
      nextAttemptAllowedAt: this.calculateNextAttemptDate(verification),
      pendingFundsAmount: pendingFunds,
      message: this.getStatusMessage(status),
    };
  }

  /**
   * Verificar si se requiere KYC para una acción
   * DOC33 §5 - Eventos disparadores
   */
  async checkIfVerificationRequired(
    userId: string,
    action: TriggerEvent,
    amount?: number,
  ): Promise<{ required: boolean; level: KycLevel; reason: string }> {
    const verification = await this.prisma.userVerification.findFirst({
      where: { userId, status: VerificationStatus.VERIFIED },
    });

    // Si ya está verificado al nivel requerido, no se requiere
    const requiredLevel = TRIGGER_REQUIRED_LEVEL[action];
    if (verification?.status === VerificationStatus.VERIFIED) {
      if (verification.level === KycLevel.LEVEL_2 || 
          (verification.level === KycLevel.LEVEL_1 && requiredLevel === KycLevel.LEVEL_1)) {
        return { required: false, level: requiredLevel, reason: 'Usuario ya verificado' };
      }
    }

    // Verificar por evento
    switch (action) {
      case TriggerEvent.WITHDRAWAL_REQUEST:
      case TriggerEvent.PRIZE_PAYMENT:
      case TriggerEvent.FIRST_TIME_MONEY:
        return {
          required: true,
          level: KycLevel.LEVEL_1,
          reason: KYC_MESSAGES.WITHDRAWAL_REQUEST,
        };

      case TriggerEvent.THRESHOLD_REACHED:
        const pendingFunds = await this.getPendingFundsAmount(userId);
        if (pendingFunds >= KYC_CONFIG.THRESHOLD_AMOUNT) {
          return {
            required: true,
            level: KycLevel.LEVEL_2,
            reason: `Monto acumulado (${pendingFunds}) supera umbral de ${KYC_CONFIG.THRESHOLD_AMOUNT}`,
          };
        }
        break;

      case TriggerEvent.CAUSE_CREATION:
        return {
          required: true,
          level: KycLevel.LEVEL_2,
          reason: 'Creación de causa propia requiere verificación reforzada',
        };

      case TriggerEvent.HIGH_VALUE_PRIZE:
        if (amount && amount >= KYC_CONFIG.HIGH_VALUE_PRIZE_THRESHOLD) {
          return {
            required: true,
            level: KycLevel.LEVEL_2,
            reason: `Premio de alto valor (${amount}) requiere verificación reforzada`,
          };
        }
        break;
    }

    return { required: false, level: KycLevel.LEVEL_1, reason: 'No se requiere verificación' };
  }

  /**
   * Iniciar proceso de verificación KYC
   * DOC33 §5, §6
   */
  async startVerification(userId: string, dto: StartVerificationDto): Promise<{
    verificationId: string;
    sessionId: string;
    level: KycLevel;
    message: string;
  }> {
    // Verificar si puede iniciar (máximo intentos)
    const existingAttempts = await this.prisma.userVerification.count({
      where: { userId },
    });

    if (existingAttempts >= KYC_CONFIG.MAX_VERIFICATION_ATTEMPTS) {
      throw new BadRequestException(
        `Has alcanzado el máximo de intentos (${KYC_CONFIG.MAX_VERIFICATION_ATTEMPTS}). Contacta soporte.`
      );
    }

    // Verificar si hay una verificación pendiente
    const pendingVerification = await this.prisma.userVerification.findFirst({
      where: { userId, status: VerificationStatus.VERIFICATION_PENDING },
    });

    if (pendingVerification) {
      throw new BadRequestException('Ya tienes una verificación en proceso');
    }

    const level = dto.level || KycLevel.LEVEL_1;

    // NOTA: En producción, aquí se integraría con el proveedor KYC real
    // Por ahora, solo creamos el registro en BD
    const sessionId = `session_${Date.now()}_${userId.slice(0, 8)}`;

    const verification = await this.prisma.userVerification.create({
      data: {
        userId,
        status: VerificationStatus.VERIFICATION_PENDING,
        level,
        provider: KycProvider.MANUAL, // Sin proveedor real
        providerSessionId: sessionId,
        attempts: existingAttempts + 1,
        lastAttemptAt: new Date(),
      },
    });

    // Registrar trigger si existe
    if (dto.triggerEvent) {
      await this.prisma.verificationTrigger.create({
        data: {
          userId,
          triggerType: dto.triggerEvent,
          triggerSourceId: dto.triggerSourceId,
          verificationRequiredLevel: level,
        },
      });
    }

    // Auditoría
    await this.logAudit(userId, KycAuditAction.KYC_STARTED, null, VerificationStatus.VERIFICATION_PENDING, {
      level,
      sessionId,
      triggerEvent: dto.triggerEvent,
    });

    return {
      verificationId: verification.id,
      sessionId,
      level,
      message: KYC_MESSAGES.KYC_IN_PROGRESS,
    };
  }

  /**
   * Subir documento de verificación
   * DOC33 §6
   */
  async uploadDocument(userId: string, verificationId: string, dto: UploadDocumentDto): Promise<void> {
    const verification = await this.getActiveVerification(userId, verificationId);

    // NOTA: En producción, aquí se enviaría el documento al proveedor KYC
    // Por ahora, solo registramos en metadata
    await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        documentType: dto.documentType,
        documentCountry: dto.documentCountry,
        providerResponse: {
          documentFrontUrl: dto.documentFrontUrl,
          documentBackUrl: dto.documentBackUrl,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    await this.logAudit(userId, KycAuditAction.DOCUMENT_UPLOADED, null, null, {
      documentType: dto.documentType,
      documentCountry: dto.documentCountry,
    });
  }

  /**
   * Subir selfie/prueba de vida
   * DOC33 §6
   */
  async uploadSelfie(userId: string, verificationId: string, dto: UploadSelfieDto): Promise<void> {
    await this.getActiveVerification(userId, verificationId);

    // NOTA: En producción, aquí se enviaría el selfie al proveedor KYC
    await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        providerResponse: {
          selfieUrl: dto.selfieUrl,
          livenessVideoUrl: dto.livenessVideoUrl,
          selfieUploadedAt: new Date().toISOString(),
        },
      },
    });

    await this.logAudit(userId, KycAuditAction.SELFIE_UPLOADED, null, null, {
      hasSelfie: true,
      hasLivenessVideo: !!dto.livenessVideoUrl,
    });
  }

  // ============================================
  // SECCIÓN 2: GESTIÓN DE FONDOS
  // ============================================

  /**
   * Obtener balance de fondos del usuario
   * DOC33 §12
   */
  async getFundsBalance(userId: string): Promise<FundsBalanceResponseDto> {
    const funds = await this.prisma.fundState.findMany({
      where: { userId },
    });

    const available = funds
      .filter(f => f.status === FundStatus.APPROVED)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const held = funds
      .filter(f => f.status === FundStatus.HELD)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const pendingVerification = funds
      .filter(f => f.status === FundStatus.PENDING_VERIFICATION)
      .reduce((sum, f) => sum + Number(f.amount), 0);

    const verification = await this.getVerificationStatus(userId);
    const requirements = await this.getWithdrawalRequirements(userId);

    return {
      available,
      held,
      pendingVerification,
      total: available + held + pendingVerification,
      currency: 'EUR', // Por defecto
      canWithdraw: verification.canReceiveMoney && available > 0,
      withdrawalRequirements: requirements.missingRequirements,
    };
  }

  /**
   * Obtener requisitos para liberar fondos
   * DOC33 §13 - Checklist obligatorio
   */
  async getWithdrawalRequirements(userId: string, sourceId?: string): Promise<WithdrawalRequirementsDto> {
    const verification = await this.prisma.userVerification.findFirst({
      where: { userId, status: VerificationStatus.VERIFIED },
    });

    const requirements: WithdrawalRequirementsDto = {
      userVerified: verification?.status === VerificationStatus.VERIFIED,
      prizeDelivered: true, // Por defecto - se verificaría si hay prize delivery asociado
      evidenceUploaded: true, // Por defecto
      winnerConfirmed: true, // Por defecto
      causeVerified: true, // Por defecto - se verificaría si es causa propia
      noFraudFlags: true, // Por defecto - se verificaría con sistema antifraude
      allRequirementsMet: false,
      missingRequirements: [],
    };

    // Construir lista de requisitos faltantes
    if (!requirements.userVerified) {
      requirements.missingRequirements.push('Usuario no verificado (KYC requerido)');
    }
    if (!requirements.prizeDelivered) {
      requirements.missingRequirements.push('Premio no entregado');
    }
    if (!requirements.evidenceUploaded) {
      requirements.missingRequirements.push('Evidencia de entrega no subida');
    }
    if (!requirements.winnerConfirmed) {
      requirements.missingRequirements.push('Ganador no confirmado');
    }
    if (!requirements.causeVerified) {
      requirements.missingRequirements.push('Causa no verificada');
    }
    if (!requirements.noFraudFlags) {
      requirements.missingRequirements.push('Señales de fraude detectadas');
    }

    requirements.allRequirementsMet = requirements.missingRequirements.length === 0;

    return requirements;
  }

  /**
   * Solicitar retiro de fondos
   * DOC33 §13
   */
  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto): Promise<{
    success: boolean;
    fundId?: string;
    message: string;
    requirements?: WithdrawalRequirementsDto;
  }> {
    // Verificar requisitos
    const requirements = await this.getWithdrawalRequirements(userId, dto.sourceId);

    if (!requirements.allRequirementsMet) {
      return {
        success: false,
        message: 'No se cumplen todos los requisitos para liberar fondos',
        requirements,
      };
    }

    // Buscar fondo disponible
    const fund = await this.prisma.fundState.findFirst({
      where: {
        userId,
        sourceId: dto.sourceId,
        status: FundStatus.APPROVED,
      },
    });

    if (!fund) {
      throw new NotFoundException('No hay fondos aprobados para este recurso');
    }

    if (Number(fund.amount) < dto.amount) {
      throw new BadRequestException('Monto solicitado supera el disponible');
    }

    // NOTA: En producción, aquí se iniciaría la transferencia real
    // Por ahora, solo actualizamos el estado
    const updatedFund = await this.prisma.fundState.update({
      where: { id: fund.id },
      data: {
        status: FundStatus.RELEASED,
        releasedAt: new Date(),
        releasedTo: dto.bankAccount || 'pending_bank_info',
      },
    });

    await this.logAudit(userId, KycAuditAction.FUND_RELEASED, FundStatus.APPROVED, FundStatus.RELEASED, {
      fundId: fund.id,
      amount: dto.amount,
      currency: dto.currency,
    });

    return {
      success: true,
      fundId: updatedFund.id,
      message: 'Solicitud de retiro procesada. Fondos marcados como liberados.',
    };
  }

  // ============================================
  // SECCIÓN 3: ADMIN
  // ============================================

  /**
   * Obtener verificaciones pendientes de revisión
   */
  async getPendingVerifications(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [verifications, total] = await Promise.all([
      this.prisma.userVerification.findMany({
        where: {
          status: VerificationStatus.VERIFICATION_PENDING,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.userVerification.count({
        where: {
          status: VerificationStatus.VERIFICATION_PENDING,
        },
      }),
    ]);

    return {
      data: verifications,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Aprobar verificación manualmente (Admin)
   * DOC33 §7 Nivel 2
   */
  async adminApproveVerification(
    verificationId: string,
    adminId: string,
    notes?: string,
  ): Promise<void> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verificación no encontrada');
    }

    if (verification.status !== VerificationStatus.VERIFICATION_PENDING) {
      throw new BadRequestException('Solo se pueden aprobar verificaciones pendientes');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + KYC_CONFIG.VERIFICATION_EXPIRY_DAYS);

    await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        expiresAt,
        reviewerNotes: notes,
      },
    });

    // Procesar fondos pendientes del usuario
    await this.processUserPendingFunds(verification.userId);

    await this.logAudit(
      verification.userId,
      KycAuditAction.MANUAL_APPROVAL,
      VerificationStatus.VERIFICATION_PENDING,
      VerificationStatus.VERIFIED,
      { adminId, notes },
      adminId,
      ActorType.ADMIN,
    );
  }

  /**
   * Rechazar verificación (Admin)
   */
  async adminRejectVerification(
    verificationId: string,
    adminId: string,
    rejectionReason: string,
    notes?: string,
  ): Promise<void> {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verificación no encontrada');
    }

    if (verification.status !== VerificationStatus.VERIFICATION_PENDING) {
      throw new BadRequestException('Solo se pueden rechazar verificaciones pendientes');
    }

    await this.prisma.userVerification.update({
      where: { id: verificationId },
      data: {
        status: VerificationStatus.VERIFICATION_REJECTED,
        rejectionReason,
        reviewerNotes: notes,
      },
    });

    await this.logAudit(
      verification.userId,
      KycAuditAction.MANUAL_REJECTION,
      VerificationStatus.VERIFICATION_PENDING,
      VerificationStatus.VERIFICATION_REJECTED,
      { adminId, rejectionReason, notes },
      adminId,
      ActorType.ADMIN,
    );
  }

  /**
   * Liberar fondos manualmente (Admin)
   */
  async adminReleaseFunds(fundId: string, adminId: string, notes?: string): Promise<void> {
    const fund = await this.prisma.fundState.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      throw new NotFoundException('Fondo no encontrado');
    }

    if (fund.status !== FundStatus.APPROVED) {
      throw new BadRequestException('Solo se pueden liberar fondos aprobados');
    }

    await this.prisma.fundState.update({
      where: { id: fundId },
      data: {
        status: FundStatus.RELEASED,
        releasedAt: new Date(),
      },
    });

    await this.logAudit(
      fund.userId,
      KycAuditAction.FUND_RELEASED,
      FundStatus.APPROVED,
      FundStatus.RELEASED,
      { adminId, fundId, notes },
      adminId,
      ActorType.ADMIN,
    );
  }

  /**
   * Bloquear fondos (Admin)
   */
  async adminBlockFunds(fundId: string, adminId: string, blockReason: string): Promise<void> {
    const fund = await this.prisma.fundState.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      throw new NotFoundException('Fondo no encontrado');
    }

    await this.prisma.fundState.update({
      where: { id: fundId },
      data: {
        status: FundStatus.BLOCKED,
        heldReason: blockReason,
      },
    });

    await this.logAudit(
      fund.userId,
      KycAuditAction.FUND_BLOCKED,
      fund.status as FundStatus,
      FundStatus.BLOCKED,
      { adminId, fundId, blockReason },
      adminId,
      ActorType.ADMIN,
    );
  }

  /**
   * Listar verificaciones pendientes (Admin)
   * Alias para compatibilidad con controller
   */
  async listPendingVerifications(page = 1, limit = 20, level?: string) {
    const skip = (page - 1) * limit;
    const where: any = { status: VerificationStatus.VERIFICATION_PENDING };
    if (level) {
      where.level = level;
    }

    const [data, total] = await Promise.all([
      this.prisma.userVerification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.userVerification.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Obtener detalles de verificación (Admin)
   */
  async getVerificationDetails(verificationId: string) {
    const verification = await this.prisma.userVerification.findUnique({
      where: { id: verificationId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (!verification) {
      throw new NotFoundException('Verificación no encontrada');
    }
    return verification;
  }

  /**
   * Estadísticas de verificación (Admin)
   */
  async getVerificationStats() {
    const [pending, verified, rejected, expired] = await Promise.all([
      this.prisma.userVerification.count({ where: { status: VerificationStatus.VERIFICATION_PENDING } }),
      this.prisma.userVerification.count({ where: { status: VerificationStatus.VERIFIED } }),
      this.prisma.userVerification.count({ where: { status: VerificationStatus.VERIFICATION_REJECTED } }),
      this.prisma.userVerification.count({ where: { status: VerificationStatus.VERIFICATION_EXPIRED } }),
    ]);
    return { pending, verified, rejected, expired, total: pending + verified + rejected + expired };
  }

  /**
   * Listar fondos pendientes (Admin)
   */
  async listPendingFunds(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { in: [FundStatus.HELD, FundStatus.PENDING_VERIFICATION, FundStatus.APPROVED] };
    }

    const [data, total] = await Promise.all([
      this.prisma.fundState.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fundState.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Obtener detalles de fondo (Admin)
   */
  async getFundDetails(fundId: string) {
    const fund = await this.prisma.fundState.findUnique({
      where: { id: fundId },
    });
    if (!fund) {
      throw new NotFoundException('Fondo no encontrado');
    }
    return fund;
  }

  /**
   * Historial de fondos del usuario
   */
  async getFundsHistory(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.fundState.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fundState.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Historial de auditoría de fondos (Admin)
   */
  async getFundAuditHistory(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.kycAuditLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.kycAuditLog.count({ where: { userId } }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  private async getActiveVerification(userId: string, verificationId: string) {
    const verification = await this.prisma.userVerification.findFirst({
      where: {
        id: verificationId,
        userId,
        status: VerificationStatus.VERIFICATION_PENDING,
      },
    });

    if (!verification) {
      throw new NotFoundException('Verificación activa no encontrada');
    }

    return verification;
  }

  private async getPendingFundsAmount(userId: string): Promise<number> {
    const funds = await this.prisma.fundState.findMany({
      where: {
        userId,
        status: { in: [FundStatus.HELD, FundStatus.PENDING_VERIFICATION] },
      },
    });

    return funds.reduce((sum, f) => sum + Number(f.amount), 0);
  }

  private async processUserPendingFunds(userId: string): Promise<void> {
    // Mover fondos de PENDING_VERIFICATION a APPROVED
    await this.prisma.fundState.updateMany({
      where: {
        userId,
        status: FundStatus.PENDING_VERIFICATION,
      },
      data: {
        status: FundStatus.APPROVED,
      },
    });
  }

  private calculateNextAttemptDate(verification: any): Date | null {
    if (!verification || verification.status !== VerificationStatus.VERIFICATION_REJECTED) {
      return null;
    }

    const nextDate = new Date(verification.lastAttemptAt);
    nextDate.setDate(nextDate.getDate() + KYC_CONFIG.RETRY_AFTER_REJECTION_DAYS);
    return nextDate;
  }

  private getStatusMessage(status: VerificationStatus): string {
    switch (status) {
      case VerificationStatus.NOT_VERIFIED:
        return KYC_MESSAGES.GENERATED_FUNDS;
      case VerificationStatus.VERIFICATION_PENDING:
        return KYC_MESSAGES.KYC_IN_PROGRESS;
      case VerificationStatus.VERIFIED:
        return KYC_MESSAGES.KYC_APPROVED;
      case VerificationStatus.VERIFICATION_REJECTED:
        return KYC_MESSAGES.KYC_REJECTED.replace('{days}', String(KYC_CONFIG.RETRY_AFTER_REJECTION_DAYS));
      case VerificationStatus.VERIFICATION_EXPIRED:
        return KYC_MESSAGES.KYC_EXPIRED;
      default:
        return '';
    }
  }

  private async logAudit(
    userId: string,
    action: KycAuditAction,
    previousStatus: string | null,
    newStatus: string | null,
    metadata?: Record<string, any>,
    actorId?: string,
    actorType: ActorType = ActorType.SYSTEM,
  ): Promise<void> {
    await this.prisma.kycAuditLog.create({
      data: {
        userId,
        action,
        previousStatus,
        newStatus,
        actorId: actorId || userId,
        actorType,
        metadata: metadata || {},
      },
    });
  }
}
