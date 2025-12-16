// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS Y REGLAS DE RETENCIÓN
// Servicio principal de gestión de fondos (Fund Ledger)
// REGLA: El dinero NUNCA está "libre" hasta que se cumplen TODAS las condiciones
// REGLA: El dinero SOLO puede avanzar hacia adelante, NUNCA retroceder

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  FundLedgerStatus,
  FundSourceType,
  FundActorType,
  FundAuditAction,
  VALID_FUND_TRANSITIONS,
  FUND_CONFIG,
  FUND_STATUS_MESSAGES,
  isValidFundTransition,
  isFinalState,
  isChecklistComplete,
  FundReleaseChecklist,
} from './fund-ledger.constants';
import {
  CreateFundLedgerDto,
  FundBalanceResponseDto,
  FundDetailResponseDto,
  ReleaseRequirementsDto,
  AdminVerifyChecklistDto,
} from './dto';

@Injectable()
export class FundLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // SECCIÓN 1: CREACIÓN Y CONSULTA DE FONDOS
  // ============================================

  /**
   * Crear nuevo registro en el ledger
   * DOC34: Todo dinero SIEMPRE nace RETENIDO (HELD)
   */
  async createFund(dto: CreateFundLedgerDto): Promise<FundDetailResponseDto> {
    // El dinero siempre nace en estado GENERATED y pasa inmediatamente a HELD
    const fund = await this.prisma.fundLedger.create({
      data: {
        userId: dto.userId,
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        amount: dto.amount,
        currency: dto.currency,
        status: FundLedgerStatus.HELD, // Estado por defecto
        previousStatus: FundLedgerStatus.GENERATED,
        releasedTo: dto.releasedTo,
      },
    });

    // Registrar en historial
    await this.logStatusChange(
      fund.id,
      FundLedgerStatus.GENERATED,
      FundLedgerStatus.HELD,
      dto.userId,
      FundActorType.SYSTEM,
      'Fondo creado y retenido automáticamente',
    );

    // Crear checklist vacío
    await this.prisma.fundReleaseChecklist.create({
      data: {
        fundId: fund.id,
        userVerified: false,
        causeValidated: false,
        prizeDelivered: null, // null = no aplica
        evidenceConfirmed: false,
        fraudCheckPassed: false,
        allPassed: false,
      },
    });

    return this.toDetailResponse(fund);
  }

  /**
   * Obtener balance por estados
   * DOC34 §15: GET /funds/balance
   */
  async getBalance(userId: string): Promise<FundBalanceResponseDto> {
    const funds = await this.prisma.fundLedger.groupBy({
      by: ['status'],
      where: { userId },
      _sum: { amount: true },
    });

    const statusTotals: Record<string, number> = {};
    let total = 0;

    for (const fund of funds) {
      const amount = Number(fund._sum.amount) || 0;
      statusTotals[fund.status] = amount;
      total += amount;
    }

    return {
      userId,
      generated: statusTotals[FundLedgerStatus.GENERATED] || 0,
      held: statusTotals[FundLedgerStatus.HELD] || 0,
      pendingVerification: statusTotals[FundLedgerStatus.PENDING_VERIFICATION] || 0,
      approved: statusTotals[FundLedgerStatus.APPROVED] || 0,
      released: statusTotals[FundLedgerStatus.RELEASED] || 0,
      blocked: statusTotals[FundLedgerStatus.BLOCKED] || 0,
      total,
      currency: 'EUR', // TODO: Soporte multi-moneda
    };
  }

  /**
   * Obtener historial completo (ledger)
   * DOC34 §15: GET /funds/ledger
   */
  async getLedger(userId: string, page = 1, limit = 20, status?: FundLedgerStatus) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      this.prisma.fundLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.fundLedger.count({ where }),
    ]);

    return {
      data: data.map(f => this.toDetailResponse(f)),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Obtener detalle de un fondo
   * DOC34 §15: GET /funds/:id
   */
  async getFundById(fundId: string, userId?: string): Promise<FundDetailResponseDto> {
    const fund = await this.prisma.fundLedger.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      throw new NotFoundException('Fondo no encontrado');
    }

    if (userId && fund.userId !== userId) {
      throw new ForbiddenException('No tiene acceso a este fondo');
    }

    return this.toDetailResponse(fund);
  }

  /**
   * Obtener historial de estados de un fondo
   * DOC34 §15: GET /funds/:id/history
   */
  async getFundHistory(fundId: string, userId?: string) {
    // Verificar acceso
    await this.getFundById(fundId, userId);

    return this.prisma.fundStatusHistory.findMany({
      where: { fundId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ============================================
  // SECCIÓN 2: SOLICITUDES DE LIBERACIÓN
  // ============================================

  /**
   * Solicitar liberación de un fondo
   * DOC34 §15: POST /funds/:id/request-release
   */
  async requestRelease(fundId: string, userId: string, notes?: string): Promise<{
    success: boolean;
    message: string;
    requirements?: ReleaseRequirementsDto;
  }> {
    const fund = await this.getFundById(fundId, userId);

    // Solo se puede solicitar liberación si está en HELD
    if (fund.status !== FundLedgerStatus.HELD) {
      throw new BadRequestException(
        `No se puede solicitar liberación en estado ${fund.status}. Estado requerido: ${FundLedgerStatus.HELD}`,
      );
    }

    // Transicionar a PENDING_VERIFICATION
    await this.transitionState(
      fundId,
      FundLedgerStatus.PENDING_VERIFICATION,
      userId,
      FundActorType.USER,
      notes || 'Solicitud de liberación por usuario',
    );

    // Obtener requisitos actuales
    const requirements = await this.getReleaseRequirements(fundId);

    return {
      success: true,
      message: FUND_STATUS_MESSAGES[FundLedgerStatus.PENDING_VERIFICATION],
      requirements,
    };
  }

  /**
   * Obtener requisitos para liberar un fondo
   * DOC34 §15: GET /funds/:id/release-requirements
   * DOC34 §12: Checklist antes de liberar
   */
  async getReleaseRequirements(fundId: string, userId?: string): Promise<ReleaseRequirementsDto> {
    const fund = await this.getFundById(fundId, userId);

    const checklist = await this.prisma.fundReleaseChecklist.findUnique({
      where: { fundId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist no encontrado para este fondo');
    }

    const missing: string[] = [];
    
    if (!checklist.userVerified) missing.push('Usuario no verificado (KYC requerido)');
    if (!checklist.causeValidated) missing.push('Causa no validada');
    if (checklist.prizeDelivered === false) missing.push('Premio no entregado');
    if (!checklist.evidenceConfirmed) missing.push('Evidencias no confirmadas');
    if (!checklist.fraudCheckPassed) missing.push('Verificación antifraude pendiente');

    const canRelease = fund.status === FundLedgerStatus.APPROVED && missing.length === 0;

    return {
      fundId,
      currentStatus: fund.status as FundLedgerStatus,
      checklist: {
        userVerified: checklist.userVerified,
        causeValidated: checklist.causeValidated,
        prizeDelivered: checklist.prizeDelivered,
        evidenceConfirmed: checklist.evidenceConfirmed,
        fraudCheckPassed: checklist.fraudCheckPassed,
      },
      canRelease,
      missing,
    };
  }

  // ============================================
  // SECCIÓN 3: TRANSICIÓN DE ESTADOS
  // ============================================

  /**
   * Transicionar estado de un fondo
   * DOC34 §5: El dinero SOLO puede avanzar, NUNCA retroceder
   * DOC34 §10: Cada cambio DEBE registrarse
   */
  async transitionState(
    fundId: string,
    newStatus: FundLedgerStatus,
    actorId: string,
    actorType: FundActorType,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const fund = await this.prisma.fundLedger.findUnique({
      where: { id: fundId },
    });

    if (!fund) {
      throw new NotFoundException('Fondo no encontrado');
    }

    const currentStatus = fund.status as FundLedgerStatus;

    // Validar transición permitida
    if (!isValidFundTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Transición no permitida de ${currentStatus} a ${newStatus}. ` +
        `Transiciones válidas desde ${currentStatus}: ${VALID_FUND_TRANSITIONS[currentStatus].join(', ') || 'ninguna'}`,
      );
    }

    // Actualizar estado
    await this.prisma.fundLedger.update({
      where: { id: fundId },
      data: {
        status: newStatus,
        previousStatus: currentStatus,
        ...(newStatus === FundLedgerStatus.APPROVED && { approvedAt: new Date(), approvedBy: actorId }),
        ...(newStatus === FundLedgerStatus.RELEASED && { releasedAt: new Date() }),
      },
    });

    // Registrar en historial (OBLIGATORIO - DOC34 §10)
    await this.logStatusChange(fundId, currentStatus, newStatus, actorId, actorType, reason, metadata);
  }

  // ============================================
  // SECCIÓN 4: OPERACIONES ADMIN
  // ============================================

  /**
   * Listar fondos pendientes de aprobación
   * DOC34 §15: GET /admin/funds/pending
   */
  async listPendingFunds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: FundLedgerStatus.PENDING_VERIFICATION };

    const [data, total] = await Promise.all([
      this.prisma.fundLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.fundLedger.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Listar fondos retenidos
   * DOC34 §15: GET /admin/funds/held
   */
  async listHeldFunds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { status: FundLedgerStatus.HELD };

    const [data, total] = await Promise.all([
      this.prisma.fundLedger.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.fundLedger.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  /**
   * Aprobar liberación (Admin)
   * DOC34 §15: POST /admin/funds/:id/approve
   */
  async adminApprove(fundId: string, adminId: string, notes?: string): Promise<void> {
    const fund = await this.getFundById(fundId);

    if (fund.status !== FundLedgerStatus.PENDING_VERIFICATION) {
      throw new BadRequestException(
        `Solo se pueden aprobar fondos en estado ${FundLedgerStatus.PENDING_VERIFICATION}`,
      );
    }

    // Verificar checklist completo
    const requirements = await this.getReleaseRequirements(fundId);
    if (requirements.missing.length > 0) {
      throw new BadRequestException(
        `No se puede aprobar. Requisitos faltantes: ${requirements.missing.join(', ')}`,
      );
    }

    await this.transitionState(
      fundId,
      FundLedgerStatus.APPROVED,
      adminId,
      FundActorType.ADMIN,
      notes || 'Aprobación manual por admin',
    );
  }

  /**
   * Ejecutar liberación (Admin)
   * DOC34 §15: POST /admin/funds/:id/release
   * DOC34 §12: Checklist OBLIGATORIO antes de liberar
   */
  async adminRelease(fundId: string, adminId: string, transactionRef?: string, notes?: string): Promise<void> {
    const fund = await this.getFundById(fundId);

    if (fund.status !== FundLedgerStatus.APPROVED) {
      throw new BadRequestException(
        `Solo se pueden liberar fondos en estado ${FundLedgerStatus.APPROVED}`,
      );
    }

    // Verificar checklist COMPLETO
    const requirements = await this.getReleaseRequirements(fundId);
    if (!requirements.canRelease) {
      throw new BadRequestException(
        `No se puede liberar. Requisitos faltantes: ${requirements.missing.join(', ')}`,
      );
    }

    // Actualizar con referencia de transacción
    if (transactionRef) {
      await this.prisma.fundLedger.update({
        where: { id: fundId },
        data: { transactionRef },
      });
    }

    await this.transitionState(
      fundId,
      FundLedgerStatus.RELEASED,
      adminId,
      FundActorType.ADMIN,
      notes || 'Liberación ejecutada por admin',
      { transactionRef },
    );
  }

  /**
   * Bloquear fondos (Admin)
   * DOC34 §15: POST /admin/funds/:id/block
   * DOC34 §11: Si hay DUDA, el dinero NO se libera
   */
  async adminBlock(fundId: string, adminId: string, reason: string, notes?: string): Promise<void> {
    const fund = await this.getFundById(fundId);

    // No se puede bloquear si ya está liberado
    if (fund.status === FundLedgerStatus.RELEASED) {
      throw new BadRequestException('No se pueden bloquear fondos ya liberados');
    }

    // Actualizar razón de bloqueo
    await this.prisma.fundLedger.update({
      where: { id: fundId },
      data: { blockedReason: reason },
    });

    await this.transitionState(
      fundId,
      FundLedgerStatus.BLOCKED,
      adminId,
      FundActorType.ADMIN,
      notes || reason,
      { blockReason: reason },
    );
  }

  /**
   * Desbloquear fondos (Admin con justificación)
   * DOC34 §6: Solo admin puede cambiar con justificación
   */
  async adminUnblock(fundId: string, adminId: string, reason: string, notes?: string): Promise<void> {
    const fund = await this.getFundById(fundId);

    if (fund.status !== FundLedgerStatus.BLOCKED) {
      throw new BadRequestException('Solo se pueden desbloquear fondos bloqueados');
    }

    // Volver a PENDING_VERIFICATION para revisión
    await this.transitionState(
      fundId,
      FundLedgerStatus.PENDING_VERIFICATION,
      adminId,
      FundActorType.ADMIN,
      `Desbloqueado: ${notes || reason}`,
      { unblockReason: reason },
    );

    // Limpiar razón de bloqueo
    await this.prisma.fundLedger.update({
      where: { id: fundId },
      data: { blockedReason: null },
    });
  }

  /**
   * Verificar checklist (Admin)
   * DOC34 §15: POST /admin/funds/:id/checklist/verify
   */
  async adminVerifyChecklist(
    fundId: string,
    adminId: string,
    dto: AdminVerifyChecklistDto,
  ): Promise<FundReleaseChecklist> {
    await this.getFundById(fundId);

    const allPassed = isChecklistComplete({
      userVerified: dto.userVerified,
      causeValidated: dto.causeValidated,
      prizeDelivered: dto.prizeDelivered ?? null,
      evidenceConfirmed: dto.evidenceConfirmed,
      fraudCheckPassed: dto.fraudCheckPassed,
    });

    const checklist = await this.prisma.fundReleaseChecklist.update({
      where: { fundId },
      data: {
        userVerified: dto.userVerified,
        causeValidated: dto.causeValidated,
        prizeDelivered: dto.prizeDelivered,
        evidenceConfirmed: dto.evidenceConfirmed,
        fraudCheckPassed: dto.fraudCheckPassed,
        allPassed,
        checkedAt: new Date(),
        checkedBy: adminId,
      },
    });

    // Registrar auditoría
    await this.logStatusChange(
      fundId,
      null,
      null,
      adminId,
      FundActorType.ADMIN,
      dto.notes || 'Checklist verificado por admin',
      { checklist: dto, allPassed },
    );

    return {
      userVerified: checklist.userVerified,
      causeValidated: checklist.causeValidated,
      prizeDelivered: checklist.prizeDelivered,
      evidenceConfirmed: checklist.evidenceConfirmed,
      fraudCheckPassed: checklist.fraudCheckPassed,
      allPassed: checklist.allPassed,
    };
  }

  /**
   * Obtener checklist de un fondo (Admin)
   * DOC34 §15: GET /admin/funds/:id/checklist
   */
  async getChecklist(fundId: string): Promise<FundReleaseChecklist> {
    const checklist = await this.prisma.fundReleaseChecklist.findUnique({
      where: { fundId },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist no encontrado');
    }

    return {
      userVerified: checklist.userVerified,
      causeValidated: checklist.causeValidated,
      prizeDelivered: checklist.prizeDelivered,
      evidenceConfirmed: checklist.evidenceConfirmed,
      fraudCheckPassed: checklist.fraudCheckPassed,
      allPassed: checklist.allPassed,
    };
  }

  // ============================================
  // HELPERS PRIVADOS
  // ============================================

  /**
   * Registrar cambio de estado en historial
   * DOC34 §10: OBLIGATORIO - Sin logs = ERROR GRAVE
   */
  private async logStatusChange(
    fundId: string,
    fromStatus: FundLedgerStatus | null,
    toStatus: FundLedgerStatus | null,
    actorId: string,
    actorType: FundActorType,
    reason: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.prisma.fundStatusHistory.create({
      data: {
        fundId,
        fromStatus: fromStatus || 'N/A',
        toStatus: toStatus || 'N/A',
        actorId,
        actorType,
        reason,
        metadata: metadata || {},
      },
    });
  }

  /**
   * Convertir entidad a DTO de respuesta
   */
  private toDetailResponse(fund: any): FundDetailResponseDto {
    return {
      id: fund.id,
      userId: fund.userId,
      sourceType: fund.sourceType as FundSourceType,
      sourceId: fund.sourceId,
      amount: Number(fund.amount),
      currency: fund.currency,
      status: fund.status as FundLedgerStatus,
      previousStatus: fund.previousStatus,
      heldReason: fund.heldReason,
      blockedReason: fund.blockedReason,
      approvedAt: fund.approvedAt,
      approvedBy: fund.approvedBy,
      releasedAt: fund.releasedAt,
      releasedTo: fund.releasedTo,
      transactionRef: fund.transactionRef,
      createdAt: fund.createdAt,
      updatedAt: fund.updatedAt,
      statusMessage: FUND_STATUS_MESSAGES[fund.status as FundLedgerStatus] || '',
    };
  }
}
