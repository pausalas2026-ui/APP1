// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Controlador admin para gestion de incidentes
// Seccion 7 - Como se reporta un incidente
// Seccion 9, 10, 11 - Gestion administrativa

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { EntityFlagsService } from './entity-flags.service';
import {
  CreateIncidentDto,
  ResolveIncidentDto,
  ExecuteActionDto,
  IncidentStatus,
  IncidentPriority,
  FlagEntityType,
  CreateFlagDto,
  ResolveFlagDto,
} from './incidents.types';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

/**
 * Controlador de incidentes para administradores
 * DOC 38: Gestion de incidentes, fraude y disputas
 */
@Controller('admin/incidents')
@UseGuards(JwtAuthGuard)
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly flagsService: EntityFlagsService,
  ) {}

  // ============================================
  // ENDPOINTS DE INCIDENTES
  // ============================================

  /**
   * POST /admin/incidents
   * Crear nuevo incidente
   * DOC 38 seccion 7
   */
  @Post()
  async createIncident(@Body() data: CreateIncidentDto) {
    const incident = await this.incidentsService.createIncident(data);
    return {
      success: true,
      data: incident,
      message: 'Incidente creado correctamente',
    };
  }

  /**
   * GET /admin/incidents
   * Listar incidentes con filtros
   */
  @Get()
  async listIncidents(
    @Query('status') status?: IncidentStatus,
    @Query('incidentType') incidentType?: string,
    @Query('priority') priority?: IncidentPriority,
    @Query('assignedTo') assignedTo?: string,
    @Query('entityType') entityType?: FlagEntityType,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const incidents = await this.incidentsService.listIncidents({
      status,
      incidentType,
      priority,
      assignedTo,
      entityType,
      entityId,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });

    return {
      success: true,
      data: incidents,
      meta: {
        count: incidents.length,
      },
    };
  }

  /**
   * GET /admin/incidents/pending
   * Incidentes pendientes de revision
   * DOC 38 seccion 11
   */
  @Get('pending')
  async getPendingIncidents() {
    const incidents = await this.incidentsService.getPendingReview();
    return {
      success: true,
      data: incidents,
      meta: {
        count: incidents.length,
        note: 'Incidentes pendientes de revision',
      },
    };
  }

  /**
   * GET /admin/incidents/critical
   * Incidentes criticos activos
   */
  @Get('critical')
  async getCriticalIncidents() {
    const incidents = await this.incidentsService.getCriticalIncidents();
    return {
      success: true,
      data: incidents,
      meta: {
        count: incidents.length,
        note: 'Incidentes criticos - atencion prioritaria',
      },
    };
  }

  /**
   * GET /admin/incidents/stats
   * Estadisticas de incidentes
   */
  @Get('stats')
  async getStats() {
    const stats = await this.incidentsService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /admin/incidents/:id
   * Obtener incidente por ID
   */
  @Get(':id')
  async getIncident(@Param('id') id: string) {
    const incident = await this.incidentsService.getIncident(id);
    return {
      success: true,
      data: incident,
    };
  }

  /**
   * PUT /admin/incidents/:id/status
   * Cambiar estado de incidente
   * DOC 38 seccion 6
   */
  @Put(':id/status')
  async changeStatus(
    @Param('id') id: string,
    @Body() body: { status: IncidentStatus; changedBy: string; notes?: string },
  ) {
    const incident = await this.incidentsService.changeStatus(
      id,
      body.status,
      body.changedBy,
      body.notes,
    );
    return {
      success: true,
      data: incident,
      message: `Estado cambiado a ${body.status}`,
    };
  }

  /**
   * PUT /admin/incidents/:id/assign
   * Asignar incidente a revisor
   * DOC 38 seccion 11
   */
  @Put(':id/assign')
  async assignIncident(
    @Param('id') id: string,
    @Body() body: { assignedTo: string; assignedBy: string },
  ) {
    const incident = await this.incidentsService.assignIncident(
      id,
      body.assignedTo,
      body.assignedBy,
    );
    return {
      success: true,
      data: incident,
      message: 'Incidente asignado correctamente',
    };
  }

  /**
   * POST /admin/incidents/:id/resolve
   * Resolver incidente
   * DOC 38 seccion 6
   */
  @Post(':id/resolve')
  async resolveIncident(
    @Param('id') id: string,
    @Body() resolution: ResolveIncidentDto,
  ) {
    const incident = await this.incidentsService.resolveIncident(id, resolution);
    return {
      success: true,
      data: incident,
      message: 'Incidente resuelto',
    };
  }

  /**
   * POST /admin/incidents/:id/action
   * Ejecutar accion sobre incidente
   * DOC 38 seccion 10
   */
  @Post(':id/action')
  async executeAction(
    @Param('id') id: string,
    @Body() actionData: Omit<ExecuteActionDto, 'incidentId'>,
  ) {
    const action = await this.incidentsService.executeAction({
      ...actionData,
      incidentId: id,
    });
    return {
      success: true,
      data: action,
      message: `Accion ${actionData.actionCode} ejecutada`,
    };
  }

  /**
   * POST /admin/incidents/:id/evidence
   * Agregar evidencia a incidente
   */
  @Post(':id/evidence')
  async addEvidence(
    @Param('id') id: string,
    @Body() body: { evidenceId: string; addedBy: string },
  ) {
    const incident = await this.incidentsService.addEvidence(
      id,
      body.evidenceId,
      body.addedBy,
    );
    return {
      success: true,
      data: incident,
      message: 'Evidencia agregada',
    };
  }

  // ============================================
  // ENDPOINTS DE FLAGS
  // DOC 38 seccion 4
  // ============================================

  /**
   * POST /admin/incidents/flags
   * Agregar flag a entidad
   */
  @Post('flags')
  async addFlag(@Body() data: CreateFlagDto) {
    const flag = await this.flagsService.addFlag(data);
    return {
      success: true,
      data: flag,
      message: `Flag ${data.flagCode} agregado`,
    };
  }

  /**
   * GET /admin/incidents/flags/:entityType/:entityId
   * Obtener flags de una entidad
   */
  @Get('flags/:entityType/:entityId')
  async getEntityFlags(
    @Param('entityType') entityType: FlagEntityType,
    @Param('entityId') entityId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    const flags = activeOnly === 'true'
      ? await this.flagsService.getActiveFlags(entityType, entityId)
      : await this.flagsService.getAllFlags(entityType, entityId);

    return {
      success: true,
      data: flags,
      meta: {
        entityType,
        entityId,
        activeOnly: activeOnly === 'true',
      },
    };
  }

  /**
   * POST /admin/incidents/flags/:entityType/:entityId/:flagCode/resolve
   * Resolver flag
   */
  @Post('flags/:entityType/:entityId/:flagCode/resolve')
  async resolveFlag(
    @Param('entityType') entityType: FlagEntityType,
    @Param('entityId') entityId: string,
    @Param('flagCode') flagCode: string,
    @Body() resolution: ResolveFlagDto,
  ) {
    const flag = await this.flagsService.resolveFlag(
      entityType,
      entityId,
      flagCode as any,
      resolution,
    );
    return {
      success: true,
      data: flag,
      message: `Flag ${flagCode} resuelto`,
    };
  }

  /**
   * GET /admin/incidents/flags/stats
   * Estadisticas de flags
   */
  @Get('flags/stats')
  async getFlagStats() {
    const stats = await this.flagsService.getFlagStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /admin/incidents/flags/high-risk
   * Entidades de alto riesgo
   */
  @Get('flags/high-risk')
  async getHighRiskEntities() {
    const entities = await this.flagsService.getHighRiskEntities();
    return {
      success: true,
      data: entities,
      meta: {
        note: 'Entidades con flags de alto riesgo activos',
      },
    };
  }

  /**
   * POST /admin/incidents/check-money-release
   * Verificar si se puede liberar dinero
   * DOC 38 seccion 5.1
   */
  @Post('check-money-release')
  async checkMoneyRelease(
    @Body() body: {
      userId: string;
      causeId?: string;
      prizeId?: string;
      moneyId?: string;
    },
  ) {
    const check = await this.flagsService.canReleaseMoney(
      body.userId,
      body.causeId,
      body.prizeId,
      body.moneyId,
    );
    return {
      success: true,
      data: check,
      message: check.canRelease
        ? 'Liberacion permitida'
        : 'Liberacion bloqueada',
    };
  }

  /**
   * POST /admin/incidents/check-raffle-execution
   * Verificar si sorteo puede ejecutarse
   * DOC 38 seccion 5.2
   */
  @Post('check-raffle-execution')
  async checkRaffleExecution(
    @Body() body: { raffleId: string; creatorId: string },
  ) {
    const check = await this.flagsService.canExecuteRaffle(
      body.raffleId,
      body.creatorId,
    );
    return {
      success: true,
      data: check,
      message: check.canExecute
        ? 'Ejecucion permitida'
        : 'Ejecucion bloqueada',
    };
  }
}
