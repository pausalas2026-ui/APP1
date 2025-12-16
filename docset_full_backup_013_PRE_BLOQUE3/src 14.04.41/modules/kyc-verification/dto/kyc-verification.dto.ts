// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// DTOs para el sistema de verificación
// REGLA MADRE: NADIE recibe dinero sin verificación previa

import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { KycLevel, TriggerEvent, DocumentType, VerificationStatus, FundStatus } from '../kyc-verification.constants';

/**
 * DTO para iniciar verificación KYC
 * DOC33 §5
 */
export class StartVerificationDto {
  @IsOptional()
  @IsEnum(KycLevel)
  level?: KycLevel;

  @IsOptional()
  @IsEnum(TriggerEvent)
  triggerEvent?: TriggerEvent;

  @IsOptional()
  @IsUUID()
  triggerSourceId?: string;
}

/**
 * DTO para subir documento de verificación
 * DOC33 §6
 */
export class UploadDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  documentFrontUrl: string;

  @IsOptional()
  @IsString()
  documentBackUrl?: string;

  @IsString()
  documentCountry: string;
}

/**
 * DTO para subir selfie/prueba de vida
 * DOC33 §6
 */
export class UploadSelfieDto {
  @IsString()
  selfieUrl: string;

  @IsOptional()
  @IsString()
  livenessVideoUrl?: string;
}

/**
 * DTO para respuesta de estado de verificación
 */
export class VerificationStatusResponseDto {
  userId: string;
  status: VerificationStatus;
  level: KycLevel | null;
  canReceiveMoney: boolean;
  verifiedAt: Date | null;
  expiresAt: Date | null;
  attempts: number;
  maxAttempts: number;
  nextAttemptAllowedAt: Date | null;
  pendingFundsAmount: number;
  message: string;
}

/**
 * DTO para solicitar retiro de fondos
 * DOC33 §13 - Checklist antes de liberar
 */
export class RequestWithdrawalDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  currency: string;

  @IsUUID()
  sourceId: string;

  @IsString()
  sourceType: 'sweepstake' | 'cause' | 'prize';

  @IsOptional()
  @IsString()
  bankAccount?: string;

  @IsOptional()
  @IsString()
  bankName?: string;
}

/**
 * DTO para respuesta de balance de fondos
 */
export class FundsBalanceResponseDto {
  available: number;
  held: number;
  pendingVerification: number;
  total: number;
  currency: string;
  canWithdraw: boolean;
  withdrawalRequirements: string[];
}

/**
 * DTO para historial de fondos
 */
export class FundHistoryItemDto {
  id: string;
  sourceType: string;
  sourceId: string;
  amount: number;
  currency: string;
  status: FundStatus;
  heldReason: string | null;
  createdAt: Date;
  releasedAt: Date | null;
}

/**
 * DTO Admin: Aprobar verificación manualmente
 * DOC33 §7 Nivel 2
 */
export class AdminApproveVerificationDto {
  @IsUUID()
  verificationId: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(KycLevel)
  approvedLevel?: KycLevel;
}

/**
 * DTO Admin: Rechazar verificación
 */
export class AdminRejectVerificationDto {
  @IsUUID()
  verificationId: string;

  @IsString()
  rejectionReason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Liberar fondos manualmente
 */
export class AdminReleaseFundsDto {
  @IsUUID()
  fundId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Bloquear fondos
 */
export class AdminBlockFundsDto {
  @IsUUID()
  fundId: string;

  @IsString()
  blockReason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO para webhook de proveedor KYC
 * NOTA: Estructura genérica - sin integración real
 */
export class KycProviderWebhookDto {
  @IsString()
  sessionId: string;

  @IsString()
  status: 'approved' | 'rejected' | 'pending' | 'expired';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  verifiedData?: {
    name?: string;
    dateOfBirth?: string;
    documentType?: string;
    documentCountry?: string;
  };

  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO para requisitos de liberación de fondos
 * DOC33 §13
 */
export class WithdrawalRequirementsDto {
  userVerified: boolean;
  prizeDelivered: boolean;
  evidenceUploaded: boolean;
  winnerConfirmed: boolean;
  causeVerified: boolean;
  noFraudFlags: boolean;
  allRequirementsMet: boolean;
  missingRequirements: string[];
}
