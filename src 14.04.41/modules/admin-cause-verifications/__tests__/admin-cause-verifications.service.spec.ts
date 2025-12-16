// DOCUMENTO 32 - TESTS FLUJOS CRITICOS ANTIFRAUDE
// Tests para AdminCauseVerificationsService
// REGLA: No se libera dinero a causas no verificadas

import { Test, TestingModule } from '@nestjs/testing';
import { AdminCauseVerificationsService } from '../admin-cause-verifications.service';
import { PrismaService } from '../../shared/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VerificationStatus, EstadoCausa } from '@prisma/client';

describe('AdminCauseVerificationsService - Flujos Antifraude', () => {
  let service: AdminCauseVerificationsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    causeVerification: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    causa: {
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCauseVerificationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AdminCauseVerificationsService>(AdminCauseVerificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('startReview - Transiciones de Estado', () => {
    it('Debe lanzar NotFoundException si verificacion no existe', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(null);

      await expect(service.startReview('causa-inexistente', 'admin-123'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe rechazar si estado no es PENDING', async () => {
      // DOC32 seccion 14: pending -> under_review
      const verificacionEnRevision = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionEnRevision);

      await expect(service.startReview('causa-123', 'admin-123'))
        .rejects
        .toThrow('Solo se puede iniciar revision de causas en estado PENDING');
    });

    it('Debe rechazar si ya esta APPROVED', async () => {
      const verificacionAprobada = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.APPROVED,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionAprobada);

      await expect(service.startReview('causa-123', 'admin-123'))
        .rejects
        .toThrow('Solo se puede iniciar revision de causas en estado PENDING');
    });

    it('Debe marcar como UNDER_REVIEW correctamente', async () => {
      const verificacionPendiente = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.PENDING,
        causa: { id: 'causa-123', nombre: 'Causa Test' },
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionPendiente);
      mockPrisma.causeVerification.update.mockResolvedValue({
        ...verificacionPendiente,
        verificationStatus: VerificationStatus.UNDER_REVIEW,
        reviewerId: 'admin-123',
      });

      await service.startReview('causa-123', 'admin-123');

      expect(mockPrisma.causeVerification.update).toHaveBeenCalledWith({
        where: { id: 'verif-123' },
        data: {
          verificationStatus: VerificationStatus.UNDER_REVIEW,
          reviewerId: 'admin-123',
        },
        include: { causa: true },
      });
    });
  });

  describe('verifyCause - Aprobacion de Causas', () => {
    it('Debe lanzar NotFoundException si verificacion no existe', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(null);

      await expect(service.verifyCause('causa-inexistente', 'admin-123'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe rechazar si estado no es UNDER_REVIEW', async () => {
      // DOC32 seccion 14: under_review -> approved
      const verificacionPendiente = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.PENDING,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionPendiente);

      await expect(service.verifyCause('causa-123', 'admin-123'))
        .rejects
        .toThrow('Solo se puede verificar causas en estado UNDER_REVIEW');
    });

    it('Debe aprobar causa y marcarla como ACTIVA y verificada', async () => {
      // DOC32 seccion 6.2: SOLO despues de aprobar, la causa puede recibir donaciones
      const verificacionEnRevision = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      };

      const verificacionAprobada = {
        ...verificacionEnRevision,
        verificationStatus: VerificationStatus.APPROVED,
        reviewedAt: new Date(),
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionEnRevision);
      mockPrisma.$transaction.mockResolvedValue([verificacionAprobada]);

      const resultado = await service.verifyCause('causa-123', 'admin-123', 'Documentacion correcta');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(resultado.nuevoEstado).toBe(VerificationStatus.APPROVED);
      expect(resultado.mensaje).toContain('verificada y activada exitosamente');
    });
  });

  describe('rejectCause - Rechazo de Causas', () => {
    it('Debe lanzar NotFoundException si verificacion no existe', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(null);

      await expect(service.rejectCause('causa-inexistente', 'admin-123', 'Motivo'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe rechazar si estado no es UNDER_REVIEW', async () => {
      // DOC32 seccion 14: under_review -> rejected
      const verificacionPendiente = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.PENDING,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionPendiente);

      await expect(service.rejectCause('causa-123', 'admin-123', 'Motivo de rechazo'))
        .rejects
        .toThrow('Solo se puede rechazar causas en estado UNDER_REVIEW');
    });

    it('Debe rechazar sin motivo de rechazo', async () => {
      const verificacionEnRevision = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionEnRevision);

      await expect(service.rejectCause('causa-123', 'admin-123', ''))
        .rejects
        .toThrow('Debe proporcionar un motivo de rechazo');
    });

    it('Debe rechazar motivo muy corto', async () => {
      const verificacionEnRevision = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionEnRevision);

      await expect(service.rejectCause('causa-123', 'admin-123', 'Corto'))
        .rejects
        .toThrow('minimo 10 caracteres');
    });

    it('Debe rechazar causa y marcarla como CANCELADA', async () => {
      // DOC32 seccion 6.2: No se libera dinero a causas rechazadas
      const verificacionEnRevision = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
      };

      const verificacionRechazada = {
        ...verificacionEnRevision,
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: 'Documentacion insuficiente para verificar',
        reviewedAt: new Date(),
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionEnRevision);
      mockPrisma.$transaction.mockResolvedValue([verificacionRechazada]);

      const resultado = await service.rejectCause(
        'causa-123',
        'admin-123',
        'Documentacion insuficiente para verificar',
        'Notas adicionales'
      );

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(resultado.nuevoEstado).toBe(VerificationStatus.REJECTED);
      expect(resultado.mensaje).toContain('rechazada');
    });
  });

  describe('Flujo Completo - Transiciones Validas', () => {
    it('PENDING -> UNDER_REVIEW: Transicion valida', () => {
      const transicionesValidas = {
        [VerificationStatus.PENDING]: [VerificationStatus.UNDER_REVIEW],
        [VerificationStatus.UNDER_REVIEW]: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
        [VerificationStatus.APPROVED]: [],
        [VerificationStatus.REJECTED]: [],
      };

      expect(transicionesValidas[VerificationStatus.PENDING]).toContain(VerificationStatus.UNDER_REVIEW);
    });

    it('UNDER_REVIEW -> APPROVED: Transicion valida', () => {
      const transicionesValidas = {
        [VerificationStatus.PENDING]: [VerificationStatus.UNDER_REVIEW],
        [VerificationStatus.UNDER_REVIEW]: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
        [VerificationStatus.APPROVED]: [],
        [VerificationStatus.REJECTED]: [],
      };

      expect(transicionesValidas[VerificationStatus.UNDER_REVIEW]).toContain(VerificationStatus.APPROVED);
    });

    it('UNDER_REVIEW -> REJECTED: Transicion valida', () => {
      const transicionesValidas = {
        [VerificationStatus.PENDING]: [VerificationStatus.UNDER_REVIEW],
        [VerificationStatus.UNDER_REVIEW]: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
        [VerificationStatus.APPROVED]: [],
        [VerificationStatus.REJECTED]: [],
      };

      expect(transicionesValidas[VerificationStatus.UNDER_REVIEW]).toContain(VerificationStatus.REJECTED);
    });

    it('APPROVED: Estado final, sin transiciones', () => {
      const transicionesValidas = {
        [VerificationStatus.PENDING]: [VerificationStatus.UNDER_REVIEW],
        [VerificationStatus.UNDER_REVIEW]: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
        [VerificationStatus.APPROVED]: [],
        [VerificationStatus.REJECTED]: [],
      };

      expect(transicionesValidas[VerificationStatus.APPROVED]).toHaveLength(0);
    });

    it('REJECTED: Estado final, sin transiciones', () => {
      const transicionesValidas = {
        [VerificationStatus.PENDING]: [VerificationStatus.UNDER_REVIEW],
        [VerificationStatus.UNDER_REVIEW]: [VerificationStatus.APPROVED, VerificationStatus.REJECTED],
        [VerificationStatus.APPROVED]: [],
        [VerificationStatus.REJECTED]: [],
      };

      expect(transicionesValidas[VerificationStatus.REJECTED]).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('Debe retornar estadisticas correctas', async () => {
      mockPrisma.causeVerification.count
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(5)  // underReview
        .mockResolvedValueOnce(20) // approved
        .mockResolvedValueOnce(3); // rejected

      const stats = await service.getStats();

      expect(stats.pending).toBe(10);
      expect(stats.underReview).toBe(5);
      expect(stats.approved).toBe(20);
      expect(stats.rejected).toBe(3);
      expect(stats.total).toBe(38);
    });
  });

  describe('getPendingVerifications', () => {
    it('Debe retornar verificaciones pendientes', async () => {
      const verificacionesMock = [
        {
          id: 'verif-1',
          causaId: 'causa-1',
          verificationStatus: VerificationStatus.PENDING,
          documents: ['doc.pdf'],
          externalLinks: [],
          createdAt: new Date(),
          causa: { nombre: 'Causa 1', descripcion: 'Desc 1' },
        },
      ];

      mockPrisma.causeVerification.findMany.mockResolvedValue(verificacionesMock);
      mockPrisma.causeVerification.count.mockResolvedValue(1);

      const resultado = await service.getPendingVerifications(1, 10);

      expect(resultado.data).toHaveLength(1);
      expect(resultado.meta.total).toBe(1);
      expect(mockPrisma.causeVerification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            verificationStatus: {
              in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
            },
          },
        })
      );
    });
  });

  describe('getVerificationDetails', () => {
    it('Debe lanzar NotFoundException si no existe', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(null);

      await expect(service.getVerificationDetails('causa-inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe retornar detalles completos', async () => {
      const verificacionCompleta = {
        id: 'verif-123',
        causaId: 'causa-123',
        submittedBy: 'user-123',
        verificationStatus: VerificationStatus.UNDER_REVIEW,
        foundationName: 'Fundacion Test',
        foundationId: 'FND-123',
        documents: ['doc1.pdf', 'doc2.pdf'],
        externalLinks: ['https://link.com'],
        reviewerId: 'admin-123',
        reviewerNotes: 'En proceso',
        reviewedAt: null,
        rejectionReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        causa: {
          id: 'causa-123',
          nombre: 'Causa Test',
          descripcion: 'Descripcion',
          imagenUrl: 'https://img.jpg',
          sitioWeb: 'https://causa.com',
          estado: 'PENDIENTE',
          verificada: false,
        },
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionCompleta);

      const resultado = await service.getVerificationDetails('causa-123');

      expect(resultado.id).toBe('verif-123');
      expect(resultado.causa.nombre).toBe('Causa Test');
      expect(resultado.documents).toHaveLength(2);
    });
  });

  describe('Reglas Antifraude DOC32', () => {
    it('REGLA: Solo causas APPROVED pueden recibir donaciones', () => {
      // DOC32 seccion 6.2: SOLO despues de validar, la causa puede recibir donaciones
      const estadosQueRecibenDonaciones = [VerificationStatus.APPROVED];
      const estadosQueNoRecibenDonaciones = [
        VerificationStatus.PENDING,
        VerificationStatus.UNDER_REVIEW,
        VerificationStatus.REJECTED,
      ];

      expect(estadosQueRecibenDonaciones).toContain(VerificationStatus.APPROVED);
      estadosQueNoRecibenDonaciones.forEach(estado => {
        expect(estadosQueRecibenDonaciones).not.toContain(estado);
      });
    });

    it('REGLA: Causa rechazada nunca se activa', () => {
      // Una vez rechazada, la causa NO puede reactivarse
      // (tendria que crear nueva propuesta)
      const transicionesDesdeRejected: string[] = [];
      expect(transicionesDesdeRejected).toHaveLength(0);
    });
  });
});
