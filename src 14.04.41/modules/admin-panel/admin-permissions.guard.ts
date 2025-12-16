// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Guard de permisos admin
// Referencia: DOC 39 seccion 3 y 15

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_PERMISSIONS, ADMIN_PROHIBITED_ACTIONS } from './admin-panel.types';

// Decorador para requerir permisos específicos
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Decorador para acciones prohibidas (siempre deniega)
export const PROHIBITED_KEY = 'prohibited';
export const ProhibitedAction = () => SetMetadata(PROHIBITED_KEY, true);

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Verificar si es acción prohibida
    const isProhibited = this.reflector.getAllAndOverride<boolean>(
      PROHIBITED_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isProhibited) {
      throw new ForbiddenException(
        'Esta acción está técnicamente prohibida (DOC 39 seccion 14)',
      );
    }

    // 2. Obtener permisos requeridos
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no se especifican permisos, permitir (ya pasó por AdminAuthMiddleware)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 3. Obtener permisos del usuario del request
    const request = context.switchToHttp().getRequest();
    const userPermissions = request.adminPermissions as string[];

    if (!userPermissions) {
      throw new ForbiddenException('No se encontraron permisos de admin');
    }

    // 4. ADMIN_GLOBAL tiene acceso total
    if (userPermissions.includes('*')) {
      return true;
    }

    // 5. Verificar que tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Permiso insuficiente. Se requiere: ${requiredPermissions.join(' o ')}`,
      );
    }

    return true;
  }
}

// Guard para verificar que NO se intenta una acción prohibida
@Injectable()
export class ProhibitedActionsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body || {};
    const action = body.action || request.params.action;

    // Verificar si la acción está en la lista de prohibidas
    if (action && ADMIN_PROHIBITED_ACTIONS.includes(action)) {
      throw new ForbiddenException(
        `Acción '${action}' está técnicamente prohibida por DOC 39`,
      );
    }

    return true;
  }
}
