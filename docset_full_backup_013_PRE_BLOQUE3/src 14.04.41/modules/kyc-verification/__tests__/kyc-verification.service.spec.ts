// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Tests del servicio de verificación KYC
// REGLA MADRE: NADIE recibe dinero sin verificación previa
// REGLA DE ORO: SIN EVIDENCIA = SIN DINERO

import { Test, TestingModule } from '@nestjs/testing';
import { KycVerificationService } from '../kyc-verification.service';
import { PrismaService } from '../../shared/prisma.service';
import {
  VerificationStatus,
  KycLevel,
  TriggerEvent,
  FundStatus,
  KYC_CONFIG,
} from '../kyc-verification.constants';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('KycVerificationService - DOCUMENTO 33 Antifraude', () => {
  let service: KycVerificationService;
  let prisma: PrismaService;

  // Mock de PrismaService
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    userVerification: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    verificationTrigger: {
      create: jest.fn(),
    },
    fundState: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    kycAuditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycVerificationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<KycVerificationService>(KycVerificationService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  // ==========================================================================
  // SECCIÓN 1: REGLA MADRE - NADIE recibe dinero sin verificación
  // ==========================================================================

  describe('Regla Madre: NADIE recibe dinero sin verificación', () => {
    it('debe requerir KYC para solicitud de retiro', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.WITHDRAWAL_REQUEST,
        100,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_1);
    });

    it('debe requerir KYC para pago de premio', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.PRIZE_PAYMENT,
        50,
      );

      expect(result.required).toBe(true);
    });

    it('debe requerir KYC LEVEL_2 para creación de causa propia', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.CAUSE_CREATION,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_2);
    });

    it('debe requerir KYC LEVEL_2 para premios de alto valor', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.HIGH_VALUE_PRIZE,
        KYC_CONFIG.HIGH_VALUE_PRIZE_THRESHOLD + 1,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_2);
    });

    it('NO debe requerir KYC si usuario ya está verificado al nivel correcto', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
      });

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.WITHDRAWAL_REQUEST,
        100,
      );

      expect(result.required).toBe(false);
      expect(result.reason).toContain('verificado');
    });

    it('debe requerir upgrade a LEVEL_2 si solo tiene LEVEL_1 para causa propia', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
      });

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.CAUSE_CREATION,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_2);
    });
  });

  // ==========================================================================
  // SECCIÓN 2: Estados de verificación
  // ==========================================================================

  describe('Estados de Verificación (DOC33 §4)', () => {
    it('usuario nuevo debe tener estado NOT_VERIFIED', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe(VerificationStatus.NOT_VERIFIED);
      expect(result.canReceiveMoney).toBe(false);
    });

    it('usuario con verificación PENDING no puede recibir dinero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFICATION_PENDING,
        level: KycLevel.LEVEL_1,
      });
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe(VerificationStatus.VERIFICATION_PENDING);
      expect(result.canReceiveMoney).toBe(false);
    });

    it('usuario con verificación REJECTED no puede recibir dinero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFICATION_REJECTED,
        level: KycLevel.LEVEL_1,
      });
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe(VerificationStatus.VERIFICATION_REJECTED);
      expect(result.canReceiveMoney).toBe(false);
    });

    it('usuario con verificación VERIFIED puede recibir dinero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
        verifiedAt: new Date(),
      });
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.canReceiveMoney).toBe(true);
    });

    it('usuario con verificación EXPIRED no puede recibir dinero', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFICATION_EXPIRED,
        level: KycLevel.LEVEL_1,
      });
      mockPrisma.fundState.findMany.mockResolvedValue([]);

      const result = await service.getVerificationStatus('user-123');

      expect(result.status).toBe(VerificationStatus.VERIFICATION_EXPIRED);
      expect(result.canReceiveMoney).toBe(false);
    });
  });

  // ==========================================================================
  // SECCIÓN 3: Control de intentos de verificación
  // ==========================================================================

  describe('Control de Intentos de Verificación', () => {
    it('debe rechazar si excede máximo de intentos', async () => {
      mockPrisma.userVerification.count.mockResolvedValue(
        KYC_CONFIG.MAX_VERIFICATION_ATTEMPTS,
      );

      await expect(
        service.startVerification('user-123', { level: KycLevel.LEVEL_1 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si ya hay verificación pendiente', async () => {
      mockPrisma.userVerification.count.mockResolvedValue(1);
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFICATION_PENDING,
      });

      await expect(
        service.startVerification('user-123', { level: KycLevel.LEVEL_1 }),
      ).rejects.toThrow('Ya tienes una verificación en proceso');
    });

    it('debe permitir nueva verificación si no hay pendiente', async () => {
      mockPrisma.userVerification.count.mockResolvedValue(1);
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);
      mockPrisma.userVerification.create.mockResolvedValue({
        id: 'verification-123',
        status: VerificationStatus.VERIFICATION_PENDING,
        level: KycLevel.LEVEL_1,
        providerSessionId: 'session-123',
      });
      mockPrisma.kycAuditLog.create.mockResolvedValue({});

      const result = await service.startVerification('user-123', {
        level: KycLevel.LEVEL_1,
      });

      expect(result.level).toBe(KycLevel.LEVEL_1);
      expect(result.sessionId).toBeDefined();
    });
  });

  // ==========================================================================
  // SECCIÓN 4: Requisitos de liberación de fondos (DOC33 §13)
  // ==========================================================================

  describe('Requisitos de Liberación de Fondos (DOC33 §13)', () => {
    it('debe listar requisitos faltantes si usuario no verificado', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.getWithdrawalRequirements('user-123');

      expect(result.userVerified).toBe(false);
      expect(result.missingRequirements).toContain('Usuario no verificado (KYC requerido)');
      expect(result.allRequirementsMet).toBe(false);
    });

    it('debe indicar todos los requisitos cumplidos si usuario verificado', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
      });

      const result = await service.getWithdrawalRequirements('user-123');

      expect(result.userVerified).toBe(true);
      // En implementación completa, verificar más requisitos
    });
  });

  // ==========================================================================
  // SECCIÓN 5: Retiros de fondos
  // ==========================================================================

  describe('Solicitud de Retiro de Fondos', () => {
    it('debe rechazar retiro si no cumple requisitos', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.requestWithdrawal('user-123', {
        amount: 100,
        currency: 'EUR',
        sourceId: 'source-123',
        sourceType: 'sweepstake',
      });

      expect(result.success).toBe(false);
      expect(result.requirements?.allRequirementsMet).toBe(false);
    });

    it('debe rechazar retiro si no hay fondos aprobados', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
      });
      mockPrisma.fundState.findFirst.mockResolvedValue(null);

      await expect(
        service.requestWithdrawal('user-123', {
          amount: 100,
          currency: 'EUR',
          sourceId: 'source-123',
          sourceType: 'sweepstake',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe rechazar retiro si monto supera disponible', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue({
        status: VerificationStatus.VERIFIED,
        level: KycLevel.LEVEL_1,
      });
      mockPrisma.fundState.findFirst.mockResolvedValue({
        id: 'fund-123',
        status: FundStatus.APPROVED,
        amount: 50,
      });

      await expect(
        service.requestWithdrawal('user-123', {
          amount: 100,
          currency: 'EUR',
          sourceId: 'source-123',
          sourceType: 'sweepstake',
        }),
      ).rejects.toThrow('Monto solicitado supera el disponible');
    });
  });

  // ==========================================================================
  // SECCIÓN 6: Transiciones de estado de fondos (DOC33 §12)
  // ==========================================================================

  describe('Transiciones de Estado de Fondos (DOC33 §12)', () => {
    it('solo transiciones válidas permitidas: GENERATED → HELD', async () => {
      // Esta validación debe estar en el servicio al cambiar estados
      const { isValidFundTransition } = require('../kyc-verification.constants');
      
      expect(isValidFundTransition(FundStatus.GENERATED, FundStatus.HELD)).toBe(true);
      expect(isValidFundTransition(FundStatus.GENERATED, FundStatus.RELEASED)).toBe(false);
    });

    it('no se puede saltar de GENERATED a RELEASED directamente', async () => {
      const { isValidFundTransition } = require('../kyc-verification.constants');
      
      expect(isValidFundTransition(FundStatus.GENERATED, FundStatus.RELEASED)).toBe(false);
    });

    it('PENDING_VERIFICATION puede ir a APPROVED o REJECTED', async () => {
      const { isValidFundTransition } = require('../kyc-verification.constants');
      
      expect(isValidFundTransition(FundStatus.PENDING_VERIFICATION, FundStatus.APPROVED)).toBe(true);
      expect(isValidFundTransition(FundStatus.PENDING_VERIFICATION, FundStatus.REJECTED)).toBe(true);
    });

    it('RELEASED es estado final - no puede transicionar', async () => {
      const { isValidFundTransition } = require('../kyc-verification.constants');
      
      expect(isValidFundTransition(FundStatus.RELEASED, FundStatus.BLOCKED)).toBe(false);
      expect(isValidFundTransition(FundStatus.RELEASED, FundStatus.HELD)).toBe(false);
    });
  });

  // ==========================================================================
  // SECCIÓN 7: Umbral de montos (DOC33 §7)
  // ==========================================================================

  describe('Umbral de Montos para KYC', () => {
    it('debe requerir LEVEL_2 si monto acumulado supera umbral', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);
      mockPrisma.fundState.findMany.mockResolvedValue([
        { amount: KYC_CONFIG.THRESHOLD_AMOUNT + 100, status: FundStatus.HELD },
      ]);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.THRESHOLD_REACHED,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_2);
    });

    it('debe requerir LEVEL_2 para premio de alto valor', async () => {
      mockPrisma.userVerification.findFirst.mockResolvedValue(null);

      const result = await service.checkIfVerificationRequired(
        'user-123',
        TriggerEvent.HIGH_VALUE_PRIZE,
        KYC_CONFIG.HIGH_VALUE_PRIZE_THRESHOLD + 1,
      );

      expect(result.required).toBe(true);
      expect(result.level).toBe(KycLevel.LEVEL_2);
    });
  });
});
