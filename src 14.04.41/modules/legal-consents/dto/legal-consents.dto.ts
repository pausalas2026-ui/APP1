/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * DTOs para gestión de consentimientos legales
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsIP,
  MaxLength,
  IsNotEmpty,
  IsBoolean,
  IsDateString,
  ValidateIf,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ConsentType,
  ConsentContext,
  ConsentReferenceType,
  DocumentType,
  CONSENT_CONFIG,
} from '../legal-consents.constants';

// ============================================
// REQUEST DTOs
// ============================================

/**
 * DTO para registrar un consentimiento
 * Según DOC35: Se requiere al menos un identificador
 */
export class RecordConsentDto {
  @ApiPropertyOptional({ description: 'ID del usuario (si está autenticado)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID del participante (si no está autenticado pero identificado)' })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiPropertyOptional({ description: 'ID de sesión (para usuarios anónimos)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sessionId?: string;

  @ApiProperty({ enum: ConsentType, description: 'Tipo de consentimiento' })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({ description: 'Versión del documento aceptado', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documentVersion: string;

  @ApiPropertyOptional({ enum: ConsentReferenceType, description: 'Tipo de referencia (ej: RAFFLE para sorteos)' })
  @IsOptional()
  @IsEnum(ConsentReferenceType)
  referenceType?: ConsentReferenceType;

  @ApiPropertyOptional({ description: 'ID de referencia (ej: ID del sorteo)' })
  @ValidateIf((o) => o.consentType === ConsentType.SORTEO)
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ description: 'Dirección IP del usuario', example: '192.168.1.1' })
  @IsIP()
  @MaxLength(CONSENT_CONFIG.MAX_IP_LENGTH)
  ipAddress: string;

  @ApiProperty({ description: 'User Agent del navegador' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CONSENT_CONFIG.MAX_USER_AGENT_LENGTH)
  userAgent: string;

  @ApiPropertyOptional({ description: 'Huella digital del dispositivo' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fingerprint?: string;
}

/**
 * DTO para registrar múltiples consentimientos a la vez
 * Útil para registro donde se aceptan TOS y PRIVACY juntos
 */
export class RecordBulkConsentsDto {
  @ApiPropertyOptional({ description: 'ID del usuario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID del participante' })
  @IsOptional()
  @IsUUID()
  participantId?: string;

  @ApiPropertyOptional({ description: 'ID de sesión' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  sessionId?: string;

  @ApiProperty({ enum: ConsentContext, description: 'Contexto del consentimiento' })
  @IsEnum(ConsentContext)
  context: ConsentContext;

  @ApiPropertyOptional({ description: 'ID de referencia (para sorteos)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ description: 'Dirección IP' })
  @IsIP()
  @MaxLength(CONSENT_CONFIG.MAX_IP_LENGTH)
  ipAddress: string;

  @ApiProperty({ description: 'User Agent' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CONSENT_CONFIG.MAX_USER_AGENT_LENGTH)
  userAgent: string;

  @ApiPropertyOptional({ description: 'Fingerprint' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fingerprint?: string;
}

/**
 * DTO para verificar si un usuario tiene consentimiento válido
 */
export class CheckConsentDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: ConsentType, description: 'Tipo de consentimiento' })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiPropertyOptional({ description: 'ID de referencia (para sorteos)' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}

/**
 * DTO para crear un nuevo documento legal (Admin)
 */
export class CreateLegalDocumentDto {
  @ApiProperty({ enum: DocumentType, description: 'Tipo de documento' })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Versión del documento', example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  version: string;

  @ApiProperty({ description: 'Título del documento' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Contenido completo del documento' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Resumen del documento' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: 'Fecha de entrada en vigor' })
  @IsDateString()
  effectiveFrom: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de vigencia' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Si es la versión actual' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

/**
 * DTO para actualizar un documento legal (Admin)
 */
export class UpdateLegalDocumentDto {
  @ApiPropertyOptional({ description: 'Título del documento' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ description: 'Contenido del documento' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Resumen del documento' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de vigencia' })
  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;

  @ApiPropertyOptional({ description: 'Si es la versión actual' })
  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;
}

/**
 * DTO para filtrar consentimientos (Admin)
 */
export class FilterConsentsDto {
  @ApiPropertyOptional({ description: 'ID del usuario' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: ConsentType, description: 'Tipo de consentimiento' })
  @IsOptional()
  @IsEnum(ConsentType)
  consentType?: ConsentType;

  @ApiPropertyOptional({ description: 'Versión del documento' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentVersion?: string;

  @ApiPropertyOptional({ description: 'Fecha desde' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Número de página' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Elementos por página' })
  @IsOptional()
  limit?: number;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * DTO de respuesta para un consentimiento
 */
export class ConsentResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiPropertyOptional()
  participantId?: string;

  @ApiPropertyOptional()
  sessionId?: string;

  @ApiProperty({ enum: ConsentType })
  consentType: ConsentType;

  @ApiProperty()
  documentVersion: string;

  @ApiPropertyOptional()
  referenceType?: string;

  @ApiPropertyOptional()
  referenceId?: string;

  @ApiProperty()
  acceptedAt: Date;

  @ApiProperty()
  ipAddress: string;

  @ApiProperty()
  userAgent: string;

  @ApiPropertyOptional()
  fingerprint?: string;
}

/**
 * DTO de respuesta para historial de consentimientos
 */
export class ConsentHistoryResponseDto {
  @ApiProperty({ type: [ConsentResponseDto] })
  consents: ConsentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

/**
 * DTO de respuesta para verificación de consentimiento
 */
export class ConsentCheckResponseDto {
  @ApiProperty({ description: 'Si el usuario tiene consentimiento válido' })
  hasConsent: boolean;

  @ApiPropertyOptional({ description: 'Versión del consentimiento aceptado' })
  acceptedVersion?: string;

  @ApiPropertyOptional({ description: 'Fecha de aceptación' })
  acceptedAt?: Date;

  @ApiPropertyOptional({ description: 'Si hay una versión más reciente disponible' })
  hasNewerVersion?: boolean;

  @ApiPropertyOptional({ description: 'Versión actual del documento' })
  currentVersion?: string;
}

/**
 * DTO de respuesta para documento legal
 */
export class LegalDocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: DocumentType })
  documentType: DocumentType;

  @ApiProperty()
  version: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  summary?: string;

  @ApiProperty()
  effectiveFrom: Date;

  @ApiPropertyOptional()
  effectiveUntil?: Date;

  @ApiProperty()
  isCurrent: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  createdBy?: string;
}

/**
 * DTO de respuesta para listado de documentos legales
 */
export class LegalDocumentsListResponseDto {
  @ApiProperty({ type: [LegalDocumentResponseDto] })
  documents: LegalDocumentResponseDto[];

  @ApiProperty()
  total: number;
}

/**
 * DTO de respuesta para textos UX de consentimiento
 */
export class ConsentUxTextResponseDto {
  @ApiProperty()
  text: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        label: { type: 'string' },
        path: { type: 'string' },
        consentType: { type: 'string' },
      },
    },
  })
  links: Array<{
    label: string;
    path: string;
    consentType: ConsentType;
  }>;
}

/**
 * DTO de respuesta para consentimientos requeridos por contexto
 */
export class RequiredConsentsResponseDto {
  @ApiProperty({ enum: ConsentContext })
  context: ConsentContext;

  @ApiProperty({ type: [String], enum: ConsentType })
  requiredConsents: ConsentType[];

  @ApiProperty()
  uxText: ConsentUxTextResponseDto;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  currentVersions: Record<ConsentType, string>;
}

/**
 * DTO de respuesta para estadísticas de consentimientos (Admin)
 */
export class ConsentStatsResponseDto {
  @ApiProperty()
  totalConsents: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byType: Record<ConsentType, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byVersion: Record<string, number>;

  @ApiProperty()
  uniqueUsers: number;

  @ApiProperty()
  todayConsents: number;

  @ApiProperty()
  thisWeekConsents: number;

  @ApiProperty()
  thisMonthConsents: number;
}

/**
 * DTO genérico de respuesta exitosa
 */
export class ConsentSuccessResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  consentId?: string;
}
