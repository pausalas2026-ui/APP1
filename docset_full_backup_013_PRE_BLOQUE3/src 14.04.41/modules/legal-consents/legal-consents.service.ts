/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Servicio principal para gestión de consentimientos legales
 * 
 * PRINCIPIOS FUNDAMENTALES:
 * 1. Los consentimientos son INMUTABLES (nunca se borran)
 * 2. Cada consentimiento registra IP, fecha, versión
 * 3. Los documentos legales son versionados
 * 4. Consentimiento ≠ KYC (no mezclar conceptos)
 * 5. Cancelación de suscripción ≠ Invalidación de consentimientos
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConsentType,
  ConsentContext,
  DocumentType,
  ConsentReferenceType,
  REQUIRED_CONSENTS_BY_CONTEXT,
  CONSENT_TO_DOCUMENT_TYPE,
  CONSENT_CONFIG,
  CONSENT_ERRORS,
  CONSENT_UX_TEXTS,
  isValidVersion,
  compareVersions,
  buildRaffleConsentType,
  requiresReferenceId,
} from './legal-consents.constants';
import {
  RecordConsentDto,
  RecordBulkConsentsDto,
  CheckConsentDto,
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  FilterConsentsDto,
  ConsentResponseDto,
  ConsentHistoryResponseDto,
  ConsentCheckResponseDto,
  LegalDocumentResponseDto,
  LegalDocumentsListResponseDto,
  RequiredConsentsResponseDto,
  ConsentStatsResponseDto,
  ConsentSuccessResponseDto,
} from './dto/legal-consents.dto';

@Injectable()
export class LegalConsentsService {
  private readonly logger = new Logger(LegalConsentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // MÉTODOS PÚBLICOS - USUARIO
  // ============================================

  /**
   * Registra un consentimiento individual
   * DOC35: Todo consentimiento debe registrarse con IP, fecha, versión
   */
  async recordConsent(dto: RecordConsentDto): Promise<ConsentSuccessResponseDto> {
    this.logger.log(`Recording consent: ${dto.consentType} for user/participant/session`);

    // Validar que hay al menos un identificador
    this.validateIdentifier(dto.userId, dto.participantId, dto.sessionId);

    // Validar que SORTEO tiene referenceId
    if (dto.consentType === ConsentType.SORTEO && !dto.referenceId) {
      throw new BadRequestException(CONSENT_ERRORS.MISSING_REFERENCE_ID);
    }

    // Obtener versión actual del documento
    const currentDoc = await this.getCurrentDocumentVersion(
      CONSENT_TO_DOCUMENT_TYPE[dto.consentType]
    );

    // Verificar que la versión coincide con la actual
    if (dto.documentVersion !== currentDoc.version) {
      this.logger.warn(
        `Version mismatch: provided ${dto.documentVersion}, current ${currentDoc.version}`
      );
      // Permitir pero loggear - el usuario podría estar aceptando una versión que acaba de cambiar
    }

    // Crear registro inmutable
    const consent = await this.prisma.userConsent.create({
      data: {
        userId: dto.userId,
        participantId: dto.participantId,
        sessionId: dto.sessionId,
        consentType: dto.consentType,
        documentVersion: dto.documentVersion,
        referenceType: dto.referenceType,
        referenceId: dto.referenceId,
        acceptedAt: new Date(),
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
        fingerprint: dto.fingerprint,
      },
    });

    this.logger.log(`Consent recorded: ${consent.id}`);

    return {
      success: true,
      message: 'Consentimiento registrado correctamente',
      consentId: consent.id,
    };
  }

  /**
   * Registra múltiples consentimientos según contexto
   * DOC35: Registro requiere TOS + PRIVACY, Sorteo requiere SORTEO + PRIVACY
   */
  async recordBulkConsents(dto: RecordBulkConsentsDto): Promise<ConsentSuccessResponseDto> {
    this.logger.log(`Recording bulk consents for context: ${dto.context}`);

    // Validar identificador
    this.validateIdentifier(dto.userId, dto.participantId, dto.sessionId);

    // Obtener consentimientos requeridos para este contexto
    const requiredConsents = REQUIRED_CONSENTS_BY_CONTEXT[dto.context];

    if (!requiredConsents || requiredConsents.length === 0) {
      return {
        success: true,
        message: 'No se requieren consentimientos para este contexto',
      };
    }

    // Obtener versiones actuales de los documentos
    const currentVersions = await this.getCurrentVersionsForConsents(requiredConsents);

    // Crear todos los consentimientos en una transacción
    const consents = await this.prisma.$transaction(
      requiredConsents.map((consentType) => {
        const documentType = CONSENT_TO_DOCUMENT_TYPE[consentType];
        const version = currentVersions[documentType];

        return this.prisma.userConsent.create({
          data: {
            userId: dto.userId,
            participantId: dto.participantId,
            sessionId: dto.sessionId,
            consentType: consentType,
            documentVersion: version,
            referenceType:
              consentType === ConsentType.SORTEO
                ? ConsentReferenceType.RAFFLE
                : undefined,
            referenceId:
              consentType === ConsentType.SORTEO ? dto.referenceId : undefined,
            acceptedAt: new Date(),
            ipAddress: dto.ipAddress,
            userAgent: dto.userAgent,
            fingerprint: dto.fingerprint,
          },
        });
      })
    );

    this.logger.log(`Bulk consents recorded: ${consents.length} consents`);

    return {
      success: true,
      message: `${consents.length} consentimientos registrados correctamente`,
    };
  }

  /**
   * Verifica si un usuario tiene consentimiento válido
   */
  async checkConsent(dto: CheckConsentDto): Promise<ConsentCheckResponseDto> {
    this.logger.log(`Checking consent: ${dto.consentType} for user ${dto.userId}`);

    // Buscar el consentimiento más reciente
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId: dto.userId,
        consentType: dto.consentType,
        ...(dto.referenceId && { referenceId: dto.referenceId }),
      },
      orderBy: { acceptedAt: 'desc' },
    });

    if (!consent) {
      return {
        hasConsent: false,
      };
    }

    // Obtener versión actual del documento
    const documentType = CONSENT_TO_DOCUMENT_TYPE[dto.consentType];
    let currentDoc: any;
    
    try {
      currentDoc = await this.getCurrentDocumentVersion(documentType);
    } catch (error) {
      // Si no hay documento actual, el consentimiento sigue siendo válido
      return {
        hasConsent: true,
        acceptedVersion: consent.documentVersion,
        acceptedAt: consent.acceptedAt,
      };
    }

    const hasNewerVersion = compareVersions(currentDoc.version, consent.documentVersion) > 0;

    return {
      hasConsent: true,
      acceptedVersion: consent.documentVersion,
      acceptedAt: consent.acceptedAt,
      hasNewerVersion,
      currentVersion: currentDoc.version,
    };
  }

  /**
   * Verifica si un usuario tiene todos los consentimientos para un contexto
   */
  async hasAllConsentsForContext(
    userId: string,
    context: ConsentContext,
    referenceId?: string
  ): Promise<boolean> {
    const requiredConsents = REQUIRED_CONSENTS_BY_CONTEXT[context];

    if (!requiredConsents || requiredConsents.length === 0) {
      return true;
    }

    for (const consentType of requiredConsents) {
      const check = await this.checkConsent({
        userId,
        consentType,
        referenceId: consentType === ConsentType.SORTEO ? referenceId : undefined,
      });

      if (!check.hasConsent) {
        return false;
      }
    }

    return true;
  }

  /**
   * Obtiene el historial de consentimientos de un usuario
   */
  async getConsentHistory(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ConsentHistoryResponseDto> {
    this.logger.log(`Getting consent history for user ${userId}`);

    const skip = (page - 1) * limit;

    const [consents, total] = await Promise.all([
      this.prisma.userConsent.findMany({
        where: { userId },
        orderBy: { acceptedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userConsent.count({
        where: { userId },
      }),
    ]);

    return {
      consents: consents.map(this.mapToConsentResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene los consentimientos requeridos para un contexto
   */
  async getRequiredConsentsForContext(
    context: ConsentContext,
    referenceId?: string
  ): Promise<RequiredConsentsResponseDto> {
    const requiredConsents = REQUIRED_CONSENTS_BY_CONTEXT[context];
    const uxText = CONSENT_UX_TEXTS[context];

    // Obtener versiones actuales
    const currentVersions: Record<ConsentType, string> = {} as any;

    for (const consentType of requiredConsents) {
      try {
        const doc = await this.getCurrentDocumentVersion(
          CONSENT_TO_DOCUMENT_TYPE[consentType]
        );
        currentVersions[consentType] = doc.version;
      } catch {
        currentVersions[consentType] = '1.0.0'; // Versión por defecto si no existe
      }
    }

    // Reemplazar {id} en paths si hay referenceId
    const processedUxText = {
      text: uxText.text,
      links: uxText.links.map((link) => ({
        ...link,
        path: referenceId ? link.path.replace('{id}', referenceId) : link.path,
      })),
    };

    return {
      context,
      requiredConsents,
      uxText: processedUxText,
      currentVersions,
    };
  }

  /**
   * Obtiene un documento legal por tipo (versión actual)
   */
  async getCurrentLegalDocument(documentType: DocumentType): Promise<LegalDocumentResponseDto> {
    const doc = await this.getCurrentDocumentVersion(documentType);
    return this.mapToLegalDocumentResponse(doc);
  }

  /**
   * Obtiene todos los documentos legales actuales
   */
  async getAllCurrentLegalDocuments(): Promise<LegalDocumentsListResponseDto> {
    const documents = await this.prisma.legalDocument.findMany({
      where: { isCurrent: true },
      orderBy: { documentType: 'asc' },
    });

    return {
      documents: documents.map(this.mapToLegalDocumentResponse),
      total: documents.length,
    };
  }

  // ============================================
  // MÉTODOS ADMIN - GESTIÓN DE DOCUMENTOS
  // ============================================

  /**
   * Crea un nuevo documento legal
   * DOC35: Nunca borrar versiones anteriores
   */
  async createLegalDocument(
    dto: CreateLegalDocumentDto,
    createdBy: string
  ): Promise<LegalDocumentResponseDto> {
    this.logger.log(`Creating legal document: ${dto.documentType} v${dto.version}`);

    // Validar formato de versión
    if (!isValidVersion(dto.version)) {
      throw new BadRequestException(CONSENT_ERRORS.INVALID_VERSION_FORMAT);
    }

    // Verificar que no existe ya esta versión
    const existing = await this.prisma.legalDocument.findFirst({
      where: {
        documentType: dto.documentType,
        version: dto.version,
      },
    });

    if (existing) {
      throw new BadRequestException(CONSENT_ERRORS.DUPLICATE_VERSION);
    }

    // Si es la versión actual, desmarcar la anterior
    if (dto.isCurrent) {
      await this.prisma.legalDocument.updateMany({
        where: {
          documentType: dto.documentType,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
    }

    const document = await this.prisma.legalDocument.create({
      data: {
        documentType: dto.documentType,
        version: dto.version,
        title: dto.title,
        content: dto.content,
        summary: dto.summary,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
        isCurrent: dto.isCurrent ?? false,
        createdBy,
      },
    });

    this.logger.log(`Legal document created: ${document.id}`);

    return this.mapToLegalDocumentResponse(document);
  }

  /**
   * Actualiza un documento legal (solo campos no críticos)
   */
  async updateLegalDocument(
    documentId: string,
    dto: UpdateLegalDocumentDto
  ): Promise<LegalDocumentResponseDto> {
    this.logger.log(`Updating legal document: ${documentId}`);

    const existing = await this.prisma.legalDocument.findUnique({
      where: { id: documentId },
    });

    if (!existing) {
      throw new NotFoundException(CONSENT_ERRORS.DOCUMENT_NOT_FOUND);
    }

    // Si se marca como actual, desmarcar la anterior
    if (dto.isCurrent === true && !existing.isCurrent) {
      await this.prisma.legalDocument.updateMany({
        where: {
          documentType: existing.documentType,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
    }

    const updated = await this.prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        title: dto.title,
        content: dto.content,
        summary: dto.summary,
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
        isCurrent: dto.isCurrent,
      },
    });

    return this.mapToLegalDocumentResponse(updated);
  }

  /**
   * Obtiene todos los documentos legales (admin)
   */
  async getAllLegalDocuments(
    documentType?: DocumentType
  ): Promise<LegalDocumentsListResponseDto> {
    const documents = await this.prisma.legalDocument.findMany({
      where: documentType ? { documentType } : undefined,
      orderBy: [{ documentType: 'asc' }, { version: 'desc' }],
    });

    return {
      documents: documents.map(this.mapToLegalDocumentResponse),
      total: documents.length,
    };
  }

  /**
   * Obtiene un documento legal por ID
   */
  async getLegalDocumentById(documentId: string): Promise<LegalDocumentResponseDto> {
    const document = await this.prisma.legalDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(CONSENT_ERRORS.DOCUMENT_NOT_FOUND);
    }

    return this.mapToLegalDocumentResponse(document);
  }

  /**
   * Obtiene historial de versiones de un documento
   */
  async getDocumentVersionHistory(
    documentType: DocumentType
  ): Promise<LegalDocumentsListResponseDto> {
    const documents = await this.prisma.legalDocument.findMany({
      where: { documentType },
      orderBy: { version: 'desc' },
    });

    return {
      documents: documents.map(this.mapToLegalDocumentResponse),
      total: documents.length,
    };
  }

  // ============================================
  // MÉTODOS ADMIN - GESTIÓN DE CONSENTIMIENTOS
  // ============================================

  /**
   * Obtiene consentimientos con filtros (admin)
   */
  async getConsentsWithFilters(
    filters: FilterConsentsDto
  ): Promise<ConsentHistoryResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.consentType) {
      where.consentType = filters.consentType;
    }
    if (filters.documentVersion) {
      where.documentVersion = filters.documentVersion;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.acceptedAt = {};
      if (filters.dateFrom) {
        where.acceptedAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.acceptedAt.lte = new Date(filters.dateTo);
      }
    }

    const [consents, total] = await Promise.all([
      this.prisma.userConsent.findMany({
        where,
        orderBy: { acceptedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userConsent.count({ where }),
    ]);

    return {
      consents: consents.map(this.mapToConsentResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene estadísticas de consentimientos (admin)
   */
  async getConsentStats(): Promise<ConsentStatsResponseDto> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setMonth(startOfMonth.getMonth() - 1);

    // Total de consentimientos
    const totalConsents = await this.prisma.userConsent.count();

    // Por tipo
    const byTypeRaw = await this.prisma.userConsent.groupBy({
      by: ['consentType'],
      _count: { id: true },
    });
    const byType: Record<ConsentType, number> = {} as any;
    Object.values(ConsentType).forEach((type) => {
      const found = byTypeRaw.find((r) => r.consentType === type);
      byType[type] = found?._count.id || 0;
    });

    // Por versión (top 10)
    const byVersionRaw = await this.prisma.userConsent.groupBy({
      by: ['documentVersion'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });
    const byVersion: Record<string, number> = {};
    byVersionRaw.forEach((r) => {
      byVersion[r.documentVersion] = r._count.id;
    });

    // Usuarios únicos
    const uniqueUsersResult = await this.prisma.userConsent.findMany({
      where: { userId: { not: null } },
      distinct: ['userId'],
      select: { userId: true },
    });
    const uniqueUsers = uniqueUsersResult.length;

    // Consentimientos de hoy
    const todayConsents = await this.prisma.userConsent.count({
      where: { acceptedAt: { gte: startOfDay } },
    });

    // Esta semana
    const thisWeekConsents = await this.prisma.userConsent.count({
      where: { acceptedAt: { gte: startOfWeek } },
    });

    // Este mes
    const thisMonthConsents = await this.prisma.userConsent.count({
      where: { acceptedAt: { gte: startOfMonth } },
    });

    return {
      totalConsents,
      byType,
      byVersion,
      uniqueUsers,
      todayConsents,
      thisWeekConsents,
      thisMonthConsents,
    };
  }

  /**
   * Obtiene usuarios que necesitan re-aceptar por nueva versión
   */
  async getUsersNeedingReConsent(
    documentType: DocumentType
  ): Promise<{ userId: string; acceptedVersion: string; currentVersion: string }[]> {
    // Obtener versión actual
    const currentDoc = await this.getCurrentDocumentVersion(documentType);
    const consentType = Object.entries(CONSENT_TO_DOCUMENT_TYPE).find(
      ([, docType]) => docType === documentType
    )?.[0] as ConsentType;

    if (!consentType) {
      return [];
    }

    // Obtener usuarios con versión anterior
    const usersWithOldVersion = await this.prisma.userConsent.findMany({
      where: {
        consentType,
        documentVersion: { not: currentDoc.version },
        userId: { not: null },
      },
      distinct: ['userId'],
      select: {
        userId: true,
        documentVersion: true,
      },
    });

    // Filtrar solo los que no tienen la versión actual
    const userIds = usersWithOldVersion.map((u) => u.userId).filter(Boolean) as string[];

    const usersWithCurrentVersion = await this.prisma.userConsent.findMany({
      where: {
        consentType,
        documentVersion: currentDoc.version,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    const usersWithCurrentSet = new Set(usersWithCurrentVersion.map((u) => u.userId));

    return usersWithOldVersion
      .filter((u) => u.userId && !usersWithCurrentSet.has(u.userId))
      .map((u) => ({
        userId: u.userId!,
        acceptedVersion: u.documentVersion,
        currentVersion: currentDoc.version,
      }));
  }

  // ============================================
  // MÉTODOS INTERNOS
  // ============================================

  /**
   * Valida que hay al menos un identificador
   */
  private validateIdentifier(
    userId?: string,
    participantId?: string,
    sessionId?: string
  ): void {
    if (!userId && !participantId && !sessionId) {
      throw new BadRequestException(CONSENT_ERRORS.MISSING_IDENTIFIER);
    }
  }

  /**
   * Obtiene la versión actual de un documento legal
   */
  async getCurrentDocumentVersion(documentType: DocumentType): Promise<any> {
    const doc = await this.prisma.legalDocument.findFirst({
      where: {
        documentType,
        isCurrent: true,
      },
    });

    if (!doc) {
      throw new NotFoundException(
        `${CONSENT_ERRORS.NO_ACTIVE_DOCUMENT}: ${documentType}`
      );
    }

    return doc;
  }

  /**
   * Obtiene versiones actuales para múltiples tipos de consentimiento
   */
  private async getCurrentVersionsForConsents(
    consentTypes: ConsentType[]
  ): Promise<Record<DocumentType, string>> {
    const versions: Record<DocumentType, string> = {} as any;

    for (const consentType of consentTypes) {
      const documentType = CONSENT_TO_DOCUMENT_TYPE[consentType];
      try {
        const doc = await this.getCurrentDocumentVersion(documentType);
        versions[documentType] = doc.version;
      } catch {
        // Si no existe el documento, usar versión por defecto
        versions[documentType] = '1.0.0';
      }
    }

    return versions;
  }

  /**
   * Mapea un registro de Prisma a ConsentResponseDto
   */
  private mapToConsentResponse = (consent: any): ConsentResponseDto => ({
    id: consent.id,
    userId: consent.userId,
    participantId: consent.participantId,
    sessionId: consent.sessionId,
    consentType: consent.consentType as ConsentType,
    documentVersion: consent.documentVersion,
    referenceType: consent.referenceType,
    referenceId: consent.referenceId,
    acceptedAt: consent.acceptedAt,
    ipAddress: consent.ipAddress,
    userAgent: consent.userAgent,
    fingerprint: consent.fingerprint,
  });

  /**
   * Mapea un documento legal a LegalDocumentResponseDto
   */
  private mapToLegalDocumentResponse = (doc: any): LegalDocumentResponseDto => ({
    id: doc.id,
    documentType: doc.documentType as DocumentType,
    version: doc.version,
    title: doc.title,
    content: doc.content,
    summary: doc.summary,
    effectiveFrom: doc.effectiveFrom,
    effectiveUntil: doc.effectiveUntil,
    isCurrent: doc.isCurrent,
    createdAt: doc.createdAt,
    createdBy: doc.createdBy,
  });
}
