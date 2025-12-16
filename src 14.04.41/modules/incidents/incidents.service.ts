// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Seccion 6, 7, 10 - Gestion de incidentes
// Servicio principal de incidentes

import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EntityFlagsService } from './entity-flags.service';
import {
  CreateIncidentDto,
  ResolveIncidentDto,
  ExecuteActionDto,
  IncidentStatus,
  IncidentPriority,
  FlagEntityType,
  FLAG_CODES,
  ACTION_CODES,
  VALID_STATUS_TRANSITIONS,
  INCIDENT_AUDIT_EVENTS,
} from './incidents.types';
import { AuditCategory } from '../audit-log/audit-log.types';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
    private flagsService: EntityFlagsService,
  ) {}

  /**
   * Crear un nuevo incidente
   * DOC 38 seccion 7
   */
  async createIncident(data: CreateIncidentDto): Promise<any> {
    const incident = await this.prisma.incident.create({
      data: {
        incidentCode: data.incidentCode,
        incidentType: data.incidentType,
        entityType: data.entityType,
        entityId: data.entityId,
        reportedBy: data.reportedBy,
        title: data.title,
        description: data.description,
        priority: data.priority || IncidentPriority.MEDIUM,
        status: IncidentStatus.REPORTED,
        evidenceIds: data.evidenceIds || [],
      },
    });

    // Log de auditoria - DOC 38 seccion 12
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_CREATED,
      entityType: 'INCIDENT',
      entityId: incident.id,
      actorId: data.reportedBy || 'SYSTEM',
      metadata: {
        incidentCode: data.incidentCode,
        affectedEntity: { type: data.entityType, id: data.entityId },
        priority: incident.priority,
      },
      category: AuditCategory.LEGAL,
    });

    return incident;
  }

  /**
   * Obtener incidente por ID
   */
  async getIncident(incidentId: string): Promise<any> {
    return this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        flags: true,
        actions: {
          orderBy: { executedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Cambiar estado de incidente
   * DOC 38 seccion 6 - Flujo de estados
   */
  async changeStatus(
    incidentId: string,
    newStatus: IncidentStatus,
    changedBy: string,
    notes?: string,
  ): Promise<any> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new BadRequestException('Incidente no encontrado');
    }

    // Validar transicion de estado
    const validTransitions = VALID_STATUS_TRANSITIONS[incident.status as IncidentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Transicion no valida: ${incident.status} -> ${newStatus}`,
      );
    }

    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: { status: newStatus },
    });

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_STATUS_CHANGED,
      entityType: 'INCIDENT',
      entityId: incidentId,
      actorId: changedBy,
      metadata: {
        fromStatus: incident.status,
        toStatus: newStatus,
        notes,
      },
      category: AuditCategory.LEGAL,
    });

    return updated;
  }

  /**
   * Asignar incidente a revisor
   * DOC 38 seccion 11 - Revision manual
   */
  async assignIncident(
    incidentId: string,
    assignedTo: string,
    assignedBy: string,
  ): Promise<any> {
    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        assignedTo,
        assignedAt: new Date(),
      },
    });

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_ASSIGNED,
      entityType: 'INCIDENT',
      entityId: incidentId,
      actorId: assignedBy,
      metadata: { assignedTo },
      category: AuditCategory.OPERATIONAL,
    });

    return updated;
  }

  /**
   * Resolver incidente
   * DOC 38 seccion 6
   */
  async resolveIncident(
    incidentId: string,
    resolution: ResolveIncidentDto,
  ): Promise<any> {
    const incident = await this.getIncident(incidentId);

    if (!incident) {
      throw new BadRequestException('Incidente no encontrado');
    }

    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.RESOLVED,
        resolutionType: resolution.resolutionType,
        resolutionNotes: resolution.resolutionNotes,
        resolvedBy: resolution.resolvedBy,
        resolvedAt: new Date(),
      },
    });

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_RESOLVED,
      entityType: 'INCIDENT',
      entityId: incidentId,
      actorId: resolution.resolvedBy,
      metadata: {
        resolutionType: resolution.resolutionType,
        resolutionNotes: resolution.resolutionNotes,
      },
      category: AuditCategory.LEGAL,
    });

    return updated;
  }

  /**
   * Ejecutar accion sobre incidente
   * DOC 38 seccion 10 - Catalogo de acciones
   */
  async executeAction(data: ExecuteActionDto): Promise<any> {
    // Registrar la accion
    const action = await this.prisma.incidentAction.create({
      data: {
        incidentId: data.incidentId,
        actionCode: data.actionCode,
        targetType: data.targetType,
        targetId: data.targetId,
        notes: data.notes,
        metadata: data.metadata || {},
        executedBy: data.executedBy,
        wasSuccessful: true,
      },
    });

    // Ejecutar la accion segun el codigo
    try {
      await this.performAction(data);

      // Actualizar estado del incidente a ACTION_TAKEN
      await this.prisma.incident.update({
        where: { id: data.incidentId },
        data: {
          status: IncidentStatus.ACTION_TAKEN,
          actionsTaken: {
            push: {
              actionCode: data.actionCode,
              executedAt: new Date().toISOString(),
              executedBy: data.executedBy,
            },
          },
        },
      });
    } catch (error) {
      // Marcar accion como fallida
      await this.prisma.incidentAction.update({
        where: { id: action.id },
        data: {
          wasSuccessful: false,
          errorMessage: error.message,
        },
      });
      throw error;
    }

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_ACTION_TAKEN,
      entityType: 'INCIDENT',
      entityId: data.incidentId,
      actorId: data.executedBy,
      metadata: {
        actionCode: data.actionCode,
        targetType: data.targetType,
        targetId: data.targetId,
        notes: data.notes,
      },
      category: AuditCategory.LEGAL,
    });

    return action;
  }

  /**
   * Ejecutar accion especifica
   * DOC 38 seccion 10
   */
  private async performAction(data: ExecuteActionDto): Promise<void> {
    switch (data.actionCode) {
      case ACTION_CODES.HOLD_FUNDS:
        if (data.targetType && data.targetId) {
          await this.flagsService.addFlag({
            entityType: data.targetType,
            entityId: data.targetId,
            flagCode: FLAG_CODES.FUNDS_HOLD,
            reason: data.notes || 'Retencion por incidente',
            createdBy: data.executedBy,
            incidentId: data.incidentId,
          });
        }
        break;

      case ACTION_CODES.SUSPEND_ACCOUNT:
        if (data.targetId) {
          await this.flagsService.addFlag({
            entityType: FlagEntityType.USER,
            entityId: data.targetId,
            flagCode: FLAG_CODES.ACCOUNT_SUSPENDED,
            reason: data.notes || 'Suspension por investigacion',
            createdBy: data.executedBy,
            incidentId: data.incidentId,
          });
        }
        break;

      case ACTION_CODES.BLOCK_ACCOUNT:
        if (data.targetId) {
          await this.flagsService.addFlag({
            entityType: FlagEntityType.USER,
            entityId: data.targetId,
            flagCode: FLAG_CODES.ACCOUNT_BLOCKED,
            reason: data.notes || 'Bloqueo permanente',
            createdBy: data.executedBy,
            incidentId: data.incidentId,
          });
        }
        break;

      case ACTION_CODES.ESCALATE_MANUAL:
        if (data.targetType && data.targetId) {
          await this.flagsService.addFlag({
            entityType: data.targetType,
            entityId: data.targetId,
            flagCode: FLAG_CODES.MANUAL_REVIEW_REQUIRED,
            reason: data.notes || 'Escalado a revision manual',
            createdBy: data.executedBy,
            incidentId: data.incidentId,
          });
        }
        break;

      case ACTION_CODES.REQUIRE_KYC_L2:
        if (data.targetId) {
          await this.flagsService.addFlag({
            entityType: FlagEntityType.USER,
            entityId: data.targetId,
            flagCode: FLAG_CODES.KYC_REQUIRED,
            reason: data.notes || 'Requerido KYC nivel 2',
            createdBy: data.executedBy,
            incidentId: data.incidentId,
          });
        }
        break;

      case ACTION_CODES.RELEASE_FUNDS:
        if (data.targetType && data.targetId) {
          await this.flagsService.resolveFlag(
            data.targetType,
            data.targetId,
            FLAG_CODES.FUNDS_HOLD,
            {
              resolvedBy: data.executedBy,
              resolutionNotes: data.notes || 'Fondos liberados tras revision',
            },
          );
        }
        break;

      case ACTION_CODES.CLOSE_INCIDENT:
        // Solo marcar - no requiere accion adicional
        break;

      case ACTION_CODES.NOTIFY_USER:
        // TODO: Integrar con sistema de notificaciones
        // Por ahora solo registra la accion
        break;

      default:
        // Acciones no implementadas se registran pero no ejecutan logica
        break;
    }
  }

  /**
   * Agregar evidencia a incidente
   */
  async addEvidence(
    incidentId: string,
    evidenceId: string,
    addedBy: string,
  ): Promise<any> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new BadRequestException('Incidente no encontrado');
    }

    const updated = await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        evidenceIds: {
          push: evidenceId,
        },
      },
    });

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.INCIDENT_EVIDENCE_ADDED,
      entityType: 'INCIDENT',
      entityId: incidentId,
      actorId: addedBy,
      metadata: { evidenceId },
      category: AuditCategory.LEGAL,
    });

    return updated;
  }

  /**
   * Listar incidentes con filtros
   */
  async listIncidents(filters: {
    status?: IncidentStatus;
    incidentType?: string;
    priority?: IncidentPriority;
    assignedTo?: string;
    entityType?: FlagEntityType;
    entityId?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.incidentType) where.incidentType = filters.incidentType;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;

    return this.prisma.incident.findMany({
      where,
      include: {
        actions: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });
  }

  /**
   * Obtener incidentes pendientes de revision
   * DOC 38 seccion 11 - Revision manual
   */
  async getPendingReview(): Promise<any[]> {
    return this.prisma.incident.findMany({
      where: {
        status: {
          in: [IncidentStatus.REPORTED, IncidentStatus.TRIAGED],
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  /**
   * Obtener estadisticas de incidentes
   */
  async getStats(): Promise<{
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const [byStatus, byType, byPriority] = await Promise.all([
      this.prisma.incident.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      this.prisma.incident.groupBy({
        by: ['incidentType'],
        _count: { id: true },
      }),
      this.prisma.incident.groupBy({
        by: ['priority'],
        _count: { id: true },
      }),
    ]);

    return {
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count.id])),
      byType: Object.fromEntries(byType.map((t) => [t.incidentType, t._count.id])),
      byPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count.id])),
    };
  }

  /**
   * Obtener incidentes criticos activos
   */
  async getCriticalIncidents(): Promise<any[]> {
    return this.prisma.incident.findMany({
      where: {
        priority: IncidentPriority.CRITICAL,
        status: {
          notIn: [IncidentStatus.RESOLVED, IncidentStatus.REJECTED],
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
