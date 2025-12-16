// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Tests unitarios para panel de administración
// Cumple DOC 39 secciones: roles, dashboard, documentos legales, permisos

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AdminRolesService } from './admin-roles.service';
import { AdminDashboardService } from './admin-dashboard.service';
import { LegalDocsService } from './legal-docs.service';
import {
  ADMIN_ROLE_CODES,
  DEFAULT_ROLE_PERMISSIONS,
  ADMIN_PERMISSIONS,
  ADMIN_PROHIBITED_ACTIONS,
} from './admin-panel.types';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService = {
  adminRole: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  adminUser: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  legalDocument: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  legalConsent: {
    count: jest.fn(),
  },
  incident: {
    count: jest.fn(),
  },
  sorteo: {
    count: jest.fn(),
  },
  entityFlag: {
    count: jest.fn(),
  },
  causa: {
    count: jest.fn(),
  },
  kycVerification: {
    count: jest.fn(),
  },
  notificationLog: {
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
  },
  participacion: {
    count: jest.fn(),
  },
  fundLedger: {
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
};

const mockAuditLogService = {
  log: jest.fn(),
  logSecurity: jest.fn(),
  logLegal: jest.fn(),
};

// ============================================================================
// TESTS: AdminRolesService
// ============================================================================

describe('AdminRolesService', () => {
  let service: AdminRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminRolesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<AdminRolesService>(AdminRolesService);
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 39 seccion 3: ROLES ADMINISTRATIVOS
  // --------------------------------------------------------------------------

  describe('getAllRoles', () => {
    it('debe retornar todos los roles activos', async () => {
      const roles = [
        { id: 'r1', roleCode: 'ADMIN_GLOBAL', roleName: 'Admin Global' },
        { id: 'r2', roleCode: 'ADMIN_OPS', roleName: 'Admin Operativo' },
      ];

      mockPrismaService.adminRole.findMany.mockResolvedValue(roles);

      const result = await service.getAllRoles();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.adminRole.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('getRoleByCode', () => {
    it('debe obtener un rol por código', async () => {
      const role = {
        id: 'r1',
        roleCode: 'ADMIN_GLOBAL',
        permissions: ['*'],
      };

      mockPrismaService.adminRole.findUnique.mockResolvedValue(role);

      const result = await service.getRoleByCode('ADMIN_GLOBAL');

      expect(result.roleCode).toBe('ADMIN_GLOBAL');
    });

    it('debe lanzar error si el rol no existe', async () => {
      mockPrismaService.adminRole.findUnique.mockResolvedValue(null);

      await expect(service.getRoleByCode('INVALID')).rejects.toThrow(
        'Rol INVALID no encontrado',
      );
    });
  });

  describe('seedDefaultRoles', () => {
    it('debe crear roles por defecto si no existen', async () => {
      mockPrismaService.adminRole.findUnique.mockResolvedValue(null);
      mockPrismaService.adminRole.create.mockImplementation((args) => ({
        id: 'new-id',
        ...args.data,
      }));

      const result = await service.seedDefaultRoles();

      expect(result.length).toBe(4); // 4 roles por defecto
      expect(result.every((r) => r.action === 'created')).toBe(true);
    });

    it('debe reportar roles existentes', async () => {
      mockPrismaService.adminRole.findUnique.mockResolvedValue({
        id: 'existing',
      });

      const result = await service.seedDefaultRoles();

      expect(result.every((r) => r.action === 'exists')).toBe(true);
    });
  });

  describe('assignAdminRole', () => {
    it('debe asignar rol admin a un usuario', async () => {
      mockPrismaService.adminRole.findUnique.mockResolvedValue({
        id: 'role-1',
        roleCode: 'ADMIN_OPS',
      });
      mockPrismaService.adminUser.findUnique.mockResolvedValue(null);
      mockPrismaService.adminUser.create.mockResolvedValue({
        id: 'admin-1',
        userId: 'user-123',
        roleId: 'role-1',
        role: { roleCode: 'ADMIN_OPS' },
      });

      const result = await service.assignAdminRole(
        'user-123',
        'ADMIN_OPS',
        'assigner-456',
      );

      expect(result.userId).toBe('user-123');
      expect(mockAuditLogService.logSecurity).toHaveBeenCalledWith(
        'ADMIN_USER_CREATED',
        'AdminUser',
        'admin-1',
        'assigner-456',
        expect.any(Object),
      );
    });

    it('debe fallar si el usuario ya es admin', async () => {
      mockPrismaService.adminRole.findUnique.mockResolvedValue({
        id: 'role-1',
      });
      mockPrismaService.adminUser.findUnique.mockResolvedValue({
        id: 'existing',
      });

      await expect(
        service.assignAdminRole('user-123', 'ADMIN_OPS', 'assigner'),
      ).rejects.toThrow('El usuario ya tiene un rol administrativo');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 39 seccion 15: VERIFICACIÓN DE PERMISOS
  // --------------------------------------------------------------------------

  describe('hasPermission', () => {
    it('ADMIN_GLOBAL debe tener todos los permisos', async () => {
      mockPrismaService.adminUser.findUnique.mockResolvedValue({
        isActive: true,
        role: { permissions: ['*'] },
      });

      const result = await service.hasPermission('user-1', 'any.permission');

      expect(result).toBe(true);
    });

    it('debe verificar permisos específicos', async () => {
      mockPrismaService.adminUser.findUnique.mockResolvedValue({
        isActive: true,
        role: { permissions: ['users.view', 'incidents.manage'] },
      });

      expect(await service.hasPermission('user-1', 'users.view')).toBe(true);
      expect(await service.hasPermission('user-1', 'money.view')).toBe(false);
    });

    it('debe retornar false si no es admin activo', async () => {
      mockPrismaService.adminUser.findUnique.mockResolvedValue({
        isActive: false,
        role: { permissions: ['*'] },
      });

      const result = await service.hasPermission('user-1', 'any');

      expect(result).toBe(false);
    });
  });
});

// ============================================================================
// TESTS: AdminDashboardService
// ============================================================================

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 39 seccion 4: DASHBOARD ADMIN
  // --------------------------------------------------------------------------

  describe('getDashboard', () => {
    it('debe retornar dashboard con alertas, dinero, pendientes y métricas', async () => {
      // Mock todas las consultas
      mockPrismaService.incident.count.mockResolvedValue(3);
      mockPrismaService.sorteo.count.mockResolvedValue(1);
      mockPrismaService.entityFlag.count.mockResolvedValue(2);
      mockPrismaService.causa.count.mockResolvedValue(4);
      mockPrismaService.kycVerification.count.mockResolvedValue(12);
      mockPrismaService.notificationLog.count.mockResolvedValue(8);
      mockPrismaService.user.count.mockResolvedValue(45);
      mockPrismaService.participacion.count.mockResolvedValue(100);
      mockPrismaService.fundLedger.groupBy.mockResolvedValue([]);
      mockPrismaService.fundLedger.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.getDashboard();

      // Verificar estructura del dashboard segun DOC 39 seccion 4
      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('money');
      expect(result).toHaveProperty('pending');
      expect(result).toHaveProperty('metrics24h');

      // Alertas
      expect(result.alerts).toHaveProperty('activeIncidents');
      expect(result.alerts).toHaveProperty('suspendedRaffles');
      expect(result.alerts).toHaveProperty('highRiskUsers');
      expect(result.alerts).toHaveProperty('criticalFlags');

      // Dinero
      expect(result.money).toHaveProperty('totalRetained');
      expect(result.money).toHaveProperty('pendingVerification');
      expect(result.money).toHaveProperty('readyToRelease');
      expect(result.money).toHaveProperty('totalBlocked');

      // Pendientes
      expect(result.pending).toHaveProperty('unverifiedCauses');
      expect(result.pending).toHaveProperty('pendingKyc');
      expect(result.pending).toHaveProperty('failedMessages');
      expect(result.pending).toHaveProperty('openDisputes');

      // Métricas 24h
      expect(result.metrics24h).toHaveProperty('newUsers');
      expect(result.metrics24h).toHaveProperty('executedRaffles');
      expect(result.metrics24h).toHaveProperty('totalDonations');
      expect(result.metrics24h).toHaveProperty('totalParticipations');
    });
  });
});

// ============================================================================
// TESTS: LegalDocsService
// ============================================================================

describe('LegalDocsService', () => {
  let service: LegalDocsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalDocsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<LegalDocsService>(LegalDocsService);
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 39 seccion 13: DOCUMENTOS LEGALES
  // --------------------------------------------------------------------------

  describe('createDocument', () => {
    it('debe crear un nuevo documento legal', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(null);
      mockPrismaService.legalDocument.create.mockResolvedValue({
        id: 'doc-1',
        type: 'TOS',
        version: '1.0',
        title: 'Términos de Servicio',
        isCurrent: true,
      });

      const result = await service.createDocument(
        {
          type: 'TOS',
          version: '1.0',
          title: 'Términos de Servicio',
          content: 'Contenido...',
          effectiveFrom: new Date(),
          setAsCurrent: true,
        },
        'admin-123',
      );

      expect(result.type).toBe('TOS');
      expect(mockAuditLogService.logLegal).toHaveBeenCalled();
    });

    it('debe fallar si la versión ya existe', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue({
        id: 'existing',
      });

      await expect(
        service.createDocument(
          {
            type: 'TOS',
            version: '1.0',
            title: 'Test',
            content: 'Content',
            effectiveFrom: new Date(),
          },
          'admin',
        ),
      ).rejects.toThrow('Ya existe version 1.0 para TOS');
    });
  });

  describe('activateDocument', () => {
    it('debe activar un documento como actual', async () => {
      mockPrismaService.legalDocument.findUnique.mockResolvedValue({
        id: 'doc-1',
        type: 'TOS',
        version: '2.0',
        isCurrent: false,
      });
      mockPrismaService.legalConsent.count.mockResolvedValue(0);
      mockPrismaService.legalDocument.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.legalDocument.update.mockResolvedValue({
        id: 'doc-1',
        isCurrent: true,
      });

      const result = await service.activateDocument('doc-1', 'admin-123');

      expect(result.isCurrent).toBe(true);
      expect(mockPrismaService.legalDocument.updateMany).toHaveBeenCalled();
      expect(mockAuditLogService.logLegal).toHaveBeenCalled();
    });
  });

  describe('getVersionHistory', () => {
    it('debe retornar historial de versiones', async () => {
      mockPrismaService.legalDocument.findMany.mockResolvedValue([
        { version: '2.0', isCurrent: true },
        { version: '1.1', isCurrent: false },
        { version: '1.0', isCurrent: false },
      ]);

      const result = await service.getVersionHistory('TOS');

      expect(result).toHaveLength(3);
      expect(mockPrismaService.legalDocument.findMany).toHaveBeenCalledWith({
        where: { type: 'TOS' },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });
});

// ============================================================================
// TESTS: Catálogos y constantes
// ============================================================================

describe('Admin Panel Types', () => {
  // --------------------------------------------------------------------------
  // DOC 39 seccion 3: ROLES POR DEFECTO
  // --------------------------------------------------------------------------

  describe('Roles por defecto', () => {
    it('debe tener 4 roles definidos', () => {
      expect(ADMIN_ROLE_CODES).toHaveLength(4);
      expect(ADMIN_ROLE_CODES).toContain('ADMIN_GLOBAL');
      expect(ADMIN_ROLE_CODES).toContain('ADMIN_OPS');
      expect(ADMIN_ROLE_CODES).toContain('ADMIN_FINANCE');
      expect(ADMIN_ROLE_CODES).toContain('ADMIN_LEGAL');
    });

    it('ADMIN_GLOBAL debe tener permiso total', () => {
      expect(DEFAULT_ROLE_PERMISSIONS.ADMIN_GLOBAL).toContain('*');
    });

    it('otros roles deben tener permisos específicos', () => {
      expect(DEFAULT_ROLE_PERMISSIONS.ADMIN_OPS).not.toContain('*');
      expect(DEFAULT_ROLE_PERMISSIONS.ADMIN_FINANCE).not.toContain('*');
      expect(DEFAULT_ROLE_PERMISSIONS.ADMIN_LEGAL).not.toContain('*');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 39 seccion 14: PROHIBICIONES TÉCNICAS
  // --------------------------------------------------------------------------

  describe('Acciones prohibidas', () => {
    it('debe tener acciones prohibidas definidas', () => {
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('CHANGE_RAFFLE_WINNER');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('EDIT_AUDIT_LOGS');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('DELETE_USER_HISTORY');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('CREATE_MONEY_MANUALLY');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('EDIT_TRANSACTION_AMOUNTS');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('DELETE_INCIDENTS');
      expect(ADMIN_PROHIBITED_ACTIONS).toContain('MODIFY_TIMESTAMPS');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 39 secciones 5-9: PERMISOS POR MÓDULO
  // --------------------------------------------------------------------------

  describe('Catálogo de permisos', () => {
    it('debe tener permisos de usuarios', () => {
      expect(ADMIN_PERMISSIONS.USERS_VIEW).toBe('users.view');
      expect(ADMIN_PERMISSIONS.USERS_SUSPEND).toBe('users.suspend');
      expect(ADMIN_PERMISSIONS.USERS_BLOCK).toBe('users.block');
    });

    it('debe tener permisos de sorteos', () => {
      expect(ADMIN_PERMISSIONS.RAFFLES_VIEW).toBe('raffles.view');
      expect(ADMIN_PERMISSIONS.RAFFLES_SUSPEND).toBe('raffles.suspend');
      expect(ADMIN_PERMISSIONS.RAFFLES_CANCEL).toBe('raffles.cancel');
    });

    it('debe tener permisos de dinero', () => {
      expect(ADMIN_PERMISSIONS.MONEY_VIEW).toBe('money.view');
      expect(ADMIN_PERMISSIONS.MONEY_APPROVE).toBe('money.approve');
      expect(ADMIN_PERMISSIONS.MONEY_BLOCK).toBe('money.block');
    });

    it('debe tener permisos de KYC', () => {
      expect(ADMIN_PERMISSIONS.KYC_VIEW).toBe('kyc.view');
      expect(ADMIN_PERMISSIONS.KYC_MANAGE).toBe('kyc.manage');
    });

    it('debe tener permisos de documentos legales', () => {
      expect(ADMIN_PERMISSIONS.LEGAL_DOCS_VIEW).toBe('legal_docs.view');
      expect(ADMIN_PERMISSIONS.LEGAL_DOCS_MANAGE).toBe('legal_docs.manage');
    });
  });
});
