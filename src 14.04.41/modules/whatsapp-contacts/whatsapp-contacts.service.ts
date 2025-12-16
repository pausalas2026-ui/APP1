// WhatsApp Contacts Service
// Gestión de contactos, importación y envío de mensajes
// Cumplimiento RGPD y anti-spam

import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  ContactStatus,
  ImportSource,
  ContactConsentStatus,
  WhatsAppMessageType,
  MessageSendStatus,
  WHATSAPP_SEND_LIMITS,
  CONTACT_VALIDATION_CONFIG,
  MESSAGE_TEMPLATES,
  WHATSAPP_CONTACTS_ERRORS,
  AUDIT_EVENTS,
} from './whatsapp-contacts.constants';
import {
  ImportContactsDto,
  AddContactDto,
  UpdateContactDto,
  ContactResponseDto,
  SendMessageToContactDto,
  SendBulkMessageDto,
  ShareSweepstakeDto,
  MessageSentResponseDto,
  BulkSendResponseDto,
  ContactsFilterDto,
  MessageHistoryFilterDto,
  RecordImportConsentDto,
  ContactOptOutDto,
  ContactsStatsResponseDto,
  MessagingStatsResponseDto,
  ValidatePhoneDto,
  PhoneValidationResponseDto,
  ProcessedContactDto,
} from './dto/whatsapp-contacts.dto';

@Injectable()
export class WhatsappContactsService {
  private readonly logger = new Logger(WhatsappContactsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GESTIÓN DE CONTACTOS
  // ============================================

  /**
   * Importar múltiples contactos desde dispositivo o archivo
   */
  async importContacts(
    userId: string,
    dto: ImportContactsDto,
  ): Promise<{
    imported: number;
    duplicates: number;
    invalid: number;
    contacts: ContactResponseDto[];
    errors: Array<{ contact: string; error: string }>;
  }> {
    this.logger.log(`User ${userId} importing ${dto.contacts.length} contacts from ${dto.source}`);

    // Validar consentimiento RGPD
    if (!dto.consentGranted) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.IMPORT_CONSENT_REQUIRED);
    }

    // Verificar límite de importación
    if (dto.contacts.length > WHATSAPP_SEND_LIMITS.maxContactsPerImport) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.IMPORT_LIMIT_EXCEEDED);
    }

    // Obtener contactos existentes del usuario para detectar duplicados
    const existingContacts = await this.prisma.whatsappContact?.findMany({
      where: { userId },
      select: { phoneNumber: true, normalizedPhone: true },
    }) || [];

    const existingPhones = new Set(existingContacts.map(c => c.normalizedPhone || c.phoneNumber));

    // Procesar cada contacto
    const results = {
      imported: 0,
      duplicates: 0,
      invalid: 0,
      contacts: [] as ContactResponseDto[],
      errors: [] as Array<{ contact: string; error: string }>,
    };

    for (const contactData of dto.contacts) {
      try {
        const processed = this.processContactData(contactData);

        if (processed.validationErrors.length > 0) {
          results.invalid++;
          results.errors.push({
            contact: contactData.name,
            error: processed.validationErrors.join(', '),
          });
          continue;
        }

        if (existingPhones.has(processed.normalizedPhone)) {
          if (dto.skipDuplicates) {
            results.duplicates++;
            continue;
          } else {
            results.errors.push({
              contact: contactData.name,
              error: WHATSAPP_CONTACTS_ERRORS.DUPLICATE_CONTACT,
            });
            results.duplicates++;
            continue;
          }
        }

        // Crear contacto en base de datos
        const contact = await this.createContactInDb(userId, {
          name: processed.name,
          phoneNumber: processed.phoneNumber,
          normalizedPhone: processed.normalizedPhone,
          phoneCountryCode: processed.phoneCountryCode,
          notes: processed.notes,
          tags: processed.tags,
          importSource: dto.source,
          status: ContactStatus.ACTIVE,
          consentStatus: ContactConsentStatus.PENDING, // El contacto aún no ha dado consentimiento
        });

        existingPhones.add(processed.normalizedPhone);
        results.imported++;
        results.contacts.push(contact);
      } catch (error) {
        results.errors.push({
          contact: contactData.name,
          error: error.message,
        });
        results.invalid++;
      }
    }

    // Registrar evento de auditoría
    await this.logAuditEvent(userId, AUDIT_EVENTS.CONTACTS_IMPORTED, {
      source: dto.source,
      totalRequested: dto.contacts.length,
      imported: results.imported,
      duplicates: results.duplicates,
      invalid: results.invalid,
    });

    this.logger.log(
      `Import completed for user ${userId}: ${results.imported} imported, ${results.duplicates} duplicates, ${results.invalid} invalid`,
    );

    return results;
  }

  /**
   * Agregar un contacto individual manualmente
   */
  async addContact(userId: string, dto: AddContactDto): Promise<ContactResponseDto> {
    this.logger.log(`User ${userId} adding contact ${dto.name}`);

    if (!dto.consentGranted) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.RGPD_CONSENT_MISSING);
    }

    const processed = this.processContactData(dto);

    if (processed.validationErrors.length > 0) {
      throw new BadRequestException(processed.validationErrors.join(', '));
    }

    // Verificar duplicado
    const existing = await this.prisma.whatsappContact?.findFirst({
      where: {
        userId,
        normalizedPhone: processed.normalizedPhone,
      },
    });

    if (existing) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.DUPLICATE_CONTACT);
    }

    const contact = await this.createContactInDb(userId, {
      name: processed.name,
      phoneNumber: processed.phoneNumber,
      normalizedPhone: processed.normalizedPhone,
      phoneCountryCode: processed.phoneCountryCode,
      notes: processed.notes,
      tags: processed.tags,
      importSource: ImportSource.MANUAL_ENTRY,
      status: ContactStatus.ACTIVE,
      consentStatus: ContactConsentStatus.PENDING,
    });

    await this.logAuditEvent(userId, AUDIT_EVENTS.CONTACT_ADDED, {
      contactId: contact.id,
      phoneNumber: this.maskPhoneNumber(processed.phoneNumber),
    });

    return contact;
  }

  /**
   * Obtener lista de contactos del usuario con filtros
   */
  async getContacts(
    userId: string,
    filters: ContactsFilterDto,
  ): Promise<{
    contacts: ContactResponseDto[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.consentStatus) {
      where.consentStatus = filters.consentStatus;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.search } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.canReceiveMessages) {
      where.status = ContactStatus.ACTIVE;
      where.consentStatus = { not: ContactConsentStatus.REVOKED };
    }

    // Ordenamiento
    const orderBy: any = {};
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    orderBy[sortField] = sortOrder;

    // Ejecutar consulta
    const [contacts, total] = await Promise.all([
      this.prisma.whatsappContact?.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }) || [],
      this.prisma.whatsappContact?.count({ where }) || 0,
    ]);

    return {
      contacts: contacts.map(c => this.mapToContactResponse(c)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener un contacto por ID
   */
  async getContact(userId: string, contactId: string): Promise<ContactResponseDto> {
    const contact = await this.prisma.whatsappContact?.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException(WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND);
    }

    return this.mapToContactResponse(contact);
  }

  /**
   * Actualizar un contacto
   */
  async updateContact(
    userId: string,
    contactId: string,
    dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    const contact = await this.prisma.whatsappContact?.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException(WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND);
    }

    const updated = await this.prisma.whatsappContact?.update({
      where: { id: contactId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.status && { status: dto.status }),
        updatedAt: new Date(),
      },
    });

    if (dto.status && dto.status !== contact.status) {
      await this.logAuditEvent(userId, AUDIT_EVENTS.CONTACT_STATUS_CHANGED, {
        contactId,
        oldStatus: contact.status,
        newStatus: dto.status,
      });
    }

    return this.mapToContactResponse(updated);
  }

  /**
   * Eliminar un contacto
   */
  async deleteContact(userId: string, contactId: string): Promise<void> {
    const contact = await this.prisma.whatsappContact?.findFirst({
      where: { id: contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException(WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND);
    }

    await this.prisma.whatsappContact?.delete({
      where: { id: contactId },
    });

    await this.logAuditEvent(userId, AUDIT_EVENTS.CONTACT_REMOVED, {
      contactId,
      phoneNumber: this.maskPhoneNumber(contact.phoneNumber),
    });
  }

  /**
   * Eliminar múltiples contactos
   */
  async deleteContacts(userId: string, contactIds: string[]): Promise<{ deleted: number }> {
    const result = await this.prisma.whatsappContact?.deleteMany({
      where: {
        id: { in: contactIds },
        userId,
      },
    });

    await this.logAuditEvent(userId, AUDIT_EVENTS.CONTACT_REMOVED, {
      contactIds,
      count: result?.count || 0,
    });

    return { deleted: result?.count || 0 };
  }

  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================

  /**
   * Enviar mensaje a un contacto individual
   */
  async sendMessage(
    userId: string,
    dto: SendMessageToContactDto,
  ): Promise<MessageSentResponseDto> {
    this.logger.log(`User ${userId} sending ${dto.messageType} message to contact ${dto.contactId}`);

    // Obtener contacto
    const contact = await this.prisma.whatsappContact?.findFirst({
      where: { id: dto.contactId, userId },
    });

    if (!contact) {
      throw new NotFoundException(WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND);
    }

    // Validar que el contacto puede recibir mensajes
    await this.validateCanSendMessage(userId, contact);

    // Renderizar mensaje desde template
    const language = dto.language || 'es';
    const renderedMessage = this.renderMessageTemplate(
      dto.messageType,
      language,
      {
        ...dto.variables,
        name: contact.name,
      },
      dto.customMessage,
    );

    // Simular envío (en producción conectaría con WhatsApp Business API)
    const messageResult = await this.simulateSendWhatsAppMessage(
      contact.phoneNumber,
      renderedMessage,
    );

    // Registrar mensaje en BD
    const messageLog = await this.createMessageLog(userId, {
      contactId: contact.id,
      messageType: dto.messageType,
      templateUsed: dto.messageType,
      renderedMessage,
      relatedSweepstakeId: dto.relatedSweepstakeId,
      relatedCauseId: dto.relatedCauseId,
      status: messageResult.success ? MessageSendStatus.SENT : MessageSendStatus.FAILED,
      metadata: { error: messageResult.error },
    });

    // Actualizar contador del contacto
    await this.prisma.whatsappContact?.update({
      where: { id: contact.id },
      data: {
        lastMessageSentAt: new Date(),
        messagesSentCount: { increment: 1 },
      },
    });

    // Auditoría
    await this.logAuditEvent(
      userId,
      messageResult.success ? AUDIT_EVENTS.MESSAGE_SENT : AUDIT_EVENTS.MESSAGE_FAILED,
      {
        contactId: contact.id,
        messageType: dto.messageType,
        error: messageResult.error,
      },
    );

    return {
      id: messageLog.id,
      contactId: contact.id,
      contactName: contact.name,
      phoneNumber: this.maskPhoneNumber(contact.phoneNumber),
      messageType: dto.messageType,
      status: messageResult.success ? MessageSendStatus.SENT : MessageSendStatus.FAILED,
      sentAt: messageResult.success ? new Date() : undefined,
      error: messageResult.error,
    };
  }

  /**
   * Enviar mensaje a múltiples contactos
   */
  async sendBulkMessage(
    userId: string,
    dto: SendBulkMessageDto,
  ): Promise<BulkSendResponseDto> {
    this.logger.log(`User ${userId} sending bulk ${dto.messageType} to ${dto.contactIds.length} contacts`);

    const results: BulkSendResponseDto = {
      totalRequested: dto.contactIds.length,
      successCount: 0,
      failedCount: 0,
      skippedCount: 0,
      results: [],
      errors: [],
      skipped: [],
    };

    // Verificar límite diario
    const todayMessageCount = await this.getTodayMessageCount(userId);
    const remainingQuota = WHATSAPP_SEND_LIMITS.maxTotalMessagesPerDay - todayMessageCount;

    if (remainingQuota <= 0) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.DAILY_LIMIT_EXCEEDED);
    }

    // Limitar al quota disponible
    const contactsToProcess = dto.contactIds.slice(0, remainingQuota);

    for (const contactId of contactsToProcess) {
      try {
        const result = await this.sendMessage(userId, {
          contactId,
          messageType: dto.messageType,
          variables: dto.variables,
          customMessage: dto.customMessage,
          language: dto.language,
          relatedSweepstakeId: dto.relatedSweepstakeId,
          relatedCauseId: dto.relatedCauseId,
        });

        if (result.status === MessageSendStatus.SENT) {
          results.successCount++;
        } else {
          results.failedCount++;
          results.errors.push({
            contactId,
            contactName: result.contactName,
            error: result.error || 'Error desconocido',
          });
        }

        results.results.push(result);

        // Rate limiting entre mensajes
        await this.delay(100);
      } catch (error) {
        if (error.message.includes('límite') || error.message.includes('limit')) {
          results.skippedCount++;
          results.skipped.push({
            contactId,
            contactName: 'Unknown',
            reason: error.message,
          });
        } else {
          results.failedCount++;
          results.errors.push({
            contactId,
            contactName: 'Unknown',
            error: error.message,
          });
        }
      }
    }

    // Si había más contactos que el quota
    if (dto.contactIds.length > remainingQuota) {
      const skippedDueToQuota = dto.contactIds.slice(remainingQuota);
      for (const contactId of skippedDueToQuota) {
        results.skippedCount++;
        results.skipped.push({
          contactId,
          contactName: 'Unknown',
          reason: 'Límite diario excedido',
        });
      }
    }

    return results;
  }

  /**
   * Compartir un sorteo con contactos seleccionados
   */
  async shareSweepstake(
    userId: string,
    dto: ShareSweepstakeDto,
  ): Promise<BulkSendResponseDto> {
    this.logger.log(`User ${userId} sharing sweepstake ${dto.sweepstakeId} with ${dto.contactIds.length} contacts`);

    // Obtener datos del sorteo
    const sweepstake = await this.prisma.sweepstake?.findUnique({
      where: { id: dto.sweepstakeId },
      include: { prize: true, cause: true },
    });

    if (!sweepstake) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Obtener nombre del usuario que comparte
    const user = await this.prisma.user?.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    return this.sendBulkMessage(userId, {
      contactIds: dto.contactIds,
      messageType: WhatsAppMessageType.SORTEO_INVITE,
      variables: {
        senderName: user?.name || 'Un amigo',
        prizeName: sweepstake.prize?.name || 'Premio sorpresa',
        causeName: sweepstake.cause?.name || 'Causa solidaria',
        sweepstakeName: sweepstake.name || 'Sorteo',
        link: `https://ilovetohelp.com/s/${sweepstake.id}`,
        customMessage: dto.personalMessage,
      },
      language: dto.language,
      relatedSweepstakeId: dto.sweepstakeId,
    });
  }

  // ============================================
  // OPT-OUT Y CONSENTIMIENTO
  // ============================================

  /**
   * Registrar opt-out de un contacto (puede ser llamado por webhook)
   */
  async registerOptOut(dto: ContactOptOutDto): Promise<void> {
    this.logger.log(`Processing opt-out request for ${this.maskPhoneNumber(dto.phoneNumber)}`);

    // Normalizar número
    const normalizedPhone = this.normalizePhoneNumber(dto.phoneNumber);

    // Buscar todos los contactos con ese número
    const contacts = await this.prisma.whatsappContact?.findMany({
      where: { normalizedPhone },
    });

    if (contacts && contacts.length > 0) {
      // Marcar todos como bloqueados
      await this.prisma.whatsappContact?.updateMany({
        where: { normalizedPhone },
        data: {
          status: ContactStatus.BLOCKED,
          consentStatus: ContactConsentStatus.REVOKED,
          updatedAt: new Date(),
        },
      });

      // Auditoría para cada usuario afectado
      for (const contact of contacts) {
        await this.logAuditEvent(contact.userId, AUDIT_EVENTS.OPT_OUT_REQUESTED, {
          contactId: contact.id,
          phoneNumber: this.maskPhoneNumber(dto.phoneNumber),
          reason: dto.reason,
        });
      }
    }
  }

  /**
   * Registrar consentimiento de importación
   */
  async recordImportConsent(
    userId: string,
    dto: RecordImportConsentDto,
  ): Promise<{ recorded: boolean; timestamp: Date }> {
    const timestamp = new Date();

    // Guardar registro de consentimiento
    await this.prisma.userConsent?.create({
      data: {
        userId,
        consentType: 'WHATSAPP_IMPORT',
        granted: dto.consentGranted,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        deviceId: dto.deviceId,
        timestamp,
      },
    });

    await this.logAuditEvent(
      userId,
      dto.consentGranted ? AUDIT_EVENTS.CONSENT_GRANTED : AUDIT_EVENTS.CONSENT_REVOKED,
      {
        consentType: 'WHATSAPP_IMPORT',
        ipAddress: this.maskIpAddress(dto.ipAddress),
      },
    );

    return { recorded: true, timestamp };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtener estadísticas de contactos del usuario
   */
  async getContactsStats(userId: string): Promise<ContactsStatsResponseDto> {
    const contacts = await this.prisma.whatsappContact?.findMany({
      where: { userId },
      select: {
        status: true,
        consentStatus: true,
        importSource: true,
        createdAt: true,
      },
    }) || [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats: ContactsStatsResponseDto = {
      totalContacts: contacts.length,
      activeContacts: contacts.filter(c => c.status === ContactStatus.ACTIVE).length,
      inactiveContacts: contacts.filter(c => c.status === ContactStatus.INACTIVE).length,
      blockedContacts: contacts.filter(c => c.status === ContactStatus.BLOCKED).length,
      pendingContacts: contacts.filter(c => c.status === ContactStatus.PENDING).length,
      contactsWithConsent: contacts.filter(c => c.consentStatus === ContactConsentStatus.GRANTED).length,
      contactsBySource: {
        [ImportSource.DEVICE_CONTACTS]: contacts.filter(c => c.importSource === ImportSource.DEVICE_CONTACTS).length,
        [ImportSource.MANUAL_ENTRY]: contacts.filter(c => c.importSource === ImportSource.MANUAL_ENTRY).length,
        [ImportSource.CSV_UPLOAD]: contacts.filter(c => c.importSource === ImportSource.CSV_UPLOAD).length,
        [ImportSource.VCARD]: contacts.filter(c => c.importSource === ImportSource.VCARD).length,
      },
      recentImports: contacts.filter(c => c.createdAt >= thirtyDaysAgo).length,
    };

    return stats;
  }

  /**
   * Obtener estadísticas de mensajes del usuario
   */
  async getMessagingStats(userId: string): Promise<MessagingStatsResponseDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Obtener todos los mensajes del usuario
    const messages = await this.prisma.whatsappMessageLog?.findMany({
      where: { userId },
      include: { contact: { select: { id: true, name: true } } },
    }) || [];

    const thisMonthMessages = messages.filter(m => m.createdAt >= startOfMonth);
    const todayMessages = messages.filter(m => m.createdAt >= startOfDay);

    const sentMessages = messages.filter(m => m.status !== MessageSendStatus.QUEUED);
    const deliveredMessages = messages.filter(m => 
      [MessageSendStatus.DELIVERED, MessageSendStatus.READ].includes(m.status as MessageSendStatus)
    );
    const readMessages = messages.filter(m => m.status === MessageSendStatus.READ);
    const failedMessages = messages.filter(m => m.status === MessageSendStatus.FAILED);

    // Contar por tipo
    const messagesByType: Record<WhatsAppMessageType, number> = {
      [WhatsAppMessageType.SORTEO_INVITE]: 0,
      [WhatsAppMessageType.SORTEO_NEW]: 0,
      [WhatsAppMessageType.SORTEO_RESULT]: 0,
      [WhatsAppMessageType.PROMOTION]: 0,
      [WhatsAppMessageType.CAUSE_UPDATE]: 0,
      [WhatsAppMessageType.CUSTOM]: 0,
      [WhatsAppMessageType.REMINDER]: 0,
    };

    for (const msg of messages) {
      if (messagesByType[msg.messageType as WhatsAppMessageType] !== undefined) {
        messagesByType[msg.messageType as WhatsAppMessageType]++;
      }
    }

    // Top contactos
    const contactMessageCount = new Map<string, { id: string; name: string; count: number }>();
    for (const msg of messages) {
      if (msg.contact) {
        const existing = contactMessageCount.get(msg.contactId);
        if (existing) {
          existing.count++;
        } else {
          contactMessageCount.set(msg.contactId, {
            id: msg.contact.id,
            name: msg.contact.name,
            count: 1,
          });
        }
      }
    }

    const topContacts = Array.from(contactMessageCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(c => ({
        contactId: c.id,
        contactName: c.name,
        messageCount: c.count,
      }));

    return {
      totalMessagesSent: sentMessages.length,
      messagesThisMonth: thisMonthMessages.length,
      messagesToday: todayMessages.length,
      deliveryRate: sentMessages.length > 0 
        ? Math.round((deliveredMessages.length / sentMessages.length) * 100) 
        : 0,
      readRate: sentMessages.length > 0 
        ? Math.round((readMessages.length / sentMessages.length) * 100) 
        : 0,
      failureRate: sentMessages.length > 0 
        ? Math.round((failedMessages.length / sentMessages.length) * 100) 
        : 0,
      messagesByType,
      topContactsMessaged: topContacts,
      remainingDailyQuota: WHATSAPP_SEND_LIMITS.maxTotalMessagesPerDay - todayMessages.length,
    };
  }

  /**
   * Obtener historial de mensajes
   */
  async getMessageHistory(
    userId: string,
    filters: MessageHistoryFilterDto,
  ): Promise<{
    messages: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }
    if (filters.messageType) {
      where.messageType = filters.messageType;
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.fromDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.fromDate) };
    }
    if (filters.toDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.toDate) };
    }

    const [messages, total] = await Promise.all([
      this.prisma.whatsappMessageLog?.findMany({
        where,
        include: { contact: { select: { id: true, name: true, phoneNumber: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }) || [],
      this.prisma.whatsappMessageLog?.count({ where }) || 0,
    ]);

    return {
      messages: messages.map(m => ({
        ...m,
        contact: m.contact ? {
          ...m.contact,
          phoneNumber: this.maskPhoneNumber(m.contact.phoneNumber),
        } : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============================================
  // VALIDACIÓN DE NÚMEROS
  // ============================================

  /**
   * Validar formato de número de teléfono
   */
  async validatePhone(dto: ValidatePhoneDto): Promise<PhoneValidationResponseDto> {
    const isValid = CONTACT_VALIDATION_CONFIG.phoneRegex.test(dto.phoneNumber);
    const countryCode = this.extractCountryCode(dto.phoneNumber);
    const countryName = this.getCountryNameFromCode(countryCode);

    return {
      phoneNumber: dto.phoneNumber,
      isValid,
      hasWhatsApp: isValid, // Simulado - requeriría WhatsApp Business API
      countryCode,
      countryName,
      formattedNumber: this.formatPhoneNumber(dto.phoneNumber),
    };
  }

  // ============================================
  // MÉTODOS PRIVADOS AUXILIARES
  // ============================================

  /**
   * Procesar y validar datos de un contacto
   */
  private processContactData(contact: { name: string; phoneNumber: string; notes?: string; tags?: string[] }): ProcessedContactDto {
    const errors: string[] = [];

    // Validar nombre
    if (!contact.name || contact.name.length < CONTACT_VALIDATION_CONFIG.minNameLength) {
      errors.push('Nombre demasiado corto');
    }
    if (contact.name && contact.name.length > CONTACT_VALIDATION_CONFIG.maxNameLength) {
      errors.push('Nombre demasiado largo');
    }

    // Validar y normalizar teléfono
    const normalizedPhone = this.normalizePhoneNumber(contact.phoneNumber);
    const isValidPhone = CONTACT_VALIDATION_CONFIG.phoneRegex.test(normalizedPhone);

    if (!isValidPhone) {
      errors.push(WHATSAPP_CONTACTS_ERRORS.INVALID_PHONE_FORMAT);
    }

    const countryCode = this.extractCountryCode(normalizedPhone);

    return {
      name: contact.name?.trim() || '',
      phoneNumber: contact.phoneNumber,
      normalizedPhone,
      phoneCountryCode: countryCode,
      notes: contact.notes?.trim(),
      tags: contact.tags,
      isDuplicate: false, // Se determina externamente
      validationErrors: errors,
    };
  }

  /**
   * Crear contacto en base de datos
   */
  private async createContactInDb(
    userId: string,
    data: {
      name: string;
      phoneNumber: string;
      normalizedPhone: string;
      phoneCountryCode: string;
      notes?: string;
      tags?: string[];
      importSource: ImportSource;
      status: ContactStatus;
      consentStatus: ContactConsentStatus;
    },
  ): Promise<ContactResponseDto> {
    // Simulación - en producción usaría Prisma real
    const contact = {
      id: this.generateId(),
      userId,
      name: data.name,
      phoneNumber: data.phoneNumber,
      normalizedPhone: data.normalizedPhone,
      phoneCountryCode: data.phoneCountryCode,
      status: data.status,
      consentStatus: data.consentStatus,
      importSource: data.importSource,
      notes: data.notes || null,
      tags: data.tags || [],
      lastMessageSentAt: null,
      messagesSentCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // En producción: await this.prisma.whatsappContact.create({ data: contact });

    return this.mapToContactResponse(contact);
  }

  /**
   * Crear registro de mensaje
   */
  private async createMessageLog(
    userId: string,
    data: {
      contactId: string;
      messageType: WhatsAppMessageType;
      templateUsed: string;
      renderedMessage: string;
      relatedSweepstakeId?: string;
      relatedCauseId?: string;
      status: MessageSendStatus;
      metadata?: Record<string, any>;
    },
  ): Promise<{ id: string }> {
    const log = {
      id: this.generateId(),
      userId,
      ...data,
      createdAt: new Date(),
    };

    // En producción: await this.prisma.whatsappMessageLog.create({ data: log });

    return { id: log.id };
  }

  /**
   * Validar si se puede enviar mensaje a un contacto
   */
  private async validateCanSendMessage(userId: string, contact: any): Promise<void> {
    // Verificar estado del contacto
    if (contact.status === ContactStatus.BLOCKED) {
      throw new ForbiddenException(WHATSAPP_CONTACTS_ERRORS.CONTACT_BLOCKED);
    }

    if (contact.status === ContactStatus.INACTIVE) {
      throw new ForbiddenException(WHATSAPP_CONTACTS_ERRORS.CONTACT_OPTED_OUT);
    }

    if (contact.consentStatus === ContactConsentStatus.REVOKED) {
      throw new ForbiddenException(WHATSAPP_CONTACTS_ERRORS.CONTACT_OPTED_OUT);
    }

    // Verificar horario permitido
    const currentHour = new Date().getHours();
    if (currentHour < WHATSAPP_SEND_LIMITS.allowedSendHours.start ||
        currentHour >= WHATSAPP_SEND_LIMITS.allowedSendHours.end) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.OUTSIDE_SEND_HOURS);
    }

    // Verificar límite diario total
    const todayCount = await this.getTodayMessageCount(userId);
    if (todayCount >= WHATSAPP_SEND_LIMITS.maxTotalMessagesPerDay) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.DAILY_LIMIT_EXCEEDED);
    }

    // Verificar límite por contacto
    const contactTodayCount = await this.getContactTodayMessageCount(contact.id);
    if (contactTodayCount >= WHATSAPP_SEND_LIMITS.maxMessagesPerContactPerDay) {
      throw new BadRequestException(WHATSAPP_CONTACTS_ERRORS.CONTACT_LIMIT_EXCEEDED);
    }

    // Verificar días mínimos entre mensajes
    if (contact.lastMessageSentAt) {
      const daysSinceLastMessage = this.daysBetween(contact.lastMessageSentAt, new Date());
      if (daysSinceLastMessage < WHATSAPP_SEND_LIMITS.minDaysBetweenMessages) {
        throw new BadRequestException(
          `Debe esperar ${WHATSAPP_SEND_LIMITS.minDaysBetweenMessages - daysSinceLastMessage} días más para enviar otro mensaje a este contacto`,
        );
      }
    }
  }

  /**
   * Renderizar template de mensaje
   */
  private renderMessageTemplate(
    messageType: WhatsAppMessageType,
    language: string,
    variables: Record<string, any>,
    customMessage?: string,
  ): string {
    if (messageType === WhatsAppMessageType.CUSTOM && customMessage) {
      return customMessage;
    }

    const template = MESSAGE_TEMPLATES[messageType];
    const templateText = template[language as 'es' | 'en'] || template.es;

    // Reemplazar variables
    let rendered = templateText;
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined) {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      }
    }

    // Limpiar variables no reemplazadas
    rendered = rendered.replace(/{{[^}]+}}/g, '');

    // Agregar mensaje de opt-out
    const optOutMessage = language === 'en'
      ? '\n\nReply STOP to unsubscribe.'
      : '\n\nResponde STOP para darte de baja.';

    return rendered + optOutMessage;
  }

  /**
   * Simular envío de mensaje WhatsApp (MVP)
   */
  private async simulateSendWhatsAppMessage(
    phoneNumber: string,
    message: string,
  ): Promise<{ success: boolean; error?: string }> {
    // En MVP: simular éxito
    // En producción: integrar con WhatsApp Business API
    this.logger.debug(`[SIMULATED] WhatsApp message to ${this.maskPhoneNumber(phoneNumber)}: ${message.substring(0, 50)}...`);

    // Simular tasa de error del 5%
    const random = Math.random();
    if (random < 0.05) {
      return { success: false, error: 'Simulación de error de envío' };
    }

    return { success: true };
  }

  /**
   * Obtener conteo de mensajes del día
   */
  private async getTodayMessageCount(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.whatsappMessageLog?.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    }) || 0;
  }

  /**
   * Obtener conteo de mensajes a un contacto hoy
   */
  private async getContactTodayMessageCount(contactId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.whatsappMessageLog?.count({
      where: {
        contactId,
        createdAt: { gte: startOfDay },
      },
    }) || 0;
  }

  /**
   * Normalizar número de teléfono
   */
  private normalizePhoneNumber(phone: string): string {
    // Eliminar espacios, guiones, paréntesis
    let normalized = phone.replace(/[\s\-\(\)\.]/g, '');
    
    // Asegurar que empiece con +
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }

  /**
   * Extraer código de país del número
   */
  private extractCountryCode(phone: string): string {
    const normalized = this.normalizePhoneNumber(phone);
    
    for (const code of CONTACT_VALIDATION_CONFIG.allowedCountryCodes) {
      if (normalized.startsWith(code)) {
        return code;
      }
    }
    
    // Extraer los primeros 2-4 dígitos después del +
    const match = normalized.match(/^\+(\d{1,4})/);
    return match ? `+${match[1]}` : '+??';
  }

  /**
   * Obtener nombre del país desde código
   */
  private getCountryNameFromCode(code: string): string {
    const countries: Record<string, string> = {
      '+34': 'España',
      '+1': 'Estados Unidos/Canadá',
      '+52': 'México',
      '+54': 'Argentina',
      '+57': 'Colombia',
      '+56': 'Chile',
      '+51': 'Perú',
      '+593': 'Ecuador',
      '+58': 'Venezuela',
      '+55': 'Brasil',
      '+44': 'Reino Unido',
      '+33': 'Francia',
      '+49': 'Alemania',
      '+39': 'Italia',
    };
    return countries[code] || 'Desconocido';
  }

  /**
   * Formatear número para mostrar
   */
  private formatPhoneNumber(phone: string): string {
    const normalized = this.normalizePhoneNumber(phone);
    // Formato simple: +XX XXX XXX XXX
    return normalized.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
  }

  /**
   * Enmascarar número de teléfono para logs
   */
  private maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 8) return '***';
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 3);
  }

  /**
   * Enmascarar IP para logs
   */
  private maskIpAddress(ip: string): string {
    if (!ip) return '***';
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
    return ip.substring(0, 4) + '***';
  }

  /**
   * Mapear entidad a DTO de respuesta
   */
  private mapToContactResponse(contact: any): ContactResponseDto {
    return {
      id: contact.id,
      userId: contact.userId,
      name: contact.name,
      phoneNumber: this.maskPhoneNumber(contact.phoneNumber),
      phoneCountryCode: contact.phoneCountryCode,
      status: contact.status,
      consentStatus: contact.consentStatus,
      importSource: contact.importSource,
      notes: contact.notes,
      tags: contact.tags,
      lastMessageSentAt: contact.lastMessageSentAt,
      messagesSentCount: contact.messagesSentCount || 0,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt,
    };
  }

  /**
   * Registrar evento de auditoría
   */
  private async logAuditEvent(
    userId: string,
    eventType: string,
    details: Record<string, any>,
  ): Promise<void> {
    // En producción: guardar en tabla de auditoría
    this.logger.log(`[AUDIT] User ${userId}: ${eventType} - ${JSON.stringify(details)}`);
  }

  /**
   * Calcular días entre dos fechas
   */
  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / oneDay);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generar ID único
   */
  private generateId(): string {
    return 'wa_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}
