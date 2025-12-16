// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Middleware de autenticación admin
// Referencia: DOC 39 seccion 15

import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AdminRolesService } from './admin-roles.service';
import { AuditLogService } from '../audit-log/audit-log.service';

// Extender Request para incluir info de admin
declare global {
  namespace Express {
    interface Request {
      adminRole?: any;
      adminPermissions?: string[];
      isAdminVerified?: boolean;
    }
  }
}

@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly adminRolesService: AdminRolesService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. Obtener usuario del request (asume que ya pasó por auth)
    const user = (req as any).user;
    
    if (!user || !user.id) {
      throw new UnauthorizedException('Usuario no autenticado');
    }

    // 2. Verificar que es admin
    const adminUser = await this.adminRolesService.getAdminUser(user.id);
    
    if (!adminUser || !adminUser.isActive) {
      throw new ForbiddenException('Acceso denegado: No es administrador');
    }

    // 3. Verificar 2FA si está habilitado
    // DOC 39 seccion 15: 2FA obligatorio
    if (adminUser.twoFactorEnabled) {
      const session = (req as any).session;
      if (!session?.twoFactorVerified) {
        throw new UnauthorizedException('Se requiere verificación 2FA');
      }
    }

    // 4. Adjuntar rol y permisos al request
    req.adminRole = adminUser.role;
    req.adminPermissions = adminUser.role.permissions as string[];
    req.isAdminVerified = true;

    // 5. Log de acceso admin
    // DOC 39 seccion 15: Todo se loguea
    await this.auditLogService.log({
      eventType: 'ADMIN_ACCESS',
      entityType: 'ADMIN_PANEL',
      entityId: req.path,
      actorId: user.id,
      actorType: 'ADMIN',
      metadata: {
        method: req.method,
        path: req.path,
        roleCode: adminUser.role.roleCode,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      category: 'SECURITY',
    });

    next();
  }
}
