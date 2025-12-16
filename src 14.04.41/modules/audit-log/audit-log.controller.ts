// DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
// Seccion 9 - Acceso a logs (seguridad)
// Solo administradores pueden consultar logs completos

import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditCategory, AuditLogQuery } from './audit-log.types';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

/**
 * Controlador de auditoria para administradores
 * DOC 37 seccion 9: Solo admins acceden a logs completos
 * 
 * Nota: En produccion, agregar @Roles('admin') guard
 * Por ahora usa JwtAuthGuard basico
 */
@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * GET /admin/audit-logs
   * Consulta general de logs con filtros
   * DOC 37 seccion 9 - API de acceso
   */
  @Get()
  async queryLogs(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('eventType') eventType?: string,
    @Query('actorId') actorId?: string,
    @Query('category') category?: AuditCategory,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const query: AuditLogQuery = {
      entityType,
      entityId,
      eventType,
      actorId,
      category,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const logs = await this.auditLogService.query(query);

    return {
      success: true,
      data: logs,
      meta: {
        limit: query.limit,
        offset: query.offset,
        count: logs.length,
      },
    };
  }

  /**
   * GET /admin/audit-logs/entity/:entityType/:entityId
   * Historial completo de una entidad especifica
   */
  @Get('entity/:entityType/:entityId')
  async getEntityHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditLogService.getEntityHistory(
      entityType,
      entityId,
      limit ? parseInt(limit, 10) : 50,
    );

    return {
      success: true,
      data: logs,
      meta: {
        entityType,
        entityId,
        totalEvents: logs.length,
      },
    };
  }

  /**
   * GET /admin/audit-logs/actor/:actorId
   * Historial de acciones de un actor (usuario o admin)
   */
  @Get('actor/:actorId')
  async getActorHistory(
    @Param('actorId') actorId: string,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditLogService.getActorHistory(
      actorId,
      limit ? parseInt(limit, 10) : 50,
    );

    return {
      success: true,
      data: logs,
      meta: {
        actorId,
        totalEvents: logs.length,
      },
    };
  }

  /**
   * GET /admin/audit-logs/export/:entityType/:entityId
   * Exportacion para auditoria externa
   * DOC 37 seccion 11 - exportForAudit
   */
  @Get('export/:entityType/:entityId')
  async exportForAudit(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    const exportData = await this.auditLogService.exportForAudit(
      entityType,
      entityId,
    );

    return {
      success: true,
      data: exportData,
    };
  }

  /**
   * GET /admin/audit-logs/stats
   * Estadisticas de auditoria por categoria
   * Util para dashboards admin
   */
  @Get('stats')
  async getStats() {
    const stats = await this.auditLogService.getStatsByCategory();

    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /admin/audit-logs/category/:category
   * Logs recientes por categoria
   */
  @Get('category/:category')
  async getByCategory(
    @Param('category') category: AuditCategory,
    @Query('limit') limit?: string,
  ) {
    const logs = await this.auditLogService.getRecentByCategory(
      category,
      limit ? parseInt(limit, 10) : 20,
    );

    return {
      success: true,
      data: logs,
      meta: {
        category,
        count: logs.length,
      },
    };
  }

  /**
   * GET /admin/audit-logs/financial
   * Logs financieros recientes (CRITICOS)
   * DOC 37 seccion 4.4 - Logs de dinero son sagrados
   */
  @Get('financial')
  async getFinancialLogs(@Query('limit') limit?: string) {
    const logs = await this.auditLogService.getRecentByCategory(
      AuditCategory.FINANCIAL,
      limit ? parseInt(limit, 10) : 50,
    );

    return {
      success: true,
      data: logs,
      meta: {
        category: 'FINANCIAL',
        count: logs.length,
        note: 'Logs financieros - retencion 10 años',
      },
    };
  }

  /**
   * GET /admin/audit-logs/legal
   * Logs legales recientes
   * DOC 37 seccion 8 - Relacion con auditoria legal
   */
  @Get('legal')
  async getLegalLogs(@Query('limit') limit?: string) {
    const logs = await this.auditLogService.getRecentByCategory(
      AuditCategory.LEGAL,
      limit ? parseInt(limit, 10) : 50,
    );

    return {
      success: true,
      data: logs,
      meta: {
        category: 'LEGAL',
        count: logs.length,
        note: 'Logs legales - retencion 10 años',
      },
    };
  }

  /**
   * GET /admin/audit-logs/security
   * Logs de seguridad recientes
   */
  @Get('security')
  async getSecurityLogs(@Query('limit') limit?: string) {
    const logs = await this.auditLogService.getRecentByCategory(
      AuditCategory.SECURITY,
      limit ? parseInt(limit, 10) : 50,
    );

    return {
      success: true,
      data: logs,
      meta: {
        category: 'SECURITY',
        count: logs.length,
        note: 'Logs seguridad - retencion 2 años',
      },
    };
  }
}
