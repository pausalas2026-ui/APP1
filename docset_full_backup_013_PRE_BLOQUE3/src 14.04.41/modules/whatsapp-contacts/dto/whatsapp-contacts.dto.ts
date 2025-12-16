// DTOs para WhatsApp Contacts Module
// Importación, gestión y envío de mensajes a contactos

import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsUUID,
  IsPhoneNumber,
  ValidateNested,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsNotEmpty,
  Matches,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ContactStatus,
  ImportSource,
  ContactConsentStatus,
  WhatsAppMessageType,
  MessageSendStatus,
  CONTACT_VALIDATION_CONFIG,
} from '../whatsapp-contacts.constants';

// ============================================
// DTOs para CONTACTOS
// ============================================

/**
 * DTO para un contacto individual en importación
 */
export class ContactItemDto {
  @IsString()
  @MinLength(CONTACT_VALIDATION_CONFIG.minNameLength)
  @MaxLength(CONTACT_VALIDATION_CONFIG.maxNameLength)
  name: string;

  @IsString()
  @Matches(CONTACT_VALIDATION_CONFIG.phoneRegex, {
    message: 'El número debe estar en formato internacional (+XX...)',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * DTO para importación masiva de contactos
 */
export class ImportContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactItemDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(500, { message: 'Máximo 500 contactos por importación' })
  contacts: ContactItemDto[];

  @IsEnum(ImportSource)
  source: ImportSource;

  @IsBoolean()
  consentGranted: boolean;

  @IsOptional()
  @IsString()
  consentTimestamp?: string;

  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;
}

/**
 * DTO para agregar un contacto individual manualmente
 */
export class AddContactDto {
  @IsString()
  @MinLength(CONTACT_VALIDATION_CONFIG.minNameLength)
  @MaxLength(CONTACT_VALIDATION_CONFIG.maxNameLength)
  name: string;

  @IsString()
  @Matches(CONTACT_VALIDATION_CONFIG.phoneRegex, {
    message: 'El número debe estar en formato internacional (+XX...)',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsBoolean()
  consentGranted: boolean;
}

/**
 * DTO para actualizar un contacto existente
 */
export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MinLength(CONTACT_VALIDATION_CONFIG.minNameLength)
  @MaxLength(CONTACT_VALIDATION_CONFIG.maxNameLength)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}

/**
 * DTO de respuesta para un contacto
 */
export class ContactResponseDto {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  phoneCountryCode: string;
  status: ContactStatus;
  consentStatus: ContactConsentStatus;
  importSource: ImportSource;
  notes?: string;
  tags?: string[];
  lastMessageSentAt?: Date;
  messagesSentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// DTOs para MENSAJES
// ============================================

/**
 * Variables disponibles para templates de mensajes
 */
export class MessageVariablesDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  senderName?: string;

  @IsOptional()
  @IsString()
  prizeName?: string;

  @IsOptional()
  @IsString()
  causeName?: string;

  @IsOptional()
  @IsString()
  sweepstakeName?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  resultMessage?: string;

  @IsOptional()
  @IsString()
  updateMessage?: string;

  @IsOptional()
  @IsString()
  customMessage?: string;
}

/**
 * DTO para enviar mensaje a un contacto
 */
export class SendMessageToContactDto {
  @IsUUID()
  contactId: string;

  @IsEnum(WhatsAppMessageType)
  messageType: WhatsAppMessageType;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageVariablesDto)
  variables?: MessageVariablesDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customMessage?: string;

  @IsOptional()
  @IsString()
  language?: string; // 'es' | 'en'

  @IsOptional()
  @IsUUID()
  relatedSweepstakeId?: string;

  @IsOptional()
  @IsUUID()
  relatedCauseId?: string;
}

/**
 * DTO para enviar mensaje a múltiples contactos
 */
export class SendBulkMessageDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50, { message: 'Máximo 50 contactos por envío masivo' })
  contactIds: string[];

  @IsEnum(WhatsAppMessageType)
  messageType: WhatsAppMessageType;

  @IsOptional()
  @ValidateNested()
  @Type(() => MessageVariablesDto)
  variables?: MessageVariablesDto;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customMessage?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsUUID()
  relatedSweepstakeId?: string;

  @IsOptional()
  @IsUUID()
  relatedCauseId?: string;

  @IsOptional()
  @IsBoolean()
  scheduleForOptimalTime?: boolean;
}

/**
 * DTO para compartir un sorteo específico
 */
export class ShareSweepstakeDto {
  @IsUUID()
  sweepstakeId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  contactIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  personalMessage?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

/**
 * DTO de respuesta para mensaje enviado
 */
export class MessageSentResponseDto {
  id: string;
  contactId: string;
  contactName: string;
  phoneNumber: string;
  messageType: WhatsAppMessageType;
  status: MessageSendStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

/**
 * DTO de respuesta para envío masivo
 */
export class BulkSendResponseDto {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  results: MessageSentResponseDto[];
  errors: Array<{
    contactId: string;
    contactName: string;
    error: string;
  }>;
  skipped: Array<{
    contactId: string;
    contactName: string;
    reason: string;
  }>;
}

// ============================================
// DTOs para CONSULTAS Y FILTROS
// ============================================

/**
 * DTO para filtrar lista de contactos
 */
export class ContactsFilterDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactConsentStatus)
  consentStatus?: ContactConsentStatus;

  @IsOptional()
  @IsString()
  search?: string; // Buscar por nombre o número

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  canReceiveMessages?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'createdAt' | 'lastMessageSentAt' | 'messagesSentCount';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

/**
 * DTO para historial de mensajes
 */
export class MessageHistoryFilterDto {
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @IsOptional()
  @IsEnum(WhatsAppMessageType)
  messageType?: WhatsAppMessageType;

  @IsOptional()
  @IsEnum(MessageSendStatus)
  status?: MessageSendStatus;

  @IsOptional()
  @IsString()
  fromDate?: string;

  @IsOptional()
  @IsString()
  toDate?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

// ============================================
// DTOs para CONSENTIMIENTO
// ============================================

/**
 * DTO para registrar consentimiento de importación
 */
export class RecordImportConsentDto {
  @IsBoolean()
  consentGranted: boolean;

  @IsString()
  @IsNotEmpty()
  ipAddress: string;

  @IsString()
  @IsNotEmpty()
  userAgent: string;

  @IsOptional()
  @IsString()
  deviceId?: string;
}

/**
 * DTO para opt-out de un contacto
 */
export class ContactOptOutDto {
  @IsString()
  @Matches(CONTACT_VALIDATION_CONFIG.phoneRegex)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

// ============================================
// DTOs para ESTADÍSTICAS
// ============================================

/**
 * DTO de respuesta para estadísticas de contactos
 */
export class ContactsStatsResponseDto {
  totalContacts: number;
  activeContacts: number;
  inactiveContacts: number;
  blockedContacts: number;
  pendingContacts: number;
  contactsWithConsent: number;
  contactsBySource: Record<ImportSource, number>;
  recentImports: number; // Últimos 30 días
}

/**
 * DTO de respuesta para estadísticas de mensajes
 */
export class MessagingStatsResponseDto {
  totalMessagesSent: number;
  messagesThisMonth: number;
  messagesToday: number;
  deliveryRate: number; // Porcentaje
  readRate: number; // Porcentaje
  failureRate: number; // Porcentaje
  messagesByType: Record<WhatsAppMessageType, number>;
  topContactsMessaged: Array<{
    contactId: string;
    contactName: string;
    messageCount: number;
  }>;
  remainingDailyQuota: number;
}

// ============================================
// DTOs para VALIDACIÓN DE NÚMEROS
// ============================================

/**
 * DTO para validar número de WhatsApp
 */
export class ValidatePhoneDto {
  @IsString()
  @Matches(CONTACT_VALIDATION_CONFIG.phoneRegex)
  phoneNumber: string;
}

/**
 * DTO de respuesta para validación de número
 */
export class PhoneValidationResponseDto {
  phoneNumber: string;
  isValid: boolean;
  hasWhatsApp: boolean; // Simulado - requeriría integración real
  countryCode: string;
  countryName: string;
  formattedNumber: string;
}

// ============================================
// DTOs INTERNOS
// ============================================

/**
 * DTO interno para registro de mensaje en BD
 */
export class CreateMessageLogDto {
  userId: string;
  contactId: string;
  messageType: WhatsAppMessageType;
  templateUsed: string;
  renderedMessage: string;
  relatedSweepstakeId?: string;
  relatedCauseId?: string;
  status: MessageSendStatus;
  metadata?: Record<string, any>;
}

/**
 * DTO interno para importación de contacto
 */
export class ProcessedContactDto {
  name: string;
  phoneNumber: string;
  phoneCountryCode: string;
  normalizedPhone: string;
  notes?: string;
  tags?: string[];
  isDuplicate: boolean;
  validationErrors: string[];
}
