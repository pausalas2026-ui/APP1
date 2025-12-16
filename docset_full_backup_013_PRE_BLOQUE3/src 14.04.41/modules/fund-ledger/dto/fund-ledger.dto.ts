// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS
// DTOs para el sistema de estados de fondos

import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min, IsBoolean } from 'class-validator';
import { FundLedgerStatus, FundSourceType } from './fund-ledger.constants';

/**
 * DTO para crear un nuevo registro en el ledger
 */
export class CreateFundLedgerDto {
  @IsUUID()
  userId: string;

  @IsEnum(FundSourceType)
  sourceType: FundSourceType;

  @IsUUID()
  sourceId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  releasedTo?: string;
}

/**
 * DTO para solicitar liberación de fondos
 */
export class RequestReleaseDto {
  @IsUUID()
  fundId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO para respuesta de balance de fondos
 */
export class FundBalanceResponseDto {
  userId: string;
  generated: number;
  held: number;
  pendingVerification: number;
  approved: number;
  released: number;
  blocked: number;
  total: number;
  currency: string;
}

/**
 * DTO para respuesta de detalle de fondo
 */
export class FundDetailResponseDto {
  id: string;
  userId: string;
  sourceType: FundSourceType;
  sourceId: string;
  amount: number;
  currency: string;
  status: FundLedgerStatus;
  previousStatus: string | null;
  heldReason: string | null;
  blockedReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  releasedAt: Date | null;
  releasedTo: string | null;
  transactionRef: string | null;
  createdAt: Date;
  updatedAt: Date;
  statusMessage: string;
}

/**
 * DTO para historial de estados
 */
export class FundStatusHistoryDto {
  id: string;
  fundId: string;
  fromStatus: string;
  toStatus: string;
  actorId: string;
  actorType: string;
  reason: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * DTO para requisitos de liberación
 */
export class ReleaseRequirementsDto {
  fundId: string;
  currentStatus: FundLedgerStatus;
  checklist: {
    userVerified: boolean;
    causeValidated: boolean;
    prizeDelivered: boolean | null;
    evidenceConfirmed: boolean;
    fraudCheckPassed: boolean;
  };
  canRelease: boolean;
  missing: string[];
}

/**
 * DTO Admin: Aprobar liberación
 */
export class AdminApproveFundDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Ejecutar liberación
 */
export class AdminReleaseFundDto {
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Bloquear fondos
 */
export class AdminBlockFundDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Desbloquear fondos
 */
export class AdminUnblockFundDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO Admin: Verificar checklist
 */
export class AdminVerifyChecklistDto {
  @IsBoolean()
  userVerified: boolean;

  @IsBoolean()
  causeValidated: boolean;

  @IsOptional()
  @IsBoolean()
  prizeDelivered?: boolean;

  @IsBoolean()
  evidenceConfirmed: boolean;

  @IsBoolean()
  fraudCheckPassed: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
