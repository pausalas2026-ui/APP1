/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * DTOs para engagement, mensajería y geolocalización
 */

import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsUrl,
  MaxLength,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MessageChannel,
  MessagePriority,
  CauseUpdateType,
  EngagementEvent,
  SupportedLanguage,
  MessageReferenceType,
} from '../engagement.constants';

// ============================================
// MESSAGING DTOs
// ============================================

/**
 * DTO para enviar un mensaje
 */
export class SendMessageDto {
  @ApiProperty({ description: 'ID del usuario destinatario' })
  @IsUUID()
  userId: string;

  @ApiProperty({ enum: EngagementEvent, description: 'Tipo de evento/template' })
  @IsEnum(EngagementEvent)
  templateKey: EngagementEvent;

  @ApiProperty({ description: 'Variables para renderizar el template' })
  @IsObject()
  variables: Record<string, string>;

  @ApiPropertyOptional({ type: [String], enum: MessageChannel, description: 'Canales específicos' })
  @IsOptional()
  @IsArray()
  @IsEnum(MessageChannel, { each: true })
  channels?: MessageChannel[];

  @ApiPropertyOptional({ enum: MessagePriority })
  @IsOptional()
  @IsEnum(MessagePriority)
  priority?: MessagePriority;
}

/**
 * DTO para crear template de mensaje
 */
export class CreateMessageTemplateDto {
  @ApiProperty({ description: 'Clave única del template' })
  @IsString()
  @MaxLength(100)
  templateKey: string;

  @ApiProperty({ enum: SupportedLanguage })
  @IsEnum(SupportedLanguage)
  languageCode: SupportedLanguage;

  @ApiProperty({ enum: MessageChannel })
  @IsEnum(MessageChannel)
  channel: MessageChannel;

  @ApiPropertyOptional({ description: 'Asunto (para email)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({ description: 'Cuerpo del mensaje' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Texto del CTA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaText?: string;

  @ApiPropertyOptional({ description: 'URL del CTA' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  ctaUrl?: string;

  @ApiPropertyOptional({ description: 'Variables disponibles' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}

/**
 * DTO para actualizar template
 */
export class UpdateMessageTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ctaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// INTERNAL MESSAGES DTOs
// ============================================

/**
 * DTO de respuesta para mensaje interno
 */
export class InternalMessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiPropertyOptional()
  templateKey?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  ctaText?: string;

  @ApiPropertyOptional()
  ctaUrl?: string;

  @ApiPropertyOptional()
  referenceType?: string;

  @ApiPropertyOptional()
  referenceId?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiPropertyOptional()
  readAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

/**
 * DTO para listar mensajes internos
 */
export class InternalMessagesListDto {
  @ApiProperty({ type: [InternalMessageResponseDto] })
  messages: InternalMessageResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

/**
 * DTO para marcar mensajes como leídos
 */
export class MarkMessagesReadDto {
  @ApiProperty({ type: [String], description: 'IDs de mensajes a marcar' })
  @IsArray()
  @IsUUID('4', { each: true })
  messageIds: string[];
}

// ============================================
// CAUSE UPDATES DTOs
// ============================================

/**
 * DTO para crear actualización de causa
 */
export class CreateCauseUpdateDto {
  @ApiProperty({ enum: CauseUpdateType })
  @IsEnum(CauseUpdateType)
  updateType: CauseUpdateType;

  @ApiPropertyOptional({ description: 'Título de la actualización' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ description: 'Contenido de la actualización' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'URL de imagen' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL de video' })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Si es pública' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Si está fijada' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: 'Notificar a donantes' })
  @IsOptional()
  @IsBoolean()
  notifyDonors?: boolean;

  @ApiPropertyOptional({ description: 'Notificar a participantes' })
  @IsOptional()
  @IsBoolean()
  notifyParticipants?: boolean;
}

/**
 * DTO de respuesta para actualización de causa
 */
export class CauseUpdateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  causeId: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty({ enum: CauseUpdateType })
  updateType: CauseUpdateType;

  @ApiPropertyOptional()
  title?: string;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  videoUrl?: string;

  @ApiProperty()
  isPublic: boolean;

  @ApiProperty()
  isPinned: boolean;

  @ApiProperty()
  notifyDonors: boolean;

  @ApiProperty()
  notifyParticipants: boolean;

  @ApiPropertyOptional()
  notificationSentAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO para listar actualizaciones de causa
 */
export class CauseUpdatesListDto {
  @ApiProperty({ type: [CauseUpdateResponseDto] })
  updates: CauseUpdateResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

// ============================================
// GEOLOCATION DTOs
// ============================================

/**
 * DTO para registrar geolocalización de donación
 */
export class RegisterDonationGeoDto {
  @ApiProperty()
  @IsUUID()
  donationId: string;

  @ApiProperty()
  @IsUUID()
  causeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({ description: 'Código de país (ISO 3166-1 alpha-2)' })
  @IsString()
  @MaxLength(2)
  countryCode: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  countryName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;
}

/**
 * DTO de respuesta para estadísticas geográficas por país
 */
export class CountryGeoStatsDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  donationCount: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  uniqueDonors: number;

  @ApiPropertyOptional({ type: [String] })
  topCities?: string[];
}

/**
 * DTO de respuesta para ubicación reciente
 */
export class RecentLocationDto {
  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  timestamp: Date;
}

/**
 * DTO de respuesta para estadísticas geográficas de causa
 */
export class CauseGeoStatsResponseDto {
  @ApiProperty()
  causeId: string;

  @ApiProperty()
  totalCountries: number;

  @ApiProperty()
  totalCities: number;

  @ApiProperty()
  totalDonations: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty({ type: [CountryGeoStatsDto] })
  countries: CountryGeoStatsDto[];

  @ApiProperty({ type: [RecentLocationDto] })
  recentLocations: RecentLocationDto[];
}

// ============================================
// MESSAGE TEMPLATE DTOs
// ============================================

/**
 * DTO de respuesta para template de mensaje
 */
export class MessageTemplateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateKey: string;

  @ApiProperty({ enum: SupportedLanguage })
  languageCode: SupportedLanguage;

  @ApiProperty({ enum: MessageChannel })
  channel: MessageChannel;

  @ApiPropertyOptional()
  subject?: string;

  @ApiProperty()
  body: string;

  @ApiPropertyOptional()
  ctaText?: string;

  @ApiPropertyOptional()
  ctaUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  variables?: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * DTO para listar templates
 */
export class MessageTemplatesListDto {
  @ApiProperty({ type: [MessageTemplateResponseDto] })
  templates: MessageTemplateResponseDto[];

  @ApiProperty()
  total: number;
}

// ============================================
// STATISTICS DTOs
// ============================================

/**
 * DTO para estadísticas de engagement
 */
export class EngagementStatsResponseDto {
  @ApiProperty()
  totalMessagesSent: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byChannel: Record<MessageChannel, number>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  byEvent: Record<EngagementEvent, number>;

  @ApiProperty()
  todaySent: number;

  @ApiProperty()
  thisWeekSent: number;

  @ApiProperty()
  thisMonthSent: number;

  @ApiProperty()
  averageOpenRate: number;

  @ApiProperty()
  averageClickRate: number;
}

/**
 * DTO genérico de respuesta exitosa
 */
export class EngagementSuccessResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  messageId?: string;
}
