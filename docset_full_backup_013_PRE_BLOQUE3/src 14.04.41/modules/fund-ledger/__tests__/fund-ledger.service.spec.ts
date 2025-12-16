// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS
// Tests del servicio Fund Ledger
// REGLA: El dinero SOLO puede avanzar hacia adelante, NUNCA retroceder
// REGLA: Sin checklist completo, NO se libera

import { Test, TestingModule } from '@nestjs/testing';
import { FundLedgerService } from '../fund-ledger.service';
import { PrismaService } from '../../shared/prisma.service';
import {
  FundLedgerStatus,
  FundSourceType,
  FundActorType,
  VALID_FUND_TRANSITIONS,
  isValidFundTransition,
  isFinalState,
  isChecklistComplete,
} from '../fund-ledger.constants';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('FundLedgerService - DOCUMENTO 34 Estados de Dinero', () => {
  let service: FundLedgerService;

  // Mock de PrismaService
  const mockPrisma = {
    fundLedger: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    fundStatusHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    fundReleaseChecklist: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FundLedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<FundLedgerService>(FundLedgerService);
    jest.clearAllMocks();
  });

  // ==========================================================================
  // SECCIÓN 1: TRANSICIONES DE ESTADO - DOC34 §5
  // ==========================================================================

  describe('Transiciones de Estado (DOC34 §5)', () => {
    it('GENERATED → HELD es válido', () => {
      expect(isValidFundTransition(FundLedgerStatus.GENERATED, FundLedgerStatus.HELD)).toBe(true);
    });

    it('HELD → PENDING_VERIFICATION es válido', () => {
      expect(isValidFundTransition(FundLedgerStatus.HELD, FundLedgerStatus.PENDING_VERIFICATION)).toBe(true);
    });

    it('PENDING_VERIFICATION → APPROVED es válido', () => {
      expect(isValidFundTransition(FundLedgerStatus.PENDING_VERIFICATION, FundLedgerStatus.APPROVED)).toBe(true);
    });

    it('APPROVED → RELEASED es válido', () => {
      expect(isValidFundTransition(FundLedgerStatus.APPROVED, FundLedgerStatus.RELEASED)).toBe(true);
    });

    it('RELEASED → cualquier estado es PROHIBIDO (estado final)', () => {
      expect(isValidFundTransition(FundLedgerStatus.RELEASED, FundLedgerStatus.HELD)).toBe(false);
      expect(isValidFundTransition(FundLedgerStatus.RELEASED, FundLedgerStatus.BLOCKED)).toBe(false);
      expect(isValidFundTransition(FundLedgerStatus.RELEASED, FundLedgerStatus.APPROVED)).toBe(false);
    });

    it('LIBERADO → RETENIDO es PROHIBIDO (no puede retroceder)', () => {
      expect(isValidFundTransition(FundLedgerStatus.RELEASED, FundLedgerStatus.HELD)).toBe(false);
    });

    it('APROBADO → GENERADO es PROHIBIDO (no puede retroceder)', () => {
      expect(isValidFundTransition(FundLedgerStatus.APPROVED, FundLedgerStatus.GENERATED)).toBe(false);
    });

    it('Solo BLOCKED puede volver a PENDING_VERIFICATION (desbloqueo)', () => {
      expect(isValidFundTransition(FundLedgerStatus.BLOCKED, FundLedgerStatus.PENDING_VERIFICATION)).toBe(true);
    });

    it('RELEASED es estado final', () => {
      expect(isFinalState(FundLedgerStatus.RELEASED)).toBe(true);
    });

    it('HELD no es estado final', () => {
      expect(isFinalState(FundLedgerStatus.HELD)).toBe(false);
    });
  });

  // ==========================================================================
  // SECCIÓN 2: DINERO SIEMPRE NACE RETENIDO
  // ==========================================================================

  describe('Dinero siempre nace RETENIDO (DOC34 §2)', () => {
    it('al crear fondo, estado inicial debe ser HELD', async () => {
      mockPrisma.fundLedger.create.mockResolvedValue({
        id: 'fund-123',
        userId: 'user-123',
        status: FundLedgerStatus.HELD,
        previousStatus: FundLedgerStatus.GENERATED,
        amount: 100,
        currency: 'EUR',
      });
      mockPrisma.fundStatusHistory.create.mockResolvedValue({});
      mockPrisma.fundReleaseChecklist.create.mockResolvedValue({});

      const result = await service.createFund({
        userId: 'user-123',
        sourceType: FundSourceType.DONATION,
        sourceId: 'donation-123',
        amount: 100,
        currency: 'EUR',
      });

      expect(result.status).toBe(FundLedgerStatus.HELD);
      expect(result.previousStatus).toBe(FundLedgerStatus.GENERATED);
    });
  });

  // ==========================================================================
  // SECCIÓN 3: CHECKLIST DE LIBERACIÓN - DOC34 §12
  // ==========================================================================

  describe('Checklist de Liberación (DOC34 §12)', () => {
    it('checklist incompleto impide liberación', () => {
      const incompleteChecklist = {
        userVerified: true,
        causeValidated: true,
        prizeDelivered: false, // No entregado
        evidenceConfirmed: true,
        fraudCheckPassed: true,
      };

      expect(isChecklistComplete(incompleteChecklist)).toBe(false);
    });

    it('checklist completo permite liberación', () => {
      const completeChecklist = {
        userVerified: true,
        causeValidated: true,
        prizeDelivered: true,
        evidenceConfirmed: true,
        fraudCheckPassed: true,
      };

      expect(isChecklistComplete(completeChecklist)).toBe(true);
    });

    it('prizeDelivered null (no aplica) se considera cumplido', () => {
      const checklistNoPrize = {
        userVerified: true,
        causeValidated: true,
        prizeDelivered: null, // No aplica
        evidenceConfirmed: true,
        fraudCheckPassed: true,
      };

      expect(isChecklistComplete(checklistNoPrize)).toBe(true);
    });

    it('falta KYC (userVerified=false) bloquea liberación', () => {
      const noKyc = {
        userVerified: false,
        causeValidated: true,
        prizeDelivered: true,
        evidenceConfirmed: true,
        fraudCheckPassed: true,
      };

      expect(isChecklistComplete(noKyc)).toBe(false);
    });

    it('falta verificación antifraude bloquea liberación', () => {
      const noFraudCheck = {
        userVerified: true,
        causeValidated: true,
        prizeDelivered: true,
        evidenceConfirmed: true,
        fraudCheckPassed: false,
      };

      expect(isChecklistComplete(noFraudCheck)).toBe(false);
    });
  });

  // ==========================================================================
  // SECCIÓN 4: SOLICITUD DE LIBERACIÓN
  // ==========================================================================

  describe('Solicitud de Liberación', () => {
    it('solo se puede solicitar desde estado HELD', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        userId: 'user-123',
        status: FundLedgerStatus.APPROVED, // No es HELD
        amount: 100,
      });

      await expect(
        service.requestRelease('fund-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('transiciona a PENDING_VERIFICATION al solicitar', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        userId: 'user-123',
        status: FundLedgerStatus.HELD,
        amount: 100,
      });
      mockPrisma.fundLedger.update.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.PENDING_VERIFICATION,
      });
      mockPrisma.fundStatusHistory.create.mockResolvedValue({});
      mockPrisma.fundReleaseChecklist.findUnique.mockResolvedValue({
        userVerified: false,
        causeValidated: false,
        prizeDelivered: null,
        evidenceConfirmed: false,
        fraudCheckPassed: false,
      });

      const result = await service.requestRelease('fund-123', 'user-123');

      expect(result.success).toBe(true);
      expect(mockPrisma.fundLedger.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: FundLedgerStatus.PENDING_VERIFICATION,
          }),
        }),
      );
    });
  });

  // ==========================================================================
  // SECCIÓN 5: ADMIN - APROBACIÓN Y LIBERACIÓN
  // ==========================================================================

  describe('Admin: Aprobación y Liberación', () => {
    it('adminApprove rechaza si checklist incompleto', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.PENDING_VERIFICATION,
      });
      mockPrisma.fundReleaseChecklist.findUnique.mockResolvedValue({
        userVerified: false, // Incompleto
        causeValidated: true,
        prizeDelivered: true,
        evidenceConfirmed: true,
        fraudCheckPassed: true,
      });

      await expect(
        service.adminApprove('fund-123', 'admin-1'),
      ).rejects.toThrow('No se puede aprobar');
    });

    it('adminRelease rechaza si estado no es APPROVED', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.PENDING_VERIFICATION, // No es APPROVED
      });

      await expect(
        service.adminRelease('fund-123', 'admin-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ==========================================================================
  // SECCIÓN 6: BLOQUEO Y DESBLOQUEO
  // ==========================================================================

  describe('Bloqueo y Desbloqueo (DOC34 §11)', () => {
    it('no se puede bloquear fondos ya liberados', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.RELEASED,
      });

      await expect(
        service.adminBlock('fund-123', 'admin-1', 'Sospecha de fraude'),
      ).rejects.toThrow('No se pueden bloquear fondos ya liberados');
    });

    it('solo se puede desbloquear fondos bloqueados', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.APPROVED, // No está bloqueado
      });

      await expect(
        service.adminUnblock('fund-123', 'admin-1', 'Usuario verificado'),
      ).rejects.toThrow('Solo se pueden desbloquear fondos bloqueados');
    });
  });

  // ==========================================================================
  // SECCIÓN 7: AUDITORÍA OBLIGATORIA - DOC34 §10
  // ==========================================================================

  describe('Auditoría Obligatoria (DOC34 §10)', () => {
    it('cada cambio de estado registra historial', async () => {
      mockPrisma.fundLedger.findUnique.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.HELD,
      });
      mockPrisma.fundLedger.update.mockResolvedValue({
        id: 'fund-123',
        status: FundLedgerStatus.PENDING_VERIFICATION,
      });
      mockPrisma.fundStatusHistory.create.mockResolvedValue({});

      await service.transitionState(
        'fund-123',
        FundLedgerStatus.PENDING_VERIFICATION,
        'user-123',
        FundActorType.USER,
        'Solicitud de liberación',
      );

      expect(mockPrisma.fundStatusHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fundId: 'fund-123',
            fromStatus: FundLedgerStatus.HELD,
            toStatus: FundLedgerStatus.PENDING_VERIFICATION,
            actorType: FundActorType.USER,
          }),
        }),
      );
    });
  });
});
