// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Servicio de Dashboard administrativo
// Referencia: DOC 39 seccion 4

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AdminDashboard } from './admin-panel.types';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el dashboard completo del admin
   * DOC 39 seccion 4 - Dashboard con alertas, no solo metricas
   */
  async getDashboard(): Promise<AdminDashboard> {
    const [alerts, money, pending, metrics24h] = await Promise.all([
      this.getAlerts(),
      this.getMoneyStats(),
      this.getPendingItems(),
      this.getMetrics24h(),
    ]);

    return {
      alerts,
      money,
      pending,
      metrics24h,
    };
  }

  /**
   * Alertas criticas - Lo importante arriba
   * DOC 39 seccion 4: Incidentes activos, sorteos suspendidos, usuarios alto riesgo
   */
  private async getAlerts() {
    const [activeIncidents, suspendedRaffles, highRiskUsers, criticalFlags] = await Promise.all([
      // Incidentes activos (estados no resueltos)
      this.prisma.incident.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
        },
      }),
      // Sorteos suspendidos
      this.prisma.sorteo.count({
        where: { estado: 'CANCELADO' },
      }),
      // Usuarios con flags de fraude
      this.prisma.entityFlag.count({
        where: {
          entityType: 'User',
          flagCode: { in: ['FLAG_FRAUD_SUSPECTED', 'FLAG_FRAUD_CONFIRMED'] },
          active: true,
        },
      }),
      // Flags criticos activos (cualquier tipo)
      this.prisma.entityFlag.count({
        where: {
          flagCode: { in: ['FLAG_FRAUD_CONFIRMED', 'FLAG_LEGAL_HOLD'] },
          active: true,
        },
      }),
    ]);

    return {
      activeIncidents,
      suspendedRaffles,
      highRiskUsers,
      criticalFlags,
    };
  }

  /**
   * Estadisticas de dinero
   * DOC 39 seccion 4 y 9: Vision por estados
   */
  private async getMoneyStats() {
    // Usando FundLedger si existe
    try {
      const ledgerStats = await this.prisma.fundLedger.groupBy({
        by: ['status'],
        _sum: { amount: true },
        _count: true,
      });

      const byStatus: Record<string, number> = {};
      ledgerStats.forEach((stat) => {
        byStatus[stat.status] = stat._sum.amount?.toNumber() || 0;
      });

      return {
        totalRetained: byStatus['RETENIDO'] || 0,
        pendingVerification: byStatus['PENDIENTE'] || 0,
        readyToRelease: byStatus['APROBADO'] || 0,
        totalBlocked: byStatus['BLOQUEADO'] || 0,
      };
    } catch {
      // Si FundLedger no existe o hay error, retornar ceros
      return {
        totalRetained: 0,
        pendingVerification: 0,
        readyToRelease: 0,
        totalBlocked: 0,
      };
    }
  }

  /**
   * Items pendientes de atencion
   * DOC 39 seccion 4
   */
  private async getPendingItems() {
    const [unverifiedCauses, pendingKyc, failedMessages, openDisputes] = await Promise.all([
      // Causas no verificadas
      this.prisma.causa.count({
        where: { verificada: false, estado: 'PENDIENTE' },
      }),
      // KYC pendientes
      this.prisma.kycVerification.count({
        where: { status: 'PENDING' },
      }).catch(() => 0),
      // Mensajes fallidos (NotificationLog)
      this.prisma.notificationLog.count({
        where: { status: 'FAILED' },
      }).catch(() => 0),
      // Disputas abiertas
      this.prisma.incident.count({
        where: {
          incidentType: { startsWith: 'DISPUTE_' },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),
    ]);

    return {
      unverifiedCauses,
      pendingKyc,
      failedMessages,
      openDisputes,
    };
  }

  /**
   * Metricas de las ultimas 24 horas
   * DOC 39 seccion 4
   */
  private async getMetrics24h() {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [newUsers, executedRaffles, totalParticipations] = await Promise.all([
      // Nuevos usuarios
      this.prisma.user.count({
        where: { createdAt: { gte: since24h } },
      }),
      // Sorteos ejecutados
      this.prisma.sorteo.count({
        where: {
          estado: 'FINALIZADO',
          updatedAt: { gte: since24h },
        },
      }),
      // Participaciones
      this.prisma.participacion.count({
        where: { createdAt: { gte: since24h } },
      }),
    ]);

    // Donaciones (sumando de participaciones o FundLedger)
    let totalDonations = 0;
    try {
      const donations = await this.prisma.fundLedger.aggregate({
        where: {
          type: 'DONACION_CAUSA',
          createdAt: { gte: since24h },
        },
        _sum: { amount: true },
      });
      totalDonations = donations._sum.amount?.toNumber() || 0;
    } catch {
      totalDonations = 0;
    }

    return {
      newUsers,
      executedRaffles,
      totalDonations,
      totalParticipations,
    };
  }

  /**
   * Obtiene solo las alertas para refresh rapido
   */
  async getAlertsOnly() {
    return this.getAlerts();
  }

  /**
   * Obtiene metricas extendidas para un periodo
   */
  async getExtendedMetrics(period: '24h' | '7d' | '30d') {
    const periodMap = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    const since = new Date(Date.now() - periodMap[period]);

    const [users, raffles, participations, incidents] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.sorteo.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.participacion.count({
        where: { createdAt: { gte: since } },
      }),
      this.prisma.incident.count({
        where: { createdAt: { gte: since } },
      }),
    ]);

    return {
      period,
      users: { new: users },
      raffles: { created: raffles },
      participations: { total: participations },
      incidents: { created: incidents },
    };
  }
}
