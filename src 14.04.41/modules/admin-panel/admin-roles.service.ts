// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Servicio de roles administrativos
// Referencia: DOC 39 seccion 3

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  AdminRoleCode,
  DEFAULT_ROLE_PERMISSIONS,
  ADMIN_PERMISSIONS,
} from './admin-panel.types';

@Injectable()
export class AdminRolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==========================================================================
  // GESTION DE ROLES (DOC 39 seccion 3)
  // ==========================================================================

  /**
   * Obtiene todos los roles administrativos
   */
  async getAllRoles() {
    return this.prisma.adminRole.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { adminUsers: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Obtiene un rol por codigo
   */
  async getRoleByCode(roleCode: string) {
    const role = await this.prisma.adminRole.findUnique({
      where: { roleCode },
      include: {
        adminUsers: {
          where: { isActive: true },
          select: { id: true, userId: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Rol ${roleCode} no encontrado`);
    }

    return role;
  }

  /**
   * Crea roles por defecto segun DOC 39 seccion 3
   */
  async seedDefaultRoles() {
    const defaultRoles: Array<{
      roleCode: AdminRoleCode;
      roleName: string;
      description: string;
    }> = [
      {
        roleCode: 'ADMIN_GLOBAL',
        roleName: 'Administrador Global',
        description: 'Control total de la plataforma',
      },
      {
        roleCode: 'ADMIN_OPS',
        roleName: 'Administrador Operativo',
        description: 'Gestión del día a día: incidentes, soporte, usuarios',
      },
      {
        roleCode: 'ADMIN_FINANCE',
        roleName: 'Administrador Financiero',
        description: 'Control de flujos financieros, dinero, KYC',
      },
      {
        roleCode: 'ADMIN_LEGAL',
        roleName: 'Administrador Legal',
        description: 'Cumplimiento normativo, KYC, consentimientos, docs legales',
      },
    ];

    const results = [];
    for (const roleData of defaultRoles) {
      const existing = await this.prisma.adminRole.findUnique({
        where: { roleCode: roleData.roleCode },
      });

      if (!existing) {
        const created = await this.prisma.adminRole.create({
          data: {
            ...roleData,
            permissions: DEFAULT_ROLE_PERMISSIONS[roleData.roleCode],
          },
        });
        results.push({ roleCode: roleData.roleCode, action: 'created' });
      } else {
        results.push({ roleCode: roleData.roleCode, action: 'exists' });
      }
    }

    return results;
  }

  /**
   * Actualiza los permisos de un rol
   */
  async updateRolePermissions(
    roleCode: string,
    permissions: string[],
    updatedBy: string,
  ) {
    const role = await this.getRoleByCode(roleCode);

    // No permitir modificar ADMIN_GLOBAL
    if (roleCode === 'ADMIN_GLOBAL') {
      throw new ConflictException('No se puede modificar el rol ADMIN_GLOBAL');
    }

    const updated = await this.prisma.adminRole.update({
      where: { roleCode },
      data: { permissions },
    });

    await this.auditLog.logSecurity(
      'ADMIN_ROLE_PERMISSIONS_UPDATED',
      'AdminRole',
      role.id,
      updatedBy,
      { roleCode, permissions },
    );

    return updated;
  }

  // ==========================================================================
  // GESTION DE USUARIOS ADMIN (DOC 39 seccion 3)
  // ==========================================================================

  /**
   * Asigna rol admin a un usuario
   */
  async assignAdminRole(
    userId: string,
    roleCode: string,
    assignedBy: string,
  ) {
    // Verificar que el rol existe
    const role = await this.getRoleByCode(roleCode);

    // Verificar que el usuario no es ya admin
    const existing = await this.prisma.adminUser.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('El usuario ya tiene un rol administrativo');
    }

    const adminUser = await this.prisma.adminUser.create({
      data: {
        userId,
        roleId: role.id,
        assignedBy,
        twoFactorEnabled: false,
      },
      include: {
        role: true,
      },
    });

    await this.auditLog.logSecurity(
      'ADMIN_USER_CREATED',
      'AdminUser',
      adminUser.id,
      assignedBy,
      { userId, roleCode },
    );

    return adminUser;
  }

  /**
   * Obtiene usuario admin por userId
   */
  async getAdminUser(userId: string) {
    return this.prisma.adminUser.findUnique({
      where: { userId },
      include: {
        role: true,
      },
    });
  }

  /**
   * Lista todos los usuarios admin
   */
  async listAdminUsers(activeOnly = true) {
    return this.prisma.adminUser.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: {
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Desactiva un usuario admin
   */
  async deactivateAdminUser(userId: string, deactivatedBy: string) {
    const adminUser = await this.getAdminUser(userId);
    if (!adminUser) {
      throw new NotFoundException('Usuario admin no encontrado');
    }

    const updated = await this.prisma.adminUser.update({
      where: { userId },
      data: { isActive: false },
    });

    await this.auditLog.logSecurity(
      'ADMIN_USER_DEACTIVATED',
      'AdminUser',
      adminUser.id,
      deactivatedBy,
      { userId },
    );

    return updated;
  }

  /**
   * Cambia el rol de un usuario admin
   */
  async changeAdminRole(
    userId: string,
    newRoleCode: string,
    changedBy: string,
  ) {
    const adminUser = await this.getAdminUser(userId);
    if (!adminUser) {
      throw new NotFoundException('Usuario admin no encontrado');
    }

    const newRole = await this.getRoleByCode(newRoleCode);
    const oldRoleCode = adminUser.role.roleCode;

    const updated = await this.prisma.adminUser.update({
      where: { userId },
      data: { roleId: newRole.id },
      include: { role: true },
    });

    await this.auditLog.logSecurity(
      'ADMIN_USER_ROLE_CHANGED',
      'AdminUser',
      adminUser.id,
      changedBy,
      { userId, oldRoleCode, newRoleCode },
    );

    return updated;
  }

  // ==========================================================================
  // VERIFICACION DE PERMISOS (DOC 39 seccion 15)
  // ==========================================================================

  /**
   * Verifica si un admin tiene un permiso especifico
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const adminUser = await this.getAdminUser(userId);
    if (!adminUser || !adminUser.isActive) {
      return false;
    }

    const permissions = adminUser.role.permissions as string[];
    
    // ADMIN_GLOBAL tiene todos los permisos
    if (permissions.includes('*')) {
      return true;
    }

    return permissions.includes(permission);
  }

  /**
   * Verifica multiples permisos (requiere todos)
   */
  async hasAllPermissions(userId: string, requiredPermissions: string[]): Promise<boolean> {
    for (const permission of requiredPermissions) {
      if (!(await this.hasPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Verifica multiples permisos (requiere al menos uno)
   */
  async hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.hasPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obtiene todos los permisos de un usuario admin
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const adminUser = await this.getAdminUser(userId);
    if (!adminUser || !adminUser.isActive) {
      return [];
    }

    return adminUser.role.permissions as string[];
  }
}
