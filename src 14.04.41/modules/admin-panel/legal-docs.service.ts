// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Servicio de gestión de documentos legales
// Referencia: DOC 39 seccion 13

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateLegalDocRequest, LegalDocType } from './admin-panel.types';

@Injectable()
export class LegalDocsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Lista documentos legales con filtros
   * DOC 39 seccion 13
   */
  async listDocuments(params: {
    type?: LegalDocType;
    isCurrent?: boolean;
  }) {
    const { type, isCurrent } = params;

    return this.prisma.legalDocument.findMany({
      where: {
        ...(type && { type }),
        ...(isCurrent !== undefined && { isCurrent }),
      },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }

  /**
   * Obtiene un documento por ID
   */
  async getById(docId: string) {
    const doc = await this.prisma.legalDocument.findUnique({
      where: { id: docId },
    });

    if (!doc) {
      throw new NotFoundException('Documento legal no encontrado');
    }

    // Contar aceptaciones si existe LegalConsent
    let acceptanceCount = 0;
    try {
      acceptanceCount = await this.prisma.legalConsent.count({
        where: { documentId: docId },
      });
    } catch {
      acceptanceCount = 0;
    }

    return {
      ...doc,
      acceptanceCount,
    };
  }

  /**
   * Obtiene el documento actual de un tipo
   */
  async getCurrentByType(type: LegalDocType) {
    const doc = await this.prisma.legalDocument.findFirst({
      where: { type, isCurrent: true },
    });

    if (!doc) {
      throw new NotFoundException(`No hay documento ${type} activo`);
    }

    return doc;
  }

  /**
   * Crea un nuevo documento legal
   * DOC 39 seccion 13: Versionado de documentos
   */
  async createDocument(data: CreateLegalDocRequest, createdBy: string) {
    // Verificar que la version no existe para este tipo
    const existing = await this.prisma.legalDocument.findFirst({
      where: { type: data.type, version: data.version },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe version ${data.version} para ${data.type}`,
      );
    }

    // Si setAsCurrent, desactivar el actual
    if (data.setAsCurrent) {
      await this.prisma.legalDocument.updateMany({
        where: { type: data.type, isCurrent: true },
        data: { isCurrent: false, effectiveUntil: new Date() },
      });
    }

    const doc = await this.prisma.legalDocument.create({
      data: {
        type: data.type,
        version: data.version,
        title: data.title,
        content: data.content,
        summary: data.summary,
        effectiveFrom: data.effectiveFrom,
        isCurrent: data.setAsCurrent || false,
        createdBy,
      },
    });

    await this.auditLog.logLegal(
      'LEGAL_DOC_CREATED',
      'LegalDocument',
      doc.id,
      createdBy,
      { type: data.type, version: data.version },
    );

    return doc;
  }

  /**
   * Activa una version de documento como la actual
   * DOC 39 seccion 13
   */
  async activateDocument(docId: string, activatedBy: string) {
    const doc = await this.getById(docId);

    if (doc.isCurrent) {
      return doc; // Ya es el actual
    }

    // Desactivar el actual del mismo tipo
    await this.prisma.legalDocument.updateMany({
      where: { type: doc.type as LegalDocType, isCurrent: true },
      data: { isCurrent: false, effectiveUntil: new Date() },
    });

    // Activar el nuevo
    const updated = await this.prisma.legalDocument.update({
      where: { id: docId },
      data: { isCurrent: true, effectiveFrom: new Date() },
    });

    await this.auditLog.logLegal(
      'LEGAL_DOC_ACTIVATED',
      'LegalDocument',
      doc.id,
      activatedBy,
      { type: doc.type, version: doc.version },
    );

    return updated;
  }

  /**
   * Obtiene el historial de versiones de un tipo de documento
   */
  async getVersionHistory(type: LegalDocType) {
    return this.prisma.legalDocument.findMany({
      where: { type },
      select: {
        id: true,
        version: true,
        title: true,
        isCurrent: true,
        effectiveFrom: true,
        effectiveUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Obtiene estadisticas de aceptacion por documento
   */
  async getAcceptanceStats(docId: string) {
    try {
      const total = await this.prisma.legalConsent.count({
        where: { documentId: docId },
      });

      const last24h = await this.prisma.legalConsent.count({
        where: {
          documentId: docId,
          acceptedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      const last7d = await this.prisma.legalConsent.count({
        where: {
          documentId: docId,
          acceptedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      });

      return {
        total,
        last24h,
        last7d,
      };
    } catch {
      return { total: 0, last24h: 0, last7d: 0 };
    }
  }

  /**
   * Obtiene todos los documentos actuales de cada tipo
   */
  async getAllCurrentDocuments() {
    return this.prisma.legalDocument.findMany({
      where: { isCurrent: true },
      orderBy: { type: 'asc' },
    });
  }
}
