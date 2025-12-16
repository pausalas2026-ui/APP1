// DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
// Seccion 11 - Servicio de auditoria (backend)
// Regla de inmutabilidad: Los logs NUNCA se editan ni borran

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import {
  AuditEvent,
  AuditLogQuery,
  AuditExport,
  AuditCategory,
  ActorType,
} from './audit-log.types';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registra un evento de auditoria
   * DOC 37 seccion 11 - Metodo principal de logging
   * 
   * @param event - Evento a registrar
   * @returns Promise<void>
   */
  async log(event: AuditEvent): Promise<void> {
    // Determinar categoria automaticamente si no se especifica
    const category = event.category || this.inferCategory(event.eventType);

    // Crear log inmutable (DOC 37 seccion 6)
    await this.prisma.auditLog.create({
      data: {
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId || null,
        actorId: event.actorId || 'SYSTEM',
        actorType: event.actorType || ActorType.SYSTEM,
        metadata: event.metadata || {},
        category,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        requestId: event.requestId || null,
        // createdAt se genera automaticamente con NOW()
      },
    });
  }

  /**
   * Helper para logs financieros (CRITICOS)
   * DOC 37 seccion 4.4 - Logs de dinero
   * 
   * @param eventType - Tipo de evento MONEY_*
   * @param entityId - ID de la entidad de dinero
   * @param actorId - ID del actor o 'SYSTEM'
   * @param metadata - Datos adicionales estructurados
   */
  async logFinancial(
    eventType: string,
    entityId: string,
    actorId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    await this.log({
      eventType,
      entityType: 'MONEY',
      entityId,
      actorId,
      actorType: actorId === 'SYSTEM' ? ActorType.SYSTEM : ActorType.USER,
      metadata,
      category: AuditCategory.FINANCIAL,
    });
  }

  /**
   * Helper para logs legales
   * DOC 37 seccion 8 - Relacion con auditoria legal
   * 
   * @param eventType - Tipo de evento
   * @param entityType - Tipo de entidad
   * @param entityId - ID de la entidad
   * @param actorId - ID del actor
   * @param metadata - Datos adicionales estructurados
   */
  async logLegal(
    eventType: string,
    entityType: string,
    entityId: string,
    actorId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    await this.log({
      eventType,
      entityType,
      entityId,
      actorId,
      metadata,
      category: AuditCategory.LEGAL,
    });
  }

  /**
   * Helper para logs de seguridad
   * DOC 37 seccion 7 - Eventos de seguridad (LOGIN, PASSWORD, etc)
   */
  async logSecurity(
    eventType: string,
    entityType: string,
    entityId: string | null,
    actorId: string | null,
    metadata: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.log({
      eventType,
      entityType,
      entityId: entityId || undefined,
      actorId: actorId || undefined,
      metadata,
      category: AuditCategory.SECURITY,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Helper para logs operacionales
   * DOC 37 seccion 7 - Eventos operacionales genericos
   */
  async logOperational(
    eventType: string,
    entityType: string,
    entityId: string,
    actorId: string,
    metadata: Record<string, any>,
  ): Promise<void> {
    await this.log({
      eventType,
      entityType,
      entityId,
      actorId,
      metadata,
      category: AuditCategory.OPERATIONAL,
    });
  }

  /**
   * Consulta de logs (solo admin)
   * DOC 37 seccion 9 - Acceso a logs (seguridad)
   * 
   * @param params - Parametros de consulta
   * @returns Lista de logs que coinciden
   */
  async query(params: AuditLogQuery): Promise<any[]> {
    const where: any = {};

    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.entityId) {
      where.entityId = params.entityId;
    }
    if (params.eventType) {
      where.eventType = params.eventType;
    }
    if (params.actorId) {
      where.actorId = params.actorId;
    }
    if (params.category) {
      where.category = params.category;
    }
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) {
        where.createdAt.gte = params.dateFrom;
      }
      if (params.dateTo) {
        where.createdAt.lte = params.dateTo;
      }
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0,
    });
  }

  /**
   * Obtener logs de una entidad especifica
   * Util para mostrar historial de una entidad
   */
  async getEntityHistory(
    entityType: string,
    entityId: string,
    limit = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Obtener logs de un actor especifico
   * Util para auditar acciones de un usuario
   */
  async getActorHistory(
    actorId: string,
    limit = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Exportacion para auditoria externa
   * DOC 37 seccion 11 - exportForAudit
   * 
   * @param entityType - Tipo de entidad
   * @param entityId - ID de la entidad
   * @returns Objeto de exportacion con todos los eventos
   */
  async exportForAudit(
    entityType: string,
    entityId: string,
  ): Promise<AuditExport> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      entityType,
      entityId,
      exportedAt: new Date(),
      totalEvents: logs.length,
      events: logs,
    };
  }

  /**
   * Obtener estadisticas de auditoria por categoria
   * Util para dashboards admin
   */
  async getStatsByCategory(): Promise<Record<string, number>> {
    const stats = await this.prisma.auditLog.groupBy({
      by: ['category'],
      _count: {
        id: true,
      },
    });

    const result: Record<string, number> = {};
    for (const stat of stats) {
      result[stat.category] = stat._count.id;
    }
    return result;
  }

  /**
   * Obtener logs recientes por categoria
   * Util para monitoreo en tiempo real
   */
  async getRecentByCategory(
    category: AuditCategory,
    limit = 20,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Inferir categoria automaticamente basado en tipo de evento
   * DOC 37 seccion 11 - inferCategory
   * 
   * @param eventType - Tipo de evento
   * @returns Categoria inferida
   */
  private inferCategory(eventType: string): AuditCategory {
    // Eventos financieros
    if (eventType.startsWith('MONEY_') || eventType.startsWith('DONATION_')) {
      return AuditCategory.FINANCIAL;
    }

    // Eventos legales
    if (
      eventType.includes('ACCEPTED') ||
      eventType.includes('KYC_') ||
      eventType.includes('WINNER') ||
      eventType.includes('CONSENT') ||
      eventType.includes('PARTICIPATION_CREATED') ||
      eventType.includes('PRIZE_ASSIGNED') ||
      eventType.includes('PRIZE_DELIVERY') ||
      eventType.includes('PRIZE_EVIDENCE') ||
      eventType.includes('PRIZE_CONFIRMED') ||
      eventType.includes('PRIZE_DISPUTE')
    ) {
      return AuditCategory.LEGAL;
    }

    // Eventos de seguridad
    if (
      eventType.includes('LOGIN') ||
      eventType.includes('PASSWORD') ||
      eventType.includes('SUSPENDED') ||
      eventType.includes('LOGOUT')
    ) {
      return AuditCategory.SECURITY;
    }

    // Por defecto: operacional
    return AuditCategory.OPERATIONAL;
  }
}
