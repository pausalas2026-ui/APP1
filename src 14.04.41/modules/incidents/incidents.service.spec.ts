// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Tests unitarios para sistema de incidentes y flags
// Cumple DOC 38 secciones: sistema flags, detección fraude, gestión incidentes

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EntityFlagsService } from './entity-flags.service';
import { IncidentsService } from './incidents.service';
import {
  BLOCKING_FLAG_CODES,
  INCIDENT_CODES,
  INCIDENT_STATUS,
  ACTION_CODES,
} from './incidents.types';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService = {
  entityFlag: {
    create: jest.fn(),
    update: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  incident: {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  incidentAction: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaService)),
};

const mockAuditLogService = {
  log: jest.fn(),
  logSecurity: jest.fn(),
  logFinancial: jest.fn(),
};

// ============================================================================
// TESTS: EntityFlagsService
// ============================================================================

describe('EntityFlagsService', () => {
  let service: EntityFlagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntityFlagsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<EntityFlagsService>(EntityFlagsService);
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 38: SISTEMA DE FLAGS
  // --------------------------------------------------------------------------

  describe('addFlag', () => {
    it('debe crear un flag en una entidad', async () => {
      const flagData = {
        entityType: 'User' as const,
        entityId: 'user-123',
        flagCode: 'FLAG_KYC_PENDING' as const,
        reason: 'Documentación no verificada',
        createdBy: 'admin-456',
      };

      mockPrismaService.entityFlag.create.mockResolvedValue({
        id: 'flag-789',
        ...flagData,
        active: true,
        createdAt: new Date(),
      });

      const result = await service.addFlag(flagData);

      expect(result.id).toBe('flag-789');
      expect(result.flagCode).toBe('FLAG_KYC_PENDING');
      expect(result.active).toBe(true);
      expect(mockPrismaService.entityFlag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entityType: 'User',
          entityId: 'user-123',
          flagCode: 'FLAG_KYC_PENDING',
          active: true,
        }),
      });
      expect(mockAuditLogService.log).toHaveBeenCalled();
    });
  });

  describe('resolveFlag', () => {
    it('debe resolver un flag activo', async () => {
      const flagId = 'flag-123';
      const existingFlag = {
        id: flagId,
        entityType: 'User',
        entityId: 'user-456',
        flagCode: 'FLAG_DISPUTE_OPEN',
        active: true,
      };

      mockPrismaService.entityFlag.findFirst.mockResolvedValue(existingFlag);
      mockPrismaService.entityFlag.update.mockResolvedValue({
        ...existingFlag,
        active: false,
        resolvedAt: new Date(),
        resolvedBy: 'admin-789',
        resolution: 'Disputa resuelta a favor del usuario',
      });

      const result = await service.resolveFlag(
        flagId,
        'Disputa resuelta a favor del usuario',
        'admin-789',
      );

      expect(result.active).toBe(false);
      expect(result.resolvedBy).toBe('admin-789');
      expect(mockPrismaService.entityFlag.update).toHaveBeenCalledWith({
        where: { id: flagId },
        data: expect.objectContaining({
          active: false,
          resolution: 'Disputa resuelta a favor del usuario',
        }),
      });
    });

    it('debe fallar si el flag no existe', async () => {
      mockPrismaService.entityFlag.findFirst.mockResolvedValue(null);

      await expect(
        service.resolveFlag('nonexistent', 'resolution', 'admin'),
      ).rejects.toThrow('Flag no encontrado o ya resuelto');
    });
  });

  describe('hasActiveFlag', () => {
    it('debe detectar flag activo', async () => {
      mockPrismaService.entityFlag.findFirst.mockResolvedValue({
        id: 'flag-1',
        flagCode: 'FLAG_FRAUD_SUSPECTED',
        active: true,
      });

      const result = await service.hasActiveFlag(
        'User',
        'user-123',
        'FLAG_FRAUD_SUSPECTED',
      );

      expect(result).toBe(true);
    });

    it('debe retornar false si no hay flag', async () => {
      mockPrismaService.entityFlag.findFirst.mockResolvedValue(null);

      const result = await service.hasActiveFlag(
        'User',
        'user-123',
        'FLAG_FRAUD_SUSPECTED',
      );

      expect(result).toBe(false);
    });
  });

  describe('getActiveFlags', () => {
    it('debe retornar todos los flags activos de una entidad', async () => {
      const flags = [
        { id: 'f1', flagCode: 'FLAG_KYC_PENDING', active: true },
        { id: 'f2', flagCode: 'FLAG_DISPUTE_OPEN', active: true },
      ];

      mockPrismaService.entityFlag.findMany.mockResolvedValue(flags);

      const result = await service.getActiveFlags('User', 'user-123');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.entityFlag.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'User',
          entityId: 'user-123',
          active: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: REGLAS DE BLOQUEO
  // --------------------------------------------------------------------------

  describe('checkCanReleaseMoney', () => {
    it('debe permitir liberar dinero sin flags bloqueantes', async () => {
      mockPrismaService.entityFlag.findMany.mockResolvedValue([]);

      const result = await service.checkCanReleaseMoney('User', 'user-123');

      expect(result.canRelease).toBe(true);
      expect(result.blockingFlags).toHaveLength(0);
    });

    it('debe bloquear liberación con FLAG_FRAUD_SUSPECTED', async () => {
      mockPrismaService.entityFlag.findMany.mockResolvedValue([
        { id: 'f1', flagCode: 'FLAG_FRAUD_SUSPECTED', active: true },
      ]);

      const result = await service.checkCanReleaseMoney('User', 'user-123');

      expect(result.canRelease).toBe(false);
      expect(result.blockingFlags).toContain('FLAG_FRAUD_SUSPECTED');
    });

    it('debe bloquear liberación con FLAG_DISPUTE_OPEN', async () => {
      mockPrismaService.entityFlag.findMany.mockResolvedValue([
        { id: 'f1', flagCode: 'FLAG_DISPUTE_OPEN', active: true },
      ]);

      const result = await service.checkCanReleaseMoney('User', 'user-123');

      expect(result.canRelease).toBe(false);
      expect(result.blockingFlags).toContain('FLAG_DISPUTE_OPEN');
    });
  });

  describe('checkCanExecuteRaffle', () => {
    it('debe permitir ejecutar sorteo sin flags bloqueantes', async () => {
      mockPrismaService.entityFlag.findMany.mockResolvedValue([]);

      const result = await service.checkCanExecuteRaffle('sorteo-123');

      expect(result.canExecute).toBe(true);
    });

    it('debe bloquear sorteo con FLAG_LEGAL_HOLD', async () => {
      mockPrismaService.entityFlag.findMany.mockResolvedValue([
        { id: 'f1', flagCode: 'FLAG_LEGAL_HOLD', active: true },
      ]);

      const result = await service.checkCanExecuteRaffle('sorteo-123');

      expect(result.canExecute).toBe(false);
      expect(result.blockingFlags).toContain('FLAG_LEGAL_HOLD');
    });
  });
});

// ============================================================================
// TESTS: IncidentsService
// ============================================================================

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 38: CREACIÓN DE INCIDENTES
  // --------------------------------------------------------------------------

  describe('createIncident', () => {
    it('debe crear un incidente con código válido', async () => {
      const incidentData = {
        code: 'FRAUD_MULTIPLE_ACCOUNTS' as const,
        title: 'Múltiples cuentas detectadas',
        description: 'Usuario con 3 cuentas vinculadas al mismo dispositivo',
        entityType: 'User' as const,
        entityId: 'user-123',
        reportedBy: 'system',
        priority: 'HIGH' as const,
      };

      mockPrismaService.incident.create.mockResolvedValue({
        id: 'inc-456',
        ...incidentData,
        status: 'OPEN',
        createdAt: new Date(),
      });

      const result = await service.createIncident(incidentData);

      expect(result.id).toBe('inc-456');
      expect(result.code).toBe('FRAUD_MULTIPLE_ACCOUNTS');
      expect(result.status).toBe('OPEN');
      expect(mockPrismaService.incident.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 'FRAUD_MULTIPLE_ACCOUNTS',
          status: 'OPEN',
          priority: 'HIGH',
        }),
      });
      expect(mockAuditLogService.logSecurity).toHaveBeenCalled();
    });

    it('debe asignar prioridad por defecto MEDIUM', async () => {
      const incidentData = {
        code: 'USER_COMPLAINT' as const,
        title: 'Queja de usuario',
        description: 'Queja sobre tiempo de entrega',
        entityType: 'Prize' as const,
        entityId: 'prize-123',
        reportedBy: 'user-456',
      };

      mockPrismaService.incident.create.mockResolvedValue({
        id: 'inc-789',
        ...incidentData,
        status: 'OPEN',
        priority: 'MEDIUM',
        createdAt: new Date(),
      });

      const result = await service.createIncident(incidentData);

      expect(result.priority).toBe('MEDIUM');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: ASIGNACIÓN DE INCIDENTES
  // --------------------------------------------------------------------------

  describe('assignIncident', () => {
    it('debe asignar un incidente a un administrador', async () => {
      const incidentId = 'inc-123';
      const existingIncident = {
        id: incidentId,
        code: 'FRAUD_SUSPICIOUS_IP',
        status: 'OPEN',
        assignedTo: null,
      };

      mockPrismaService.incident.findUnique.mockResolvedValue(existingIncident);
      mockPrismaService.incident.update.mockResolvedValue({
        ...existingIncident,
        status: 'IN_PROGRESS',
        assignedTo: 'admin-456',
        assignedAt: new Date(),
      });

      const result = await service.assignIncident(incidentId, 'admin-456');

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.assignedTo).toBe('admin-456');
    });

    it('debe fallar si el incidente no existe', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue(null);

      await expect(
        service.assignIncident('nonexistent', 'admin'),
      ).rejects.toThrow('Incidente no encontrado');
    });

    it('debe fallar si el incidente ya está resuelto', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'RESOLVED',
      });

      await expect(
        service.assignIncident('inc-123', 'admin'),
      ).rejects.toThrow('No se puede asignar un incidente cerrado');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: CAMBIO DE ESTADO
  // --------------------------------------------------------------------------

  describe('changeStatus', () => {
    it('debe cambiar estado de OPEN a IN_PROGRESS', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'OPEN',
      });
      mockPrismaService.incident.update.mockResolvedValue({
        id: 'inc-123',
        status: 'IN_PROGRESS',
      });

      const result = await service.changeStatus(
        'inc-123',
        'IN_PROGRESS',
        'admin-456',
        'Iniciando investigación',
      );

      expect(result.status).toBe('IN_PROGRESS');
    });

    it('debe cambiar estado a ESCALATED', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'IN_PROGRESS',
      });
      mockPrismaService.incident.update.mockResolvedValue({
        id: 'inc-123',
        status: 'ESCALATED',
      });

      const result = await service.changeStatus(
        'inc-123',
        'ESCALATED',
        'admin-456',
        'Requiere revisión legal',
      );

      expect(result.status).toBe('ESCALATED');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: ACCIONES EN INCIDENTES
  // --------------------------------------------------------------------------

  describe('addAction', () => {
    it('debe añadir una acción a un incidente', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'IN_PROGRESS',
      });
      mockPrismaService.incidentAction.create.mockResolvedValue({
        id: 'action-456',
        incidentId: 'inc-123',
        actionCode: 'ACTION_BLOCK_USER',
        description: 'Usuario bloqueado por fraude',
        performedBy: 'admin-789',
        createdAt: new Date(),
      });

      const result = await service.addAction({
        incidentId: 'inc-123',
        actionCode: 'ACTION_BLOCK_USER',
        description: 'Usuario bloqueado por fraude',
        performedBy: 'admin-789',
      });

      expect(result.actionCode).toBe('ACTION_BLOCK_USER');
      expect(mockAuditLogService.logSecurity).toHaveBeenCalled();
    });

    it('debe soportar todos los códigos de acción definidos', () => {
      // Verificar que ACTION_CODES contiene las acciones esperadas
      expect(ACTION_CODES).toContain('ACTION_BLOCK_USER');
      expect(ACTION_CODES).toContain('ACTION_HOLD_FUNDS');
      expect(ACTION_CODES).toContain('ACTION_REQUEST_DOCS');
      expect(ACTION_CODES).toContain('ACTION_REFUND');
      expect(ACTION_CODES).toContain('ACTION_ESCALATE');
      expect(ACTION_CODES).toContain('ACTION_NOTIFY_USER');
      expect(ACTION_CODES).toContain('ACTION_CLOSE_ACCOUNT');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: RESOLUCIÓN DE INCIDENTES
  // --------------------------------------------------------------------------

  describe('resolveIncident', () => {
    it('debe resolver un incidente con resolución', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'IN_PROGRESS',
        code: 'USER_COMPLAINT',
      });
      mockPrismaService.incident.update.mockResolvedValue({
        id: 'inc-123',
        status: 'RESOLVED',
        resolution: 'Queja resuelta - premio entregado',
        resolvedAt: new Date(),
        resolvedBy: 'admin-456',
      });

      const result = await service.resolveIncident(
        'inc-123',
        'Queja resuelta - premio entregado',
        'admin-456',
      );

      expect(result.status).toBe('RESOLVED');
      expect(result.resolution).toBe('Queja resuelta - premio entregado');
    });

    it('debe fallar si ya está resuelto', async () => {
      mockPrismaService.incident.findUnique.mockResolvedValue({
        id: 'inc-123',
        status: 'RESOLVED',
      });

      await expect(
        service.resolveIncident('inc-123', 'resolution', 'admin'),
      ).rejects.toThrow('Incidente ya está cerrado');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: CONSULTAS
  // --------------------------------------------------------------------------

  describe('getByEntity', () => {
    it('debe obtener incidentes por entidad', async () => {
      const incidents = [
        { id: 'inc-1', code: 'FRAUD_MULTIPLE_ACCOUNTS', status: 'RESOLVED' },
        { id: 'inc-2', code: 'USER_COMPLAINT', status: 'OPEN' },
      ];

      mockPrismaService.incident.findMany.mockResolvedValue(incidents);

      const result = await service.getByEntity('User', 'user-123');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.incident.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'User',
          entityId: 'user-123',
        },
        include: { actions: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getPending', () => {
    it('debe obtener incidentes pendientes', async () => {
      const pendingIncidents = [
        { id: 'inc-1', status: 'OPEN', priority: 'HIGH' },
        { id: 'inc-2', status: 'IN_PROGRESS', priority: 'MEDIUM' },
      ];

      mockPrismaService.incident.findMany.mockResolvedValue(pendingIncidents);

      const result = await service.getPending();

      expect(mockPrismaService.incident.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS', 'ESCALATED'] },
        },
        include: { actions: true },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
    });
  });

  describe('getStats', () => {
    it('debe retornar estadísticas de incidentes', async () => {
      mockPrismaService.incident.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(3)  // open
        .mockResolvedValueOnce(4)  // in_progress
        .mockResolvedValueOnce(1)  // escalated
        .mockResolvedValueOnce(2); // resolved today

      const result = await service.getStats();

      expect(result).toEqual({
        total: 10,
        open: 3,
        inProgress: 4,
        escalated: 1,
        resolvedToday: 2,
      });
    });
  });

  // --------------------------------------------------------------------------
  // DOC 38: CATÁLOGOS
  // --------------------------------------------------------------------------

  describe('Catálogos de códigos', () => {
    it('debe tener códigos de incidentes definidos', () => {
      // Fraude
      expect(INCIDENT_CODES).toContain('FRAUD_MULTIPLE_ACCOUNTS');
      expect(INCIDENT_CODES).toContain('FRAUD_SUSPICIOUS_IP');
      expect(INCIDENT_CODES).toContain('FRAUD_PAYMENT_CHARGEBACK');
      
      // Disputas
      expect(INCIDENT_CODES).toContain('DISPUTE_PRIZE_NOT_RECEIVED');
      expect(INCIDENT_CODES).toContain('DISPUTE_WRONG_PRIZE');
      expect(INCIDENT_CODES).toContain('DISPUTE_PAYMENT_ISSUE');
      
      // Quejas
      expect(INCIDENT_CODES).toContain('USER_COMPLAINT');
      expect(INCIDENT_CODES).toContain('CAUSE_COMPLAINT');
      
      // Técnicos
      expect(INCIDENT_CODES).toContain('TECHNICAL_RAFFLE_ERROR');
      expect(INCIDENT_CODES).toContain('TECHNICAL_PAYMENT_ERROR');
    });

    it('debe tener estados de incidente válidos', () => {
      expect(INCIDENT_STATUS).toContain('OPEN');
      expect(INCIDENT_STATUS).toContain('IN_PROGRESS');
      expect(INCIDENT_STATUS).toContain('ESCALATED');
      expect(INCIDENT_STATUS).toContain('RESOLVED');
      expect(INCIDENT_STATUS).toContain('CLOSED');
    });

    it('debe tener flags bloqueantes definidos', () => {
      expect(BLOCKING_FLAG_CODES).toContain('FLAG_FRAUD_SUSPECTED');
      expect(BLOCKING_FLAG_CODES).toContain('FLAG_FRAUD_CONFIRMED');
      expect(BLOCKING_FLAG_CODES).toContain('FLAG_DISPUTE_OPEN');
      expect(BLOCKING_FLAG_CODES).toContain('FLAG_LEGAL_HOLD');
    });
  });
});
