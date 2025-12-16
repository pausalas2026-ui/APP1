/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Servicio de mensajería automática
 * 
 * ARQUITECTURA:
 * EVENTO → PROCESADOR → TEMPLATES + IDIOMA → DISPATCHER → CANALES
 * 
 * DOC36: "Los mensajes se envían en el idioma del receptor"
 * DOC36: "Engagement ≠ spam" - Frecuencia controlada
 */

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MessageChannel,
  MessagePriority,
  EngagementEvent,
  SupportedLanguage,
  MessageReferenceType,
  FREQUENCY_LIMITS,
  EVENT_CHANNELS,
  TEMPLATE_VARIABLES,
  DEFAULT_LANGUAGE,
  COUNTRY_TO_LANGUAGE,
  isImmediateEvent,
  getChannelsForEvent,
  ENGAGEMENT_ERRORS,
} from './engagement.constants';
import {
  SendMessageDto,
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  InternalMessageResponseDto,
  InternalMessagesListDto,
  MessageTemplateResponseDto,
  MessageTemplatesListDto,
  EngagementStatsResponseDto,
  EngagementSuccessResponseDto,
} from './dto/engagement.dto';

interface RenderedMessage {
  subject?: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================

  /**
   * Envía un mensaje a un usuario
   * DOC36: Cada acción del usuario debe generar una reacción de la app
   */
  async sendMessage(dto: SendMessageDto): Promise<EngagementSuccessResponseDto> {
    this.logger.log(`Sending message ${dto.templateKey} to user ${dto.userId}`);

    // 1. Obtener preferencias del usuario
    const user = await this.getUser(dto.userId);
    if (!user) {
      throw new NotFoundException(ENGAGEMENT_ERRORS.USER_NOT_FOUND);
    }

    // 2. Determinar idioma
    const language = await this.detectLanguage(user);

    // 3. Verificar límites de frecuencia (si no es inmediato)
    if (!isImmediateEvent(dto.templateKey)) {
      const canSend = await this.checkFrequencyLimits(dto.userId);
      if (!canSend) {
        this.logger.warn(`Rate limit exceeded for user ${dto.userId}`);
        // En producción, encolar para envío posterior
        return {
          success: false,
          message: ENGAGEMENT_ERRORS.RATE_LIMIT_EXCEEDED,
        };
      }
    }

    // 4. Determinar canales
    const channels = dto.channels || EVENT_CHANNELS[dto.templateKey] || [MessageChannel.INTERNAL];

    // 5. Enviar por cada canal
    const sentChannels: MessageChannel[] = [];

    for (const channel of channels) {
      try {
        // Obtener template
        const template = await this.getTemplate(dto.templateKey, language, channel);
        
        if (!template) {
          // Fallback a idioma por defecto
          const fallbackTemplate = await this.getTemplate(
            dto.templateKey,
            DEFAULT_LANGUAGE,
            channel
          );
          if (!fallbackTemplate) {
            this.logger.warn(`No template found for ${dto.templateKey} in ${channel}`);
            continue;
          }
        }

        const templateToUse = template || await this.getTemplate(
          dto.templateKey,
          DEFAULT_LANGUAGE,
          channel
        );

        if (!templateToUse) continue;

        // Renderizar mensaje
        const rendered = this.renderTemplate(templateToUse, dto.variables);

        // Enviar por el canal
        await this.dispatch(channel, user, rendered, dto.templateKey);

        sentChannels.push(channel);
      } catch (error) {
        this.logger.error(`Failed to send via ${channel}: ${error.message}`);
      }
    }

    // 6. Registrar envío
    await this.logMessageSent(dto.userId, dto.templateKey, sentChannels);

    return {
      success: sentChannels.length > 0,
      message: `Mensaje enviado por ${sentChannels.length} canales`,
    };
  }

  /**
   * Envía mensaje de evento (helper simplificado)
   */
  async sendEventMessage(
    event: EngagementEvent,
    userId: string,
    variables: Record<string, string>
  ): Promise<void> {
    await this.sendMessage({
      userId,
      templateKey: event,
      variables,
      priority: isImmediateEvent(event) ? MessagePriority.HIGH : MessagePriority.NORMAL,
    });
  }

  // ============================================
  // MENSAJES INTERNOS
  // ============================================

  /**
   * Obtiene mensajes internos del usuario
   */
  async getInternalMessages(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<InternalMessagesListDto> {
    const skip = (page - 1) * limit;

    const where: any = { userId, deletedAt: null };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [messages, total, unreadCount] = await Promise.all([
      this.prisma.internalMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.internalMessage.count({ where }),
      this.prisma.internalMessage.count({
        where: { userId, isRead: false, deletedAt: null },
      }),
    ]);

    return {
      messages: messages.map(this.mapToInternalMessageResponse),
      total,
      unreadCount,
      page,
      limit,
    };
  }

  /**
   * Marca mensajes como leídos
   */
  async markMessagesAsRead(userId: string, messageIds: string[]): Promise<number> {
    const result = await this.prisma.internalMessage.updateMany({
      where: {
        id: { in: messageIds },
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Marca todos los mensajes como leídos
   */
  async markAllMessagesAsRead(userId: string): Promise<number> {
    const result = await this.prisma.internalMessage.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Elimina un mensaje (soft delete)
   */
  async deleteMessage(userId: string, messageId: string): Promise<void> {
    await this.prisma.internalMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });
  }

  // ============================================
  // TEMPLATES
  // ============================================

  /**
   * Crea un template de mensaje
   */
  async createTemplate(dto: CreateMessageTemplateDto): Promise<MessageTemplateResponseDto> {
    this.logger.log(`Creating template ${dto.templateKey} for ${dto.languageCode}/${dto.channel}`);

    const template = await this.prisma.messageTemplate.create({
      data: {
        templateKey: dto.templateKey,
        languageCode: dto.languageCode,
        channel: dto.channel,
        subject: dto.subject,
        body: dto.body,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        variables: dto.variables,
        isActive: true,
      },
    });

    return this.mapToTemplateResponse(template);
  }

  /**
   * Actualiza un template
   */
  async updateTemplate(
    templateId: string,
    dto: UpdateMessageTemplateDto
  ): Promise<MessageTemplateResponseDto> {
    const template = await this.prisma.messageTemplate.update({
      where: { id: templateId },
      data: {
        subject: dto.subject,
        body: dto.body,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        isActive: dto.isActive,
      },
    });

    return this.mapToTemplateResponse(template);
  }

  /**
   * Obtiene todos los templates
   */
  async getAllTemplates(
    templateKey?: string,
    languageCode?: SupportedLanguage
  ): Promise<MessageTemplatesListDto> {
    const where: any = {};
    if (templateKey) where.templateKey = templateKey;
    if (languageCode) where.languageCode = languageCode;

    const templates = await this.prisma.messageTemplate.findMany({
      where,
      orderBy: [{ templateKey: 'asc' }, { languageCode: 'asc' }],
    });

    return {
      templates: templates.map(this.mapToTemplateResponse),
      total: templates.length,
    };
  }

  /**
   * Obtiene un template específico
   */
  async getTemplate(
    templateKey: string,
    languageCode: SupportedLanguage,
    channel: MessageChannel
  ): Promise<any | null> {
    return this.prisma.messageTemplate.findFirst({
      where: {
        templateKey,
        languageCode,
        channel,
        isActive: true,
      },
    });
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de mensajería
   */
  async getMessagingStats(): Promise<EngagementStatsResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date();
    startOfMonth.setMonth(startOfMonth.getMonth() - 1);

    const totalMessagesSent = await this.prisma.messageSentLog.count();

    // Por canal
    const byChannelRaw = await this.prisma.messageSentLog.groupBy({
      by: ['channel'],
      _count: { id: true },
    });
    const byChannel: Record<MessageChannel, number> = {} as any;
    Object.values(MessageChannel).forEach((ch) => {
      const found = byChannelRaw.find((r) => r.channel === ch);
      byChannel[ch] = found?._count.id || 0;
    });

    // Por evento
    const byEventRaw = await this.prisma.messageSentLog.groupBy({
      by: ['templateKey'],
      _count: { id: true },
    });
    const byEvent: Record<EngagementEvent, number> = {} as any;
    Object.values(EngagementEvent).forEach((ev) => {
      const found = byEventRaw.find((r) => r.templateKey === ev);
      byEvent[ev] = found?._count.id || 0;
    });

    // Temporales
    const [todaySent, thisWeekSent, thisMonthSent] = await Promise.all([
      this.prisma.messageSentLog.count({ where: { sentAt: { gte: startOfDay } } }),
      this.prisma.messageSentLog.count({ where: { sentAt: { gte: startOfWeek } } }),
      this.prisma.messageSentLog.count({ where: { sentAt: { gte: startOfMonth } } }),
    ]);

    return {
      totalMessagesSent,
      byChannel,
      byEvent,
      todaySent,
      thisWeekSent,
      thisMonthSent,
      averageOpenRate: 0, // Requiere tracking avanzado
      averageClickRate: 0,
    };
  }

  // ============================================
  // MÉTODOS INTERNOS
  // ============================================

  /**
   * Obtiene usuario con preferencias
   */
  private async getUser(userId: string): Promise<any> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        preferredLanguage: true,
        pushToken: true,
        countryCode: true,
        notificationChannels: true,
      },
    });
  }

  /**
   * Detecta el idioma del usuario
   * DOC36: Prioridad: preferencia > navegador > geo > default
   */
  private async detectLanguage(user: any): Promise<SupportedLanguage> {
    // 1. Preferencia del usuario
    if (user.preferredLanguage && Object.values(SupportedLanguage).includes(user.preferredLanguage)) {
      return user.preferredLanguage as SupportedLanguage;
    }

    // 2. Por país (geolocalización)
    if (user.countryCode && COUNTRY_TO_LANGUAGE[user.countryCode]) {
      return COUNTRY_TO_LANGUAGE[user.countryCode];
    }

    // 3. Default
    return DEFAULT_LANGUAGE;
  }

  /**
   * Verifica límites de frecuencia
   * DOC36: Engagement ≠ spam
   */
  private async checkFrequencyLimits(userId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Mensajes enviados hoy
    const todayCount = await this.prisma.messageSentLog.count({
      where: {
        userId,
        sentAt: { gte: startOfDay },
      },
    });

    if (todayCount >= FREQUENCY_LIMITS.maxPerDay) {
      return false;
    }

    // Verificar gap mínimo
    const lastMessage = await this.prisma.messageSentLog.findFirst({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    });

    if (lastMessage) {
      const minutesSinceLast =
        (Date.now() - lastMessage.sentAt.getTime()) / 1000 / 60;
      if (minutesSinceLast < FREQUENCY_LIMITS.minGapMinutes) {
        return false;
      }
    }

    return true;
  }

  /**
   * Renderiza un template con variables
   */
  private renderTemplate(
    template: any,
    variables: Record<string, string>
  ): RenderedMessage {
    let body = template.body;
    let subject = template.subject;
    let ctaText = template.ctaText;
    let ctaUrl = template.ctaUrl;

    // Reemplazar variables {{variable}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      body = body.replace(regex, value);
      if (subject) subject = subject.replace(regex, value);
      if (ctaText) ctaText = ctaText.replace(regex, value);
      if (ctaUrl) ctaUrl = ctaUrl.replace(regex, value);
    });

    return { subject, body, ctaText, ctaUrl };
  }

  /**
   * Despacha mensaje por canal
   */
  private async dispatch(
    channel: MessageChannel,
    user: any,
    message: RenderedMessage,
    templateKey: string
  ): Promise<void> {
    switch (channel) {
      case MessageChannel.PUSH:
        await this.sendPushNotification(user, message);
        break;
      case MessageChannel.EMAIL:
        await this.sendEmail(user, message);
        break;
      case MessageChannel.INTERNAL:
        await this.createInternalMessage(user.id, message, templateKey);
        break;
      default:
        this.logger.warn(`Channel ${channel} not implemented`);
    }
  }

  /**
   * Envía notificación push (mock)
   */
  private async sendPushNotification(user: any, message: RenderedMessage): Promise<void> {
    // TODO: Integrar con servicio real de push (Firebase, OneSignal, etc.)
    this.logger.log(`[MOCK] Push to ${user.id}: ${message.body.substring(0, 50)}...`);
  }

  /**
   * Envía email (mock)
   */
  private async sendEmail(user: any, message: RenderedMessage): Promise<void> {
    // TODO: Integrar con servicio real de email (SendGrid, SES, etc.)
    this.logger.log(`[MOCK] Email to ${user.email}: ${message.subject}`);
  }

  /**
   * Crea mensaje interno en BD
   */
  private async createInternalMessage(
    userId: string,
    message: RenderedMessage,
    templateKey: string
  ): Promise<void> {
    await this.prisma.internalMessage.create({
      data: {
        userId,
        templateKey,
        title: message.subject || templateKey,
        body: message.body,
        ctaText: message.ctaText,
        ctaUrl: message.ctaUrl,
        isRead: false,
      },
    });
  }

  /**
   * Registra mensaje enviado
   */
  private async logMessageSent(
    userId: string,
    templateKey: string,
    channels: MessageChannel[]
  ): Promise<void> {
    await this.prisma.messageSentLog.createMany({
      data: channels.map((channel) => ({
        userId,
        templateKey,
        channel,
        sentAt: new Date(),
      })),
    });
  }

  /**
   * Mapea a response de mensaje interno
   */
  private mapToInternalMessageResponse = (msg: any): InternalMessageResponseDto => ({
    id: msg.id,
    userId: msg.userId,
    templateKey: msg.templateKey,
    title: msg.title,
    body: msg.body,
    ctaText: msg.ctaText,
    ctaUrl: msg.ctaUrl,
    referenceType: msg.referenceType,
    referenceId: msg.referenceId,
    isRead: msg.isRead,
    readAt: msg.readAt,
    createdAt: msg.createdAt,
  });

  /**
   * Mapea a response de template
   */
  private mapToTemplateResponse = (template: any): MessageTemplateResponseDto => ({
    id: template.id,
    templateKey: template.templateKey,
    languageCode: template.languageCode as SupportedLanguage,
    channel: template.channel as MessageChannel,
    subject: template.subject,
    body: template.body,
    ctaText: template.ctaText,
    ctaUrl: template.ctaUrl,
    variables: template.variables,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  });
}
