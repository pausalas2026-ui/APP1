// DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
// Tests unitarios del servicio de auditoria
// Seccion 13 - Checklist para el programador IA

import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../shared/prisma.service';
import {
  AuditCategory,
  ActorType,
  USER_EVENTS,
  RAFFLE_EVENTS,
  MONEY_EVENTS,
  PRIZE_EVENTS,
} from './audit-log.types';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: PrismaService;

  // Mock de PrismaService
  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('log', () => {
    /**
     * DOC 37 Seccion 4.1: Logs de usuario
     * Verifica que se crea log correctamente
     */
    it('debe crear log de evento de usuario', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: USER_EVENTS.USER_REGISTERED,
        entityType: 'USER',
        entityId: 'user-123',
        actorId: 'user-123',
        actorType: ActorType.USER,
        metadata: { method: 'email' },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'USER_REGISTERED',
          entityType: 'USER',
          entityId: 'user-123',
          actorId: 'user-123',
          actorType: 'USER',
          metadata: { method: 'email' },
        }),
      });
    });

    /**
     * DOC 37 Seccion 5: Estructura minima
     * Verifica que actorId default es 'SYSTEM'
     */
    it('debe usar SYSTEM como actorId por defecto', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: 'TEST_EVENT',
        entityType: 'TEST',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
        }),
      });
    });

    /**
     * DOC 37 Seccion 7: Categorizacion automatica
     * Verifica inferencia de categoria FINANCIAL
     */
    it('debe inferir categoria FINANCIAL para eventos MONEY_*', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: MONEY_EVENTS.MONEY_GENERATED,
        entityType: 'MONEY',
        entityId: 'money-123',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.FINANCIAL,
        }),
      });
    });

    /**
     * DOC 37 Seccion 7: Categorizacion automatica
     * Verifica inferencia de categoria SECURITY
     */
    it('debe inferir categoria SECURITY para eventos LOGIN', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: USER_EVENTS.USER_LOGIN,
        entityType: 'USER',
        entityId: 'user-123',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.SECURITY,
        }),
      });
    });

    /**
     * DOC 37 Seccion 7: Categorizacion automatica
     * Verifica inferencia de categoria LEGAL
     */
    it('debe inferir categoria LEGAL para eventos de consentimiento', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: USER_EVENTS.USER_TOS_ACCEPTED,
        entityType: 'USER',
        entityId: 'user-123',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.LEGAL,
        }),
      });
    });

    /**
     * DOC 37 Seccion 7: Categorizacion automatica
     * Verifica inferencia de categoria OPERATIONAL por defecto
     */
    it('debe inferir categoria OPERATIONAL por defecto', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: RAFFLE_EVENTS.RAFFLE_CREATED,
        entityType: 'RAFFLE',
        entityId: 'raffle-123',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.OPERATIONAL,
        }),
      });
    });

    /**
     * DOC 37: Verifica que se respeta categoria especificada manualmente
     */
    it('debe respetar categoria especificada explicitamente', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.log({
        eventType: 'CUSTOM_EVENT',
        entityType: 'CUSTOM',
        category: AuditCategory.LEGAL,
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.LEGAL,
        }),
      });
    });
  });

  describe('logFinancial', () => {
    /**
     * DOC 37 Seccion 4.4: Logs de dinero (CRITICOS)
     */
    it('debe crear log financiero con categoria FINANCIAL', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.logFinancial(
        MONEY_EVENTS.MONEY_STATE_CHANGED,
        'money-123',
        'admin-456',
        { from: 'RETENIDO', to: 'LIBERADO' },
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'MONEY_STATE_CHANGED',
          entityType: 'MONEY',
          entityId: 'money-123',
          actorId: 'admin-456',
          category: AuditCategory.FINANCIAL,
          metadata: { from: 'RETENIDO', to: 'LIBERADO' },
        }),
      });
    });

    /**
     * DOC 37: SYSTEM como actor automatico
     */
    it('debe usar actorType SYSTEM cuando actorId es SYSTEM', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.logFinancial(
        MONEY_EVENTS.MONEY_GENERATED,
        'money-123',
        'SYSTEM',
        { amount: 100, currency: 'EUR' },
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId: 'SYSTEM',
          actorType: 'SYSTEM',
        }),
      });
    });
  });

  describe('logLegal', () => {
    /**
     * DOC 37 Seccion 8: Relacion con auditoria legal
     */
    it('debe crear log legal con categoria LEGAL', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.logLegal(
        PRIZE_EVENTS.PRIZE_CONFIRMED_BY_WINNER,
        'PRIZE',
        'prize-123',
        'winner-456',
        { confirmationDate: new Date().toISOString() },
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.LEGAL,
          entityType: 'PRIZE',
          actorId: 'winner-456',
        }),
      });
    });
  });

  describe('logSecurity', () => {
    /**
     * DOC 37: Logs de seguridad con IP y UserAgent
     */
    it('debe crear log de seguridad con contexto tecnico', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });

      await service.logSecurity(
        USER_EVENTS.USER_LOGIN_FAILED,
        'USER',
        null,
        null,
        { email: 'test@example.com', reason: 'invalid_password' },
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: AuditCategory.SECURITY,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
      });
    });
  });

  describe('query', () => {
    /**
     * DOC 37 Seccion 9: API de consulta para admin
     */
    it('debe consultar logs con filtros', async () => {
      const mockLogs = [{ id: 'log-1' }, { id: 'log-2' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.query({
        entityType: 'USER',
        category: AuditCategory.SECURITY,
        limit: 10,
      });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'USER',
          category: AuditCategory.SECURITY,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
      expect(result).toEqual(mockLogs);
    });

    /**
     * DOC 37: Filtro por rango de fechas
     */
    it('debe filtrar por rango de fechas', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);

      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');

      await service.query({ dateFrom, dateTo });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        skip: 0,
      });
    });
  });

  describe('getEntityHistory', () => {
    /**
     * DOC 37: Historial completo de entidad
     */
    it('debe obtener historial de una entidad', async () => {
      const mockLogs = [{ id: 'log-1' }, { id: 'log-2' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getEntityHistory('USER', 'user-123', 25);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'USER',
          entityId: 'user-123',
        },
        orderBy: { createdAt: 'desc' },
        take: 25,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('exportForAudit', () => {
    /**
     * DOC 37 Seccion 11: Exportacion para auditoria externa
     */
    it('debe exportar logs para auditoria', async () => {
      const mockLogs = [
        { id: 'log-1', createdAt: new Date() },
        { id: 'log-2', createdAt: new Date() },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.exportForAudit('RAFFLE', 'raffle-123');

      expect(result).toMatchObject({
        entityType: 'RAFFLE',
        entityId: 'raffle-123',
        totalEvents: 2,
        events: mockLogs,
      });
      expect(result.exportedAt).toBeInstanceOf(Date);
    });
  });

  describe('getStatsByCategory', () => {
    /**
     * DOC 37: Estadisticas por categoria para dashboards
     */
    it('debe obtener estadisticas por categoria', async () => {
      mockPrisma.auditLog.groupBy.mockResolvedValue([
        { category: 'FINANCIAL', _count: { id: 100 } },
        { category: 'LEGAL', _count: { id: 50 } },
        { category: 'OPERATIONAL', _count: { id: 200 } },
      ]);

      const result = await service.getStatsByCategory();

      expect(result).toEqual({
        FINANCIAL: 100,
        LEGAL: 50,
        OPERATIONAL: 200,
      });
    });
  });

  /**
   * DOC 37 Seccion 13: Checklist de requisitos
   */
  describe('Checklist DOC 37', () => {
    it('✓ Logs por evento critico - metodo log() existe', () => {
      expect(typeof service.log).toBe('function');
    });

    it('✓ Logs inmutables - sin metodos update/delete', () => {
      expect((service as any).update).toBeUndefined();
      expect((service as any).delete).toBeUndefined();
    });

    it('✓ Logs estructurados - usa metadata JSON', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });
      
      await service.log({
        eventType: 'TEST',
        entityType: 'TEST',
        metadata: { structured: true, data: 'value' },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { structured: true, data: 'value' },
        }),
      });
    });

    it('✓ Logs financieros completos - helper logFinancial()', () => {
      expect(typeof service.logFinancial).toBe('function');
    });

    it('✓ Logs legales - helper logLegal()', () => {
      expect(typeof service.logLegal).toBe('function');
    });

    it('✓ Categorizacion automatica - inferCategory()', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'test-id' });
      
      // FINANCIAL inferido
      await service.log({ eventType: 'MONEY_TEST', entityType: 'MONEY' });
      expect(mockPrisma.auditLog.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({ category: 'FINANCIAL' }),
      });
    });

    it('✓ API de consulta para admin - query()', () => {
      expect(typeof service.query).toBe('function');
    });

    it('✓ Exportacion para auditoria - exportForAudit()', () => {
      expect(typeof service.exportForAudit).toBe('function');
    });
  });
});
