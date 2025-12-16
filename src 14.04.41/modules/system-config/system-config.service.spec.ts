// DOCUMENTO 40 - CONFIGURACIÓN GLOBAL Y PARÁMETROS
// Tests unitarios para sistema de configuración
// Cumple DOC 40 secciones: 4-17

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SystemConfigService } from './system-config.service';
import {
  CONFIG_GROUPS,
  CONFIG_VALUE_TYPES,
  DEFAULT_CONFIGS,
  SENSITIVE_CONFIG_KEYS,
  MONEY_CONFIG_KEYS,
  FEES_CONFIG_KEYS,
  RAFFLE_CONFIG_KEYS,
  FRAUD_CONFIG_KEYS,
} from './system-config.types';

// ============================================================================
// MOCKS
// ============================================================================

const mockPrismaService = {
  systemConfig: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  systemConfigHistory: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockAuditLogService = {
  log: jest.fn(),
};

// ============================================================================
// TESTS: SystemConfigService
// ============================================================================

describe('SystemConfigService', () => {
  let service: SystemConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemConfigService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditLogService, useValue: mockAuditLogService },
      ],
    }).compile();

    service = module.get<SystemConfigService>(SystemConfigService);
    service.clearCache();
    jest.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 14: OBTENER CONFIGURACIÓN
  // --------------------------------------------------------------------------

  describe('get', () => {
    it('debe obtener configuración por clave', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'money.minWithdrawal',
        valueType: 'DECIMAL',
        valueDecimal: 10.00,
      });

      const result = await service.get<number>('money.minWithdrawal');

      expect(result).toBe(10.00);
    });

    it('debe usar cache en llamadas repetidas', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'money.minWithdrawal',
        valueType: 'DECIMAL',
        valueDecimal: 10.00,
      });

      await service.get('money.minWithdrawal');
      await service.get('money.minWithdrawal');

      // Solo debe llamar a DB una vez
      expect(mockPrismaService.systemConfig.findFirst).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar error si no existe la configuración', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue(null);

      await expect(service.get('nonexistent.key')).rejects.toThrow(
        'Configuración no encontrada',
      );
    });

    it('debe soportar configuración por país con fallback', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'legal.minimumAge',
        valueType: 'INTEGER',
        valueInteger: 18,
        countryCode: 'ES',
      });

      const result = await service.get<number>('legal.minimumAge', { country: 'ES' });

      expect(result).toBe(18);
      expect(mockPrismaService.systemConfig.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            configKey: 'legal.minimumAge',
          }),
        }),
      );
    });
  });

  describe('getOrDefault', () => {
    it('debe retornar default si no existe', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue(null);

      const result = await service.getOrDefault('nonexistent', 100);

      expect(result).toBe(100);
    });

    it('debe retornar valor de DB si existe', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'raffle.minParticipants',
        valueType: 'INTEGER',
        valueInteger: 10,
      });

      const result = await service.getOrDefault('raffle.minParticipants', 5);

      expect(result).toBe(10);
    });
  });

  describe('getByGroup', () => {
    it('debe obtener todas las configuraciones de un grupo', async () => {
      mockPrismaService.systemConfig.findMany.mockResolvedValue([
        { configKey: 'money.minWithdrawal', configGroup: 'MONEY', valueType: 'DECIMAL', valueDecimal: 10, version: 1, updatedAt: new Date() },
        { configKey: 'money.maxAutoRelease', configGroup: 'MONEY', valueType: 'DECIMAL', valueDecimal: 500, version: 1, updatedAt: new Date() },
      ]);

      const result = await service.getByGroup('MONEY');

      expect(result).toHaveLength(2);
      expect(result[0].key).toBe('money.minWithdrawal');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 14: ESTABLECER CONFIGURACIÓN
  // --------------------------------------------------------------------------

  describe('set', () => {
    it('debe crear nueva configuración si no existe', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.systemConfig.create.mockResolvedValue({
        id: 'new-id',
        configKey: 'test.key',
      });

      await service.set('test.key', 'test-value', {
        changedBy: 'admin-123',
        reason: 'Test',
      });

      expect(mockPrismaService.systemConfig.create).toHaveBeenCalled();
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONFIG_CHANGED',
          entityType: 'SystemConfig',
        }),
      );
    });

    it('debe actualizar configuración existente y guardar historial', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        id: 'existing-id',
        configKey: 'money.minWithdrawal',
        valueType: 'DECIMAL',
        valueDecimal: 10,
        version: 1,
      });
      mockPrismaService.systemConfig.update.mockResolvedValue({});
      mockPrismaService.systemConfigHistory.create.mockResolvedValue({});

      await service.set('money.minWithdrawal', 20, {
        changedBy: 'admin-123',
        reason: 'Ajuste de umbral',
      });

      // Debe crear historial
      expect(mockPrismaService.systemConfigHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          configKey: 'money.minWithdrawal',
          oldValue: 10,
          newValue: 20,
          changeReason: 'Ajuste de umbral',
        }),
      });

      // Debe actualizar con versión incrementada
      expect(mockPrismaService.systemConfig.update).toHaveBeenCalledWith({
        where: { id: 'existing-id' },
        data: expect.objectContaining({
          version: 2,
        }),
      });
    });

    it('debe invalidar cache después de set', async () => {
      // Primero llenar cache
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'test.key',
        valueType: 'STRING',
        valueString: 'old-value',
      });
      await service.get('test.key');

      // Actualizar
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        id: 'id-1',
        configKey: 'test.key',
        valueType: 'STRING',
        valueString: 'old-value',
        version: 1,
      });
      await service.set('test.key', 'new-value', {
        changedBy: 'admin',
        reason: 'test',
      });

      // Siguiente get debe ir a DB
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({
        configKey: 'test.key',
        valueType: 'STRING',
        valueString: 'new-value',
      });
      const result = await service.get('test.key');

      expect(mockPrismaService.systemConfig.findFirst).toHaveBeenCalledTimes(3);
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 13: HISTORIAL
  // --------------------------------------------------------------------------

  describe('getHistory', () => {
    it('debe obtener historial de cambios', async () => {
      mockPrismaService.systemConfigHistory.findMany.mockResolvedValue([
        { id: 'h1', configKey: 'money.minWithdrawal', oldValue: 5, newValue: 10, changedBy: 'admin-1', changedAt: new Date() },
        { id: 'h2', configKey: 'money.minWithdrawal', oldValue: 10, newValue: 20, changedBy: 'admin-2', changedAt: new Date() },
      ]);

      const result = await service.getHistory('money.minWithdrawal');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.systemConfigHistory.findMany).toHaveBeenCalledWith({
        where: { configKey: 'money.minWithdrawal' },
        orderBy: { changedAt: 'desc' },
      });
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 17: SEED
  // --------------------------------------------------------------------------

  describe('seedDefaults', () => {
    it('debe crear configuraciones por defecto', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue(null);
      mockPrismaService.systemConfig.create.mockResolvedValue({});

      const result = await service.seedDefaults('admin-123');

      expect(result.created).toBeGreaterThan(0);
      expect(mockAuditLogService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONFIG_SEED_EXECUTED',
        }),
      );
    });

    it('debe reportar configuraciones existentes', async () => {
      mockPrismaService.systemConfig.findFirst.mockResolvedValue({ id: 'existing' });

      const result = await service.seedDefaults('admin-123');

      expect(result.existing).toBe(DEFAULT_CONFIGS.length);
      expect(result.created).toBe(0);
    });
  });
});

// ============================================================================
// TESTS: Tipos y Constantes
// ============================================================================

describe('System Config Types', () => {
  // --------------------------------------------------------------------------
  // DOC 40 seccion 3: GRUPOS DE CONFIGURACIÓN
  // --------------------------------------------------------------------------

  describe('Grupos de configuración', () => {
    it('debe tener todos los grupos definidos en DOC 40', () => {
      expect(CONFIG_GROUPS).toContain('MONEY');
      expect(CONFIG_GROUPS).toContain('FEES');
      expect(CONFIG_GROUPS).toContain('RAFFLE');
      expect(CONFIG_GROUPS).toContain('PRIZE');
      expect(CONFIG_GROUPS).toContain('CAUSE');
      expect(CONFIG_GROUPS).toContain('KYC');
      expect(CONFIG_GROUPS).toContain('MESSAGING');
      expect(CONFIG_GROUPS).toContain('FRAUD');
      expect(CONFIG_GROUPS).toContain('GEO');
      expect(CONFIG_GROUPS).toContain('LEGAL');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 13: TIPOS DE VALOR
  // --------------------------------------------------------------------------

  describe('Tipos de valor', () => {
    it('debe soportar todos los tipos necesarios', () => {
      expect(CONFIG_VALUE_TYPES).toContain('STRING');
      expect(CONFIG_VALUE_TYPES).toContain('INTEGER');
      expect(CONFIG_VALUE_TYPES).toContain('DECIMAL');
      expect(CONFIG_VALUE_TYPES).toContain('BOOLEAN');
      expect(CONFIG_VALUE_TYPES).toContain('JSON');
      expect(CONFIG_VALUE_TYPES).toContain('ARRAY');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 secciones 4-12: CLAVES POR GRUPO
  // --------------------------------------------------------------------------

  describe('Claves de configuración', () => {
    it('debe tener claves económicas (DOC 40 seccion 4)', () => {
      expect(MONEY_CONFIG_KEYS.MIN_WITHDRAWAL).toBe('money.minWithdrawal');
      expect(MONEY_CONFIG_KEYS.KYC_LEVEL2_THRESHOLD).toBe('money.kycLevel2Threshold');
      expect(MONEY_CONFIG_KEYS.MAX_AUTO_RELEASE).toBe('money.maxAutoRelease');
    });

    it('debe tener claves de fees (DOC 40 seccion 4.2)', () => {
      expect(FEES_CONFIG_KEYS.PLATFORM_FEE).toBe('fees.platformFee');
      expect(FEES_CONFIG_KEYS.CAUSE_SHARE).toBe('fees.causeShare');
      expect(FEES_CONFIG_KEYS.CREATOR_SHARE).toBe('fees.creatorShare');
    });

    it('debe tener claves de sorteos (DOC 40 seccion 5)', () => {
      expect(RAFFLE_CONFIG_KEYS.MAX_TICKETS_PER_USER).toBe('raffle.maxTicketsPerUser');
      expect(RAFFLE_CONFIG_KEYS.MIN_PARTICIPANTS).toBe('raffle.minParticipants');
      expect(RAFFLE_CONFIG_KEYS.MAX_DURATION_DAYS).toBe('raffle.maxDurationDays');
    });

    it('debe tener claves de fraude (DOC 40 seccion 10)', () => {
      expect(FRAUD_CONFIG_KEYS.FLAGS_BEFORE_SUSPENSION).toBe('fraud.flagsBeforeSuspension');
      expect(FRAUD_CONFIG_KEYS.FLAGS_BEFORE_BLOCK).toBe('fraud.flagsBeforeBlock');
      expect(FRAUD_CONFIG_KEYS.MAX_ACCOUNTS_PER_IP).toBe('fraud.maxAccountsPerIp');
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 17: VALORES POR DEFECTO
  // --------------------------------------------------------------------------

  describe('Valores por defecto', () => {
    it('debe tener configuraciones por defecto definidas', () => {
      expect(DEFAULT_CONFIGS.length).toBeGreaterThan(40);
    });

    it('cada default debe tener los campos requeridos', () => {
      for (const config of DEFAULT_CONFIGS) {
        expect(config).toHaveProperty('key');
        expect(config).toHaveProperty('group');
        expect(config).toHaveProperty('valueType');
        expect(config).toHaveProperty('value');
        expect(config).toHaveProperty('description');
      }
    });

    it('debe incluir configuraciones económicas críticas', () => {
      const moneyConfigs = DEFAULT_CONFIGS.filter((c) => c.group === 'MONEY');
      expect(moneyConfigs.length).toBeGreaterThanOrEqual(4);
    });

    it('debe incluir configuraciones de fees', () => {
      const feeConfigs = DEFAULT_CONFIGS.filter((c) => c.group === 'FEES');
      expect(feeConfigs.length).toBeGreaterThanOrEqual(3);
    });
  });

  // --------------------------------------------------------------------------
  // DOC 40 seccion 15: CONFIGURACIONES SENSIBLES
  // --------------------------------------------------------------------------

  describe('Configuraciones sensibles', () => {
    it('debe marcar claves financieras como sensibles', () => {
      expect(SENSITIVE_CONFIG_KEYS).toContain('money.kycLevel2Threshold');
      expect(SENSITIVE_CONFIG_KEYS).toContain('fees.platformFee');
      expect(SENSITIVE_CONFIG_KEYS).toContain('fees.causeShare');
    });

    it('debe marcar claves de fraude como sensibles', () => {
      expect(SENSITIVE_CONFIG_KEYS).toContain('fraud.flagsBeforeSuspension');
      expect(SENSITIVE_CONFIG_KEYS).toContain('fraud.flagsBeforeBlock');
    });
  });
});
