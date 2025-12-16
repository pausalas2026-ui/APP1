// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Controlador del panel de administración
// Referencia: DOC 39 secciones 4-15

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminRolesService } from './admin-roles.service';
import { LegalDocsService } from './legal-docs.service';
import { AdminPermissionsGuard, RequirePermissions } from './admin-permissions.guard';
import { AdminActionInterceptor } from './admin-action.interceptor';
import { ADMIN_PERMISSIONS } from './admin-panel.types';
import { CreateLegalDocRequest, LegalDocType } from './admin-panel.types';

// NOTA: Este controlador asume que AdminAuthMiddleware ya está aplicado
// a todas las rutas /admin/* vía configuración del módulo

@Controller('admin')
@UseGuards(AdminPermissionsGuard)
@UseInterceptors(AdminActionInterceptor)
export class AdminPanelController {
  constructor(
    private readonly dashboardService: AdminDashboardService,
    private readonly rolesService: AdminRolesService,
    private readonly legalDocsService: LegalDocsService,
  ) {}

  // ==========================================================================
  // DASHBOARD (DOC 39 seccion 4)
  // ==========================================================================

  /**
   * GET /admin/dashboard
   * Dashboard completo con alertas, dinero, pendientes y métricas
   */
  @Get('dashboard')
  async getDashboard() {
    return this.dashboardService.getDashboard();
  }

  /**
   * GET /admin/dashboard/alerts
   * Solo alertas para refresh rápido
   */
  @Get('dashboard/alerts')
  async getAlerts() {
    return this.dashboardService.getAlertsOnly();
  }

  /**
   * GET /admin/dashboard/metrics/:period
   * Métricas extendidas por periodo
   */
  @Get('dashboard/metrics/:period')
  async getMetrics(@Param('period') period: '24h' | '7d' | '30d') {
    return this.dashboardService.getExtendedMetrics(period);
  }

  // ==========================================================================
  // ROLES Y USUARIOS ADMIN (DOC 39 seccion 3)
  // ==========================================================================

  /**
   * GET /admin/roles
   * Lista todos los roles administrativos
   */
  @Get('roles')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async listRoles() {
    return this.rolesService.getAllRoles();
  }

  /**
   * GET /admin/roles/:roleCode
   * Obtiene un rol específico
   */
  @Get('roles/:roleCode')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async getRole(@Param('roleCode') roleCode: string) {
    return this.rolesService.getRoleByCode(roleCode);
  }

  /**
   * POST /admin/roles/seed
   * Crea roles por defecto (solo ADMIN_GLOBAL)
   */
  @Post('roles/seed')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async seedRoles() {
    return this.rolesService.seedDefaultRoles();
  }

  /**
   * POST /admin/roles/:roleCode/permissions
   * Actualiza permisos de un rol
   */
  @Post('roles/:roleCode/permissions')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async updateRolePermissions(
    @Param('roleCode') roleCode: string,
    @Body() body: { permissions: string[] },
    @Request() req: any,
  ) {
    return this.rolesService.updateRolePermissions(
      roleCode,
      body.permissions,
      req.user.id,
    );
  }

  /**
   * GET /admin/admin-users
   * Lista todos los usuarios admin
   */
  @Get('admin-users')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async listAdminUsers(@Query('activeOnly') activeOnly?: string) {
    return this.rolesService.listAdminUsers(activeOnly !== 'false');
  }

  /**
   * POST /admin/admin-users
   * Asigna rol admin a un usuario
   */
  @Post('admin-users')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async assignAdminRole(
    @Body() body: { userId: string; roleCode: string },
    @Request() req: any,
  ) {
    return this.rolesService.assignAdminRole(
      body.userId,
      body.roleCode,
      req.user.id,
    );
  }

  /**
   * POST /admin/admin-users/:userId/deactivate
   * Desactiva un usuario admin
   */
  @Post('admin-users/:userId/deactivate')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async deactivateAdminUser(
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.rolesService.deactivateAdminUser(userId, req.user.id);
  }

  /**
   * POST /admin/admin-users/:userId/change-role
   * Cambia el rol de un usuario admin
   */
  @Post('admin-users/:userId/change-role')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async changeAdminRole(
    @Param('userId') userId: string,
    @Body() body: { roleCode: string },
    @Request() req: any,
  ) {
    return this.rolesService.changeAdminRole(userId, body.roleCode, req.user.id);
  }

  /**
   * GET /admin/my-permissions
   * Obtiene los permisos del admin actual
   */
  @Get('my-permissions')
  async getMyPermissions(@Request() req: any) {
    const permissions = await this.rolesService.getUserPermissions(req.user.id);
    return {
      userId: req.user.id,
      role: req.adminRole,
      permissions,
    };
  }

  // ==========================================================================
  // DOCUMENTOS LEGALES (DOC 39 seccion 13)
  // ==========================================================================

  /**
   * GET /admin/legal-docs
   * Lista documentos legales
   */
  @Get('legal-docs')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async listLegalDocs(
    @Query('type') type?: LegalDocType,
    @Query('isCurrent') isCurrent?: string,
  ) {
    return this.legalDocsService.listDocuments({
      type,
      isCurrent: isCurrent === 'true' ? true : isCurrent === 'false' ? false : undefined,
    });
  }

  /**
   * GET /admin/legal-docs/current
   * Obtiene todos los documentos actuales
   */
  @Get('legal-docs/current')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async getCurrentLegalDocs() {
    return this.legalDocsService.getAllCurrentDocuments();
  }

  /**
   * GET /admin/legal-docs/:id
   * Obtiene un documento específico
   */
  @Get('legal-docs/:id')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async getLegalDoc(@Param('id') id: string) {
    return this.legalDocsService.getById(id);
  }

  /**
   * GET /admin/legal-docs/type/:type
   * Obtiene el documento actual de un tipo
   */
  @Get('legal-docs/type/:type')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async getCurrentByType(@Param('type') type: LegalDocType) {
    return this.legalDocsService.getCurrentByType(type);
  }

  /**
   * GET /admin/legal-docs/history/:type
   * Obtiene el historial de versiones de un tipo
   */
  @Get('legal-docs/history/:type')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async getVersionHistory(@Param('type') type: LegalDocType) {
    return this.legalDocsService.getVersionHistory(type);
  }

  /**
   * POST /admin/legal-docs
   * Crea un nuevo documento legal
   */
  @Post('legal-docs')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_MANAGE, ADMIN_PERMISSIONS.ALL)
  async createLegalDoc(
    @Body() body: CreateLegalDocRequest,
    @Request() req: any,
  ) {
    return this.legalDocsService.createDocument(body, req.user.id);
  }

  /**
   * POST /admin/legal-docs/:id/activate
   * Activa un documento como el actual
   */
  @Post('legal-docs/:id/activate')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_MANAGE, ADMIN_PERMISSIONS.ALL)
  async activateLegalDoc(@Param('id') id: string, @Request() req: any) {
    return this.legalDocsService.activateDocument(id, req.user.id);
  }

  /**
   * GET /admin/legal-docs/:id/stats
   * Obtiene estadísticas de aceptación de un documento
   */
  @Get('legal-docs/:id/stats')
  @RequirePermissions(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW, ADMIN_PERMISSIONS.ALL)
  async getLegalDocStats(@Param('id') id: string) {
    return this.legalDocsService.getAcceptanceStats(id);
  }

  // ==========================================================================
  // UTILIDADES ADMIN
  // ==========================================================================

  /**
   * GET /admin/health
   * Health check del panel admin
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      module: 'admin-panel',
      document: 'DOC_39',
    };
  }

  /**
   * GET /admin/permissions-catalog
   * Lista todos los permisos disponibles
   */
  @Get('permissions-catalog')
  @RequirePermissions(ADMIN_PERMISSIONS.ALL)
  async getPermissionsCatalog() {
    return ADMIN_PERMISSIONS;
  }
}
