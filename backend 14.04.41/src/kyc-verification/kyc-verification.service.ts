/**
 * KYC Verification Service
 * 
 * DOCUMENTO 33 - Sistema de Verificación KYC
 * ==========================================
 * 
 * REGLA FUNDAMENTAL: "NADIE recibe dinero sin verificación previa"
 * 
 * Este servicio maneja toda la lógica de verificación de identidad:
 * - Inicio de sesiones de verificación
 * - Gestión de documentos y selfies
 * - Estados de verificación y fondos
 * - Integración con proveedores KYC (mock en desarrollo)
 * 
 * Estados de fondos:
 * GENERATED → HELD → PENDING_VERIFICATION → APPROVED → RELEASED
 *                                        ↓
 *                                   REJECTED → BLOCKED
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  VerificationStatus,
  KycLevel,
  TriggerType,
  FundStatus,
  DocumentType,
  KYC_THRESHOLD_AMOUNT,
  HIGH_VALUE_PRIZE_THRESHOLD,
  VERIFICATION_EXPIRY_DAYS,
} from './kyc-verification.constants';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface VerificationSession {
  sessionId: string;
  userId: string;
  status: string;
  kycLevel: string;
  triggerType: string;
  triggerReference?: string;
  requiredDocuments: string[];
  uploadedDocuments?: UploadedDocument[];
  expiresAt: Date;
  providerSessionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UploadedDocument {
  documentId: string;
  type: string;
  side?: string;
  uploadedAt: Date;
  status: string;
}

interface UserVerificationStatus {
  userId: string;
  status: string;
  kycLevel: string;
  lastUpdated: Date;
  verificationExpiry?: Date;
  rejectionReason?: string;
}

interface VerificationRequirements {
  pendingDocuments: string[];
  requiredLevel: string;
  instructions: string[];
}

interface FundBalance {
  available: number;
  held: number;
  pending: number;
  totalEarnings: number;
  totalWithdrawn: number;
  lastUpdated: Date;
  verificationRequired: boolean;
  verificationRequiredReason?: string;
}

interface FundTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: Date;
  reference?: string;
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentDetails: Record<string, any>;
  verificationSessionId?: string;
  createdAt: Date;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class KycVerificationService {
  private readonly logger = new Logger(KycVerificationService.name);
  
  // Almacenamiento en memoria para desarrollo (sin Prisma real todavía)
  private verificationSessions: Map<string, VerificationSession> = new Map();
  private userVerifications: Map<string, UserVerificationStatus> = new Map();
  private userFunds: Map<string, FundBalance> = new Map();
  private fundTransactions: Map<string, FundTransaction[]> = new Map();
  private withdrawals: Map<string, Withdrawal> = new Map();
  private uploadedDocuments: Map<string, UploadedDocument[]> = new Map();

  constructor(private prisma: PrismaService) {}

  // ==========================================================================
  // VERIFICACIÓN DE REQUISITOS
  // ==========================================================================

  /**
   * Verifica si un usuario requiere KYC para una acción específica
   * 
   * REGLA: La verificación es obligatoria para:
   * - Retiros de cualquier monto
   * - Premios mayores a HIGH_VALUE_PRIZE_THRESHOLD (500€)
   * - Ganancias acumuladas mayores a KYC_THRESHOLD_AMOUNT (1000€)
   * - Creación de causas propias
   */
  async checkIfVerificationRequired(
    userId: string,
    triggerType: TriggerType,
    amount?: number,
  ): Promise<{
    required: boolean;
    requiredLevel: KycLevel;
    isVerified: boolean;
    reason?: string;
  }> {
    const userStatus = this.userVerifications.get(userId);
    const isVerified = userStatus?.status === VerificationStatus.VERIFIED;
    const currentLevel = userStatus?.kycLevel || null;
    
    // Determinar si se requiere verificación y qué nivel
    let required = false;
    let requiredLevel = KycLevel.LEVEL_1;
    let reason: string | undefined;
    
    switch (triggerType) {
      case TriggerType.WITHDRAWAL_REQUEST:
        // Siempre requiere verificación para retiros
        required = true;
        requiredLevel = amount && amount > 500 ? KycLevel.LEVEL_2 : KycLevel.LEVEL_1;
        reason = 'Los retiros requieren verificación de identidad';
        break;
        
      case TriggerType.PRIZE_PAYMENT:
        // Premios altos requieren verificación
        if (amount && amount > HIGH_VALUE_PRIZE_THRESHOLD) {
          required = true;
          requiredLevel = KycLevel.LEVEL_1;
          reason = `Premios mayores a ${HIGH_VALUE_PRIZE_THRESHOLD}€ requieren verificación`;
        }
        break;
        
      case TriggerType.THRESHOLD_REACHED:
        // Umbral de ganancias alcanzado
        const totalEarnings = this.userFunds.get(userId)?.totalEarnings || 0;
        if (totalEarnings >= KYC_THRESHOLD_AMOUNT) {
          required = true;
          requiredLevel = KycLevel.LEVEL_1;
          reason = `Ha alcanzado el umbral de ${KYC_THRESHOLD_AMOUNT}€ en ganancias`;
        }
        break;
        
      case TriggerType.CAUSE_CREATION:
        // Crear causas propias requiere nivel 2
        required = true;
        requiredLevel = KycLevel.LEVEL_2;
        reason = 'Crear causas propias requiere verificación nivel 2';
        break;
        
      case TriggerType.HIGH_VALUE_PRIZE:
        // Premios de muy alto valor
        required = true;
        requiredLevel = KycLevel.LEVEL_2;
        reason = 'Premios de alto valor requieren verificación nivel 2';
        break;
    }
    
    // Si ya está verificado, comprobar si el nivel es suficiente
    if (isVerified && currentLevel) {
      const levelSufficient = this.isLevelSufficient(currentLevel as KycLevel, requiredLevel);
      if (levelSufficient) {
        return { required, requiredLevel, isVerified: true, reason };
      }
    }
    
    return { required, requiredLevel, isVerified, reason };
  }

  // ==========================================================================
  // GESTIÓN DE SESIONES DE VERIFICACIÓN
  // ==========================================================================

  /**
   * Inicia una nueva sesión de verificación KYC
   */
  async startVerification(
    userId: string,
    kycLevel: KycLevel,
    triggerType: TriggerType,
    triggerReference?: string,
  ): Promise<VerificationSession> {
    // Verificar si ya hay una sesión activa
    const existingSession = Array.from(this.verificationSessions.values())
      .find(s => 
        s.userId === userId && 
        s.status === VerificationStatus.PENDING &&
        new Date(s.expiresAt) > new Date()
      );
    
    if (existingSession) {
      this.logger.log(`Usuario ${userId} ya tiene sesión activa: ${existingSession.sessionId}`);
      return existingSession;
    }
    
    const sessionId = `kyc-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + VERIFICATION_EXPIRY_DAYS);
    
    const requiredDocuments = this.getRequiredDocuments(kycLevel);
    
    const session: VerificationSession = {
      sessionId,
      userId,
      status: VerificationStatus.PENDING,
      kycLevel,
      triggerType,
      triggerReference,
      requiredDocuments,
      uploadedDocuments: [],
      expiresAt,
      providerSessionUrl: `https://mock-kyc-provider.com/verify/${sessionId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.verificationSessions.set(sessionId, session);
    
    // Actualizar estado del usuario a PENDING
    this.userVerifications.set(userId, {
      userId,
      status: VerificationStatus.PENDING,
      kycLevel,
      lastUpdated: new Date(),
    });
    
    this.logger.log(`Sesión de verificación iniciada: ${sessionId} para usuario ${userId}`);
    
    return session;
  }

  /**
   * Obtiene una sesión de verificación específica
   */
  async getVerificationSession(
    userId: string,
    sessionId: string,
  ): Promise<VerificationSession | null> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Validar que la sesión pertenece al usuario
    if (session.userId !== userId) {
      throw new ForbiddenException('No tiene acceso a esta sesión de verificación');
    }
    
    return session;
  }

  // ==========================================================================
  // GESTIÓN DE DOCUMENTOS
  // ==========================================================================

  /**
   * Sube un documento para verificación
   */
  async uploadDocument(
    userId: string,
    sessionId: string,
    documentType: string,
    documentUrl: string,
    documentSide?: string,
  ): Promise<{ success: boolean; message: string; documentId: string }> {
    const session = await this.getVerificationSession(userId, sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión de verificación no encontrada');
    }
    
    if (session.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('La sesión de verificación no está activa');
    }
    
    // Validar tipo de documento
    const validTypes = Object.values(DocumentType);
    if (!validTypes.includes(documentType as DocumentType)) {
      throw new BadRequestException(
        `Tipo de documento inválido. Valores permitidos: ${validTypes.join(', ')}`
      );
    }
    
    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const document: UploadedDocument = {
      documentId,
      type: documentType,
      side: documentSide,
      uploadedAt: new Date(),
      status: 'UPLOADED',
    };
    
    // Agregar a documentos de la sesión
    if (!session.uploadedDocuments) {
      session.uploadedDocuments = [];
    }
    session.uploadedDocuments.push(document);
    session.updatedAt = new Date();
    
    this.verificationSessions.set(sessionId, session);
    
    // También guardar en el mapa de documentos del usuario
    const userDocs = this.uploadedDocuments.get(userId) || [];
    userDocs.push(document);
    this.uploadedDocuments.set(userId, userDocs);
    
    this.logger.log(`Documento subido: ${documentId} para sesión ${sessionId}`);
    
    // Verificar si se completaron todos los documentos requeridos
    await this.checkAndProcessCompletion(sessionId);
    
    return {
      success: true,
      message: 'Documento subido correctamente',
      documentId,
    };
  }

  /**
   * Sube selfie para verificación facial
   */
  async uploadSelfie(
    userId: string,
    sessionId: string,
    selfieUrl: string,
    livenessCheckPassed?: boolean,
  ): Promise<{ success: boolean; message: string; selfieId: string }> {
    const session = await this.getVerificationSession(userId, sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión de verificación no encontrada');
    }
    
    if (session.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('La sesión de verificación no está activa');
    }
    
    const selfieId = `selfie-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const selfieDoc: UploadedDocument = {
      documentId: selfieId,
      type: 'SELFIE',
      uploadedAt: new Date(),
      status: livenessCheckPassed ? 'VERIFIED' : 'UPLOADED',
    };
    
    if (!session.uploadedDocuments) {
      session.uploadedDocuments = [];
    }
    session.uploadedDocuments.push(selfieDoc);
    session.updatedAt = new Date();
    
    this.verificationSessions.set(sessionId, session);
    
    this.logger.log(`Selfie subido: ${selfieId} para sesión ${sessionId}`);
    
    // Verificar si se completaron todos los requisitos
    await this.checkAndProcessCompletion(sessionId);
    
    return {
      success: true,
      message: 'Selfie subido correctamente',
      selfieId,
    };
  }

  // ==========================================================================
  // PROCESAMIENTO Y WEBHOOKS
  // ==========================================================================

  /**
   * Procesa webhook del proveedor KYC (Veriff, Onfido, etc.)
   * En desarrollo es un mock que simula la respuesta del proveedor
   */
  async processProviderWebhook(
    sessionId: string,
    decision: 'approved' | 'rejected',
    details?: Record<string, any>,
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }
    
    if (decision === 'approved') {
      await this.approveVerification(session.userId, sessionId, 'system');
    } else {
      await this.rejectVerification(
        session.userId,
        sessionId,
        details?.reason || 'Verificación rechazada por el proveedor',
        'system',
      );
    }
  }

  /**
   * Aprueba una verificación (manual o automática)
   */
  async approveVerification(
    userId: string,
    sessionId: string,
    approvedBy: string,
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Sesión no encontrada');
    }
    
    // Actualizar sesión
    session.status = VerificationStatus.VERIFIED;
    session.updatedAt = new Date();
    this.verificationSessions.set(sessionId, session);
    
    // Actualizar estado del usuario
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Verificación válida por 1 año
    
    this.userVerifications.set(userId, {
      userId,
      status: VerificationStatus.VERIFIED,
      kycLevel: session.kycLevel,
      lastUpdated: new Date(),
      verificationExpiry: expiryDate,
    });
    
    // Liberar fondos retenidos pendientes de verificación
    await this.releasePendingFunds(userId);
    
    this.logger.log(`Verificación aprobada para usuario ${userId} por ${approvedBy}`);
  }

  /**
   * Rechaza una verificación
   */
  async rejectVerification(
    userId: string,
    sessionId: string,
    reason: string,
    rejectedBy: string,
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session || session.userId !== userId) {
      throw new NotFoundException('Sesión no encontrada');
    }
    
    // Actualizar sesión
    session.status = VerificationStatus.REJECTED;
    session.updatedAt = new Date();
    this.verificationSessions.set(sessionId, session);
    
    // Actualizar estado del usuario
    this.userVerifications.set(userId, {
      userId,
      status: VerificationStatus.REJECTED,
      kycLevel: session.kycLevel,
      lastUpdated: new Date(),
      rejectionReason: reason,
    });
    
    this.logger.log(`Verificación rechazada para usuario ${userId} por ${rejectedBy}: ${reason}`);
  }

  // ==========================================================================
  // CONSULTAS DE ESTADO
  // ==========================================================================

  /**
   * Obtiene el estado de verificación de un usuario
   */
  async getUserVerificationStatus(userId: string): Promise<UserVerificationStatus> {
    const status = this.userVerifications.get(userId);
    
    if (!status) {
      return {
        userId,
        status: VerificationStatus.NOT_VERIFIED,
        kycLevel: '',
        lastUpdated: new Date(),
      };
    }
    
    return status;
  }

  /**
   * Obtiene los requisitos de verificación para un usuario
   */
  async getVerificationRequirements(userId: string): Promise<VerificationRequirements> {
    const status = await this.getUserVerificationStatus(userId);
    
    if (status.status === VerificationStatus.VERIFIED) {
      return {
        pendingDocuments: [],
        requiredLevel: status.kycLevel,
        instructions: ['Su verificación está completa'],
      };
    }
    
    // Buscar sesión activa
    const activeSession = Array.from(this.verificationSessions.values())
      .find(s => s.userId === userId && s.status === VerificationStatus.PENDING);
    
    if (activeSession) {
      const uploadedTypes = activeSession.uploadedDocuments?.map(d => d.type) || [];
      const pendingDocuments = activeSession.requiredDocuments.filter(
        d => !uploadedTypes.includes(d)
      );
      
      return {
        pendingDocuments,
        requiredLevel: activeSession.kycLevel,
        instructions: [
          'Complete la subida de documentos requeridos',
          'Asegúrese de que las imágenes sean claras y legibles',
        ],
      };
    }
    
    // Sin sesión activa - indicar que debe iniciar verificación
    return {
      pendingDocuments: ['IDENTITY_DOCUMENT', 'SELFIE'],
      requiredLevel: KycLevel.LEVEL_1,
      instructions: [
        'Inicie el proceso de verificación',
        'Prepare su documento de identidad vigente',
        'Necesitará tomar una selfie para verificación facial',
      ],
    };
  }

  // ==========================================================================
  // GESTIÓN DE FONDOS
  // ==========================================================================

  /**
   * Obtiene el balance de fondos de un usuario
   */
  async getUserFundBalance(userId: string): Promise<FundBalance> {
    const balance = this.userFunds.get(userId);
    
    if (!balance) {
      return {
        available: 0,
        held: 0,
        pending: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        lastUpdated: new Date(),
        verificationRequired: false,
      };
    }
    
    // Verificar si necesita KYC para retirar
    const verificationCheck = await this.checkIfVerificationRequired(
      userId,
      TriggerType.WITHDRAWAL_REQUEST,
      balance.available,
    );
    
    return {
      ...balance,
      verificationRequired: verificationCheck.required && !verificationCheck.isVerified,
      verificationRequiredReason: verificationCheck.reason,
    };
  }

  /**
   * Obtiene el historial de transacciones de fondos
   */
  async getUserFundHistory(
    userId: string,
    page: number,
    limit: number,
    status?: string,
    type?: string,
  ): Promise<{ transactions: FundTransaction[]; total: number }> {
    let transactions = this.fundTransactions.get(userId) || [];
    
    // Filtrar por estado si se especifica
    if (status) {
      transactions = transactions.filter(t => t.status === status);
    }
    
    // Filtrar por tipo si se especifica
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }
    
    // Ordenar por fecha descendente
    transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    const total = transactions.length;
    const start = (page - 1) * limit;
    const paginatedTransactions = transactions.slice(start, start + limit);
    
    return { transactions: paginatedTransactions, total };
  }

  /**
   * Crea una solicitud de retiro pendiente de verificación
   */
  async createPendingWithdrawal(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: Record<string, any>,
    verificationSessionId: string,
  ): Promise<Withdrawal> {
    const withdrawalId = `withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const withdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      amount,
      status: FundStatus.PENDING_VERIFICATION,
      paymentMethod,
      paymentDetails,
      verificationSessionId,
      createdAt: new Date(),
    };
    
    this.withdrawals.set(withdrawalId, withdrawal);
    
    // Registrar transacción
    this.addFundTransaction(userId, {
      id: withdrawalId,
      type: 'WITHDRAWAL_REQUEST',
      amount: -amount,
      status: FundStatus.PENDING_VERIFICATION,
      description: 'Solicitud de retiro pendiente de verificación KYC',
      createdAt: new Date(),
    });
    
    // Retener fondos
    await this.holdFunds(userId, amount, 'Retiro pendiente de verificación');
    
    return withdrawal;
  }

  /**
   * Procesa una solicitud de retiro (usuario ya verificado)
   */
  async processWithdrawalRequest(
    userId: string,
    amount: number,
    paymentMethod: string,
    paymentDetails: Record<string, any>,
  ): Promise<Withdrawal> {
    const balance = await this.getUserFundBalance(userId);
    
    if (balance.available < amount) {
      throw new BadRequestException('Fondos insuficientes');
    }
    
    const withdrawalId = `withdrawal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const withdrawal: Withdrawal = {
      id: withdrawalId,
      userId,
      amount,
      status: FundStatus.APPROVED,
      paymentMethod,
      paymentDetails,
      createdAt: new Date(),
    };
    
    this.withdrawals.set(withdrawalId, withdrawal);
    
    // Actualizar balance
    const currentBalance = this.userFunds.get(userId) || {
      available: 0,
      held: 0,
      pending: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      lastUpdated: new Date(),
      verificationRequired: false,
    };
    
    currentBalance.available -= amount;
    currentBalance.totalWithdrawn += amount;
    currentBalance.lastUpdated = new Date();
    this.userFunds.set(userId, currentBalance);
    
    // Registrar transacción
    this.addFundTransaction(userId, {
      id: withdrawalId,
      type: 'WITHDRAWAL',
      amount: -amount,
      status: FundStatus.APPROVED,
      description: `Retiro procesado - ${paymentMethod}`,
      createdAt: new Date(),
    });
    
    return withdrawal;
  }

  // ==========================================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // ==========================================================================

  /**
   * Retiene fondos de un usuario
   */
  private async holdFunds(userId: string, amount: number, reason: string): Promise<void> {
    const balance = this.userFunds.get(userId) || {
      available: 0,
      held: 0,
      pending: 0,
      totalEarnings: 0,
      totalWithdrawn: 0,
      lastUpdated: new Date(),
      verificationRequired: false,
    };
    
    if (balance.available < amount) {
      throw new BadRequestException('Fondos insuficientes para retener');
    }
    
    balance.available -= amount;
    balance.held += amount;
    balance.lastUpdated = new Date();
    
    this.userFunds.set(userId, balance);
    
    this.logger.log(`Fondos retenidos para ${userId}: ${amount}€ - ${reason}`);
  }

  /**
   * Libera fondos pendientes de verificación
   */
  private async releasePendingFunds(userId: string): Promise<void> {
    const balance = this.userFunds.get(userId);
    
    if (!balance || balance.held === 0) {
      return;
    }
    
    // Procesar retiros pendientes
    const pendingWithdrawals = Array.from(this.withdrawals.values())
      .filter(w => 
        w.userId === userId && 
        w.status === FundStatus.PENDING_VERIFICATION
      );
    
    for (const withdrawal of pendingWithdrawals) {
      withdrawal.status = FundStatus.APPROVED;
      this.withdrawals.set(withdrawal.id, withdrawal);
      
      // Actualizar transacción
      this.addFundTransaction(userId, {
        id: `release-${withdrawal.id}`,
        type: 'WITHDRAWAL_APPROVED',
        amount: -withdrawal.amount,
        status: FundStatus.RELEASED,
        description: 'Retiro aprobado tras verificación KYC',
        createdAt: new Date(),
        reference: withdrawal.id,
      });
    }
    
    // Liberar fondos retenidos
    balance.held = 0;
    balance.lastUpdated = new Date();
    this.userFunds.set(userId, balance);
    
    this.logger.log(`Fondos liberados para usuario ${userId}`);
  }

  /**
   * Agrega una transacción al historial
   */
  private addFundTransaction(userId: string, transaction: FundTransaction): void {
    const transactions = this.fundTransactions.get(userId) || [];
    transactions.push(transaction);
    this.fundTransactions.set(userId, transactions);
  }

  /**
   * Obtiene los documentos requeridos según el nivel KYC
   */
  private getRequiredDocuments(level: KycLevel): string[] {
    const baseDocuments = [DocumentType.IDENTITY_DOCUMENT, 'SELFIE'];
    
    if (level === KycLevel.LEVEL_2) {
      return [...baseDocuments, DocumentType.PROOF_OF_ADDRESS];
    }
    
    return baseDocuments;
  }

  /**
   * Verifica si el nivel actual es suficiente para el requerido
   */
  private isLevelSufficient(current: KycLevel, required: KycLevel): boolean {
    const levels = { [KycLevel.LEVEL_1]: 1, [KycLevel.LEVEL_2]: 2 };
    return (levels[current] || 0) >= (levels[required] || 1);
  }

  /**
   * Verifica si se completaron todos los documentos y procesa
   */
  private async checkAndProcessCompletion(sessionId: string): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) return;
    
    const uploadedTypes = session.uploadedDocuments?.map(d => d.type) || [];
    const allDocumentsUploaded = session.requiredDocuments.every(
      req => uploadedTypes.includes(req) || 
             (req === 'SELFIE' && uploadedTypes.includes('SELFIE'))
    );
    
    if (allDocumentsUploaded) {
      this.logger.log(`Todos los documentos subidos para sesión ${sessionId}. Procesando verificación...`);
      
      // En desarrollo, auto-aprobar después de un delay simulado
      // En producción, esto esperaría el webhook del proveedor KYC
      setTimeout(async () => {
        await this.processProviderWebhook(sessionId, 'approved', {
          autoApproved: true,
          reason: 'Verificación automática en modo desarrollo',
        });
      }, 2000);
    }
  }

  // ==========================================================================
  // MÉTODOS PARA ADMIN (usados por AdminKycController)
  // ==========================================================================

  /**
   * Lista todas las verificaciones pendientes (para admin)
   */
  async listPendingVerifications(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ sessions: VerificationSession[]; total: number }> {
    const allSessions = Array.from(this.verificationSessions.values())
      .filter(s => s.status === VerificationStatus.PENDING)
      .sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    
    const total = allSessions.length;
    const start = (page - 1) * limit;
    const sessions = allSessions.slice(start, start + limit);
    
    return { sessions, total };
  }

  /**
   * Obtiene detalles de verificación (para admin)
   */
  async getVerificationDetails(sessionId: string): Promise<VerificationSession | null> {
    return this.verificationSessions.get(sessionId) || null;
  }

  /**
   * Aprobación manual por admin
   */
  async adminApproveVerification(
    sessionId: string,
    adminId: string,
    notes?: string,
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }
    
    await this.approveVerification(session.userId, sessionId, `admin:${adminId}`);
    
    this.logger.log(`Admin ${adminId} aprobó verificación ${sessionId}. Notas: ${notes || 'N/A'}`);
  }

  /**
   * Rechazo manual por admin
   */
  async adminRejectVerification(
    sessionId: string,
    adminId: string,
    reason: string,
  ): Promise<void> {
    const session = this.verificationSessions.get(sessionId);
    
    if (!session) {
      throw new NotFoundException('Sesión no encontrada');
    }
    
    await this.rejectVerification(session.userId, sessionId, reason, `admin:${adminId}`);
    
    this.logger.log(`Admin ${adminId} rechazó verificación ${sessionId}. Razón: ${reason}`);
  }
}
