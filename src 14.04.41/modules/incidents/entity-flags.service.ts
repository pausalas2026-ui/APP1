// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Seccion 4 - Flags (banderas) por entidad
// Servicio de gestion de flags antifraude

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  FlagEntityType,
  FlagCode,
  CreateFlagDto,
  ResolveFlagDto,
  MONEY_BLOCKING_FLAGS,
  MoneyReleaseCheck,
  INCIDENT_AUDIT_EVENTS,
} from './incidents.types';
import { AuditCategory } from '../audit-log/audit-log.types';

@Injectable()
export class EntityFlagsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Agregar flag a una entidad
   * DOC 38 seccion 4
   */
  async addFlag(data: CreateFlagDto): Promise<any> {
    // Verificar si ya existe flag activo
    const existingFlag = await this.prisma.entityFlag.findFirst({
      where: {
        entityType: data.entityType,
        entityId: data.entityId,
        flagCode: data.flagCode,
        isActive: true,
      },
    });

    if (existingFlag) {
      // Flag ya existe activo, no duplicar
      return existingFlag;
    }

    // Crear nuevo flag
    const flag = await this.prisma.entityFlag.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        flagCode: data.flagCode,
        reason: data.reason,
        evidenceIds: data.evidenceIds || [],
        createdBy: data.createdBy,
        isActive: true,
        incidentId: data.incidentId,
      },
    });

    // Log de auditoria - DOC 38 seccion 12
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.FLAG_ADDED,
      entityType: data.entityType,
      entityId: data.entityId,
      actorId: data.createdBy,
      metadata: {
        flagId: flag.id,
        flagCode: data.flagCode,
        reason: data.reason,
        incidentId: data.incidentId,
      },
      category: AuditCategory.SECURITY,
    });

    return flag;
  }

  /**
   * Resolver (desactivar) un flag
   * DOC 38 seccion 4
   */
  async resolveFlag(
    entityType: FlagEntityType,
    entityId: string,
    flagCode: FlagCode,
    resolution: ResolveFlagDto,
  ): Promise<any> {
    const flag = await this.prisma.entityFlag.findFirst({
      where: {
        entityType,
        entityId,
        flagCode,
        isActive: true,
      },
    });

    if (!flag) {
      return null;
    }

    const updatedFlag = await this.prisma.entityFlag.update({
      where: { id: flag.id },
      data: {
        isActive: false,
        resolvedBy: resolution.resolvedBy,
        resolvedAt: new Date(),
        resolutionNotes: resolution.resolutionNotes,
      },
    });

    // Log de auditoria
    await this.auditLogService.log({
      eventType: INCIDENT_AUDIT_EVENTS.FLAG_RESOLVED,
      entityType,
      entityId,
      actorId: resolution.resolvedBy,
      metadata: {
        flagId: flag.id,
        flagCode,
        resolutionNotes: resolution.resolutionNotes,
      },
      category: AuditCategory.SECURITY,
    });

    return updatedFlag;
  }

  /**
   * Obtener flags activos de una entidad
   */
  async getActiveFlags(
    entityType: FlagEntityType,
    entityId: string,
  ): Promise<string[]> {
    const flags = await this.prisma.entityFlag.findMany({
      where: {
        entityType,
        entityId,
        isActive: true,
      },
      select: { flagCode: true },
    });

    return flags.map((f) => f.flagCode);
  }

  /**
   * Obtener todos los flags de una entidad (activos e inactivos)
   */
  async getAllFlags(
    entityType: FlagEntityType,
    entityId: string,
  ): Promise<any[]> {
    return this.prisma.entityFlag.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Verificar si entidad tiene flag especifico activo
   */
  async hasFlag(
    entityType: FlagEntityType,
    entityId: string,
    flagCode: FlagCode,
  ): Promise<boolean> {
    const flag = await this.prisma.entityFlag.findFirst({
      where: {
        entityType,
        entityId,
        flagCode,
        isActive: true,
      },
    });

    return !!flag;
  }

  /**
   * Verificar si se puede liberar dinero
   * DOC 38 seccion 5.1 - Bloqueo automatico de liberacion de dinero
   */
  async canReleaseMoney(
    userId: string,
    causeId?: string,
    prizeId?: string,
    moneyId?: string,
  ): Promise<MoneyReleaseCheck> {
    const blockers: string[] = [];

    // Check user flags
    const userFlags = await this.getActiveFlags(FlagEntityType.USER, userId);
    for (const flag of userFlags) {
      if (MONEY_BLOCKING_FLAGS.includes(flag as any)) {
        blockers.push(this.getFlagDescription(flag as FlagCode));
      }
    }

    // Check cause flags (si aplica)
    if (causeId) {
      const causeFlags = await this.getActiveFlags(FlagEntityType.CAUSE, causeId);
      for (const flag of causeFlags) {
        if (MONEY_BLOCKING_FLAGS.includes(flag as any)) {
          blockers.push(this.getFlagDescription(flag as FlagCode));
        }
      }
    }

    // Check prize flags (si aplica)
    if (prizeId) {
      const prizeFlags = await this.getActiveFlags(FlagEntityType.PRIZE, prizeId);
      for (const flag of prizeFlags) {
        if (MONEY_BLOCKING_FLAGS.includes(flag as any)) {
          blockers.push(this.getFlagDescription(flag as FlagCode));
        }
      }
    }

    // Check money flags (si aplica)
    if (moneyId) {
      const moneyFlags = await this.getActiveFlags(FlagEntityType.MONEY, moneyId);
      for (const flag of moneyFlags) {
        if (MONEY_BLOCKING_FLAGS.includes(flag as any)) {
          blockers.push(this.getFlagDescription(flag as FlagCode));
        }
      }
    }

    return {
      canRelease: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Verificar si sorteo puede ejecutarse
   * DOC 38 seccion 5.2
   */
  async canExecuteRaffle(
    raffleId: string,
    creatorId: string,
  ): Promise<{ canExecute: boolean; blockers: string[] }> {
    const blockers: string[] = [];

    // Check creator flags
    const creatorFlags = await this.getActiveFlags(FlagEntityType.USER, creatorId);
    if (creatorFlags.includes('ACCOUNT_SUSPENDED')) {
      blockers.push('Creador suspendido');
    }
    if (creatorFlags.includes('ACCOUNT_BLOCKED')) {
      blockers.push('Creador bloqueado');
    }
    if (creatorFlags.includes('HIGH_RISK')) {
      blockers.push('Creador alto riesgo');
    }

    // Check raffle flags
    const raffleFlags = await this.getActiveFlags(FlagEntityType.RAFFLE, raffleId);
    if (raffleFlags.includes('SUSPICIOUS_ACTIVITY')) {
      blockers.push('Actividad sospechosa en sorteo');
    }
    if (raffleFlags.includes('MANUAL_REVIEW_REQUIRED')) {
      blockers.push('Revision manual pendiente');
    }

    return {
      canExecute: blockers.length === 0,
      blockers,
    };
  }

  /**
   * Obtener descripcion legible de un flag
   */
  private getFlagDescription(flagCode: FlagCode): string {
    const descriptions: Record<string, string> = {
      KYC_REQUIRED: 'KYC pendiente',
      KYC_REJECTED: 'KYC rechazado',
      KYC_EXPIRED: 'KYC expirado',
      PRIZE_DELIVERY_DISPUTE: 'Disputa de entrega activa',
      CAUSE_NOT_VERIFIED: 'Causa no verificada',
      SUSPICIOUS_ACTIVITY: 'Actividad sospechosa',
      MANUAL_REVIEW_REQUIRED: 'Revision manual pendiente',
      FUNDS_HOLD: 'Fondos en retencion',
      ACCOUNT_SUSPENDED: 'Cuenta suspendida',
      ACCOUNT_BLOCKED: 'Cuenta bloqueada',
      HIGH_RISK: 'Alto riesgo',
      MULTIPLE_ACCOUNTS: 'Multiples cuentas detectadas',
    };

    return descriptions[flagCode] || flagCode;
  }

  /**
   * Obtener estadisticas de flags
   */
  async getFlagStats(): Promise<Record<string, number>> {
    const stats = await this.prisma.entityFlag.groupBy({
      by: ['flagCode'],
      where: { isActive: true },
      _count: { id: true },
    });

    const result: Record<string, number> = {};
    for (const stat of stats) {
      result[stat.flagCode] = stat._count.id;
    }
    return result;
  }

  /**
   * Obtener entidades con flags de alto riesgo
   */
  async getHighRiskEntities(): Promise<any[]> {
    return this.prisma.entityFlag.findMany({
      where: {
        isActive: true,
        flagCode: {
          in: ['HIGH_RISK', 'SUSPICIOUS_ACTIVITY', 'ACCOUNT_BLOCKED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
