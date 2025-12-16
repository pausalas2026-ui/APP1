// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Módulo del panel de administración
// Referencia: DOC 39

import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AdminPanelController } from './admin-panel.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminRolesService } from './admin-roles.service';
import { LegalDocsService } from './legal-docs.service';
import { AdminAuthMiddleware } from './admin-auth.middleware';
import { AdminPermissionsGuard, ProhibitedActionsGuard } from './admin-permissions.guard';
import { AdminActionInterceptor } from './admin-action.interceptor';
import { PrismaModule } from '../shared/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
  ],
  controllers: [AdminPanelController],
  providers: [
    AdminDashboardService,
    AdminRolesService,
    LegalDocsService,
    AdminPermissionsGuard,
    ProhibitedActionsGuard,
    AdminActionInterceptor,
  ],
  exports: [
    AdminRolesService,
    AdminDashboardService,
    LegalDocsService,
  ],
})
export class AdminPanelModule {
  configure(consumer: MiddlewareConsumer) {
    // Aplicar AdminAuthMiddleware a todas las rutas /admin/*
    // DOC 39 seccion 15: Acceso restringido
    consumer
      .apply(AdminAuthMiddleware)
      .forRoutes({ path: 'admin/*', method: RequestMethod.ALL });
  }
}
