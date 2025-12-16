// DOCUMENTO 32 - TESTS FLUJOS CRITICOS ANTIFRAUDE
// Tests para AdminPrizeDeliveriesService
// REGLA DE ORO: SIN EVIDENCIA = SIN DINERO

import { Test, TestingModule } from '@nestjs/testing';
import { AdminPrizeDeliveriesService } from '../admin-prize-deliveries.service';
import { PrismaService } from '../../shared/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';

describe('AdminPrizeDeliveriesService - Flujos Antifraude', () => {
  let service: AdminPrizeDeliveriesService;
  let prismaService: PrismaService;

  const mockPrisma = {
    prizeDelivery: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPrizeDeliveriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AdminPrizeDeliveriesService>(AdminPrizeDeliveriesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('startReview - Transiciones de Estado', () => {
    it('Debe rechazar si estado no es EVIDENCE_SUBMITTED', async () => {
      // DOC32 seccion 14: evidence_submitted -> under_review
      const entregaPending = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.PENDING,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaPending);

      await expect(service.startReview('delivery-123', 'admin-123'))
        .rejects
        .toThrow('Solo se puede iniciar revision de entregas con estado EVIDENCE_SUBMITTED');
    });

    it('Debe lanzar NotFoundException si entrega no existe', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(null);

      await expect(service.startReview('inexistente', 'admin-123'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe marcar como UNDER_REVIEW correctamente', async () => {
      const entregaValida = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
        premio: { id: 'premio-123' },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaValida);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...entregaValida,
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        verifiedBy: 'admin-123',
      });

      const resultado = await service.startReview('delivery-123', 'admin-123');

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          deliveryStatus: DeliveryStatus.UNDER_REVIEW,
          verifiedBy: 'admin-123',
        },
        include: { premio: true },
      });
    });
  });

  describe('verifyDelivery - Validaciones Antifraude', () => {
    it('Debe rechazar si estado no es UNDER_REVIEW', async () => {
      // DOC32 seccion 14: under_review -> verified
      const entregaSinRevisar = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaSinRevisar);

      await expect(service.verifyDelivery('delivery-123', 'admin-123'))
        .rejects
        .toThrow('Solo se puede verificar entregas en estado UNDER_REVIEW');
    });

    it('NO_EVIDENCE_SUBMITTED - Debe rechazar sin evidencia', async () => {
      // DOC32 seccion 5: Nunca se verifica sin evidencia
      const entregaSinEvidencia = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        evidenceImages: [], // Sin evidencia
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaSinEvidencia);

      await expect(service.verifyDelivery('delivery-123', 'admin-123'))
        .rejects
        .toThrow('NO_EVIDENCE_SUBMITTED');
    });

    it('Debe verificar correctamente con evidencia y estado valido', async () => {
      const entregaValida = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        evidenceImages: ['img1.jpg', 'img2.jpg'],
        premio: { id: 'premio-123', isDonated: false },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaValida);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...entregaValida,
        deliveryStatus: DeliveryStatus.VERIFIED,
        verifiedAt: new Date(),
      });

      const resultado = await service.verifyDelivery('delivery-123', 'admin-123', 'Todo correcto');

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          deliveryStatus: DeliveryStatus.VERIFIED,
          verifiedBy: 'admin-123',
          verifiedAt: expect.any(Date),
          verificationNotes: 'Todo correcto',
        },
        include: { premio: true },
      });

      expect(resultado.mensaje).toContain('verificada exitosamente');
    });
  });

  describe('markDisputed - Validaciones', () => {
    it('Debe rechazar si estado no es UNDER_REVIEW', async () => {
      // DOC32 seccion 14: under_review -> disputed
      const entregaVerificada = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.VERIFIED,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaVerificada);

      await expect(service.markDisputed('delivery-123', 'admin-123', 'Razon de disputa'))
        .rejects
        .toThrow('Solo se puede disputar entregas en estado UNDER_REVIEW');
    });

    it('Debe rechazar sin motivo de disputa', async () => {
      const entregaEnRevision = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaEnRevision);

      await expect(service.markDisputed('delivery-123', 'admin-123', ''))
        .rejects
        .toThrow('Debe proporcionar un motivo de disputa');
    });

    it('Debe rechazar motivo de disputa muy corto', async () => {
      const entregaEnRevision = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaEnRevision);

      await expect(service.markDisputed('delivery-123', 'admin-123', 'Corto'))
        .rejects
        .toThrow('minimo 10 caracteres');
    });

    it('Debe marcar como disputada correctamente', async () => {
      const entregaEnRevision = {
        id: 'delivery-123',
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        premio: { id: 'premio-123' },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaEnRevision);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...entregaEnRevision,
        deliveryStatus: DeliveryStatus.DISPUTED,
      });

      await service.markDisputed('delivery-123', 'admin-123', 'El premio no coincide con las fotos proporcionadas');

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          deliveryStatus: DeliveryStatus.DISPUTED,
          verifiedBy: 'admin-123',
          verificationNotes: 'El premio no coincide con las fotos proporcionadas',
        },
        include: { premio: true },
      });
    });
  });

  describe('markMoneyReleased - REGLA DE ORO ANTIFRAUDE', () => {
    const mockEntregaBase = {
      id: 'delivery-123',
      evidenceImages: ['img1.jpg', 'img2.jpg'],
      deliveryStatus: DeliveryStatus.VERIFIED,
      moneyReleased: false,
      premio: {
        id: 'premio-123',
        isDonated: false,
        valorEstimado: 200,
      },
    };

    it('NO_EVIDENCE_SUBMITTED - Rechazar sin evidencia', async () => {
      // DOC32 seccion 15.1: Verificaciones obligatorias
      const entregaSinEvidencia = {
        ...mockEntregaBase,
        evidenceImages: [],
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaSinEvidencia);

      await expect(service.markMoneyReleased('delivery-123', 'admin-123'))
        .rejects
        .toThrow('NO_EVIDENCE_SUBMITTED');
    });

    it('DELIVERY_NOT_VERIFIED - Rechazar sin verificacion', async () => {
      const entregaNoVerificada = {
        ...mockEntregaBase,
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaNoVerificada);

      await expect(service.markMoneyReleased('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DELIVERY_NOT_VERIFIED');
    });

    it('MONEY_ALREADY_RELEASED - Rechazar doble liberacion', async () => {
      const entregaYaLiberada = {
        ...mockEntregaBase,
        moneyReleased: true,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaYaLiberada);

      await expect(service.markMoneyReleased('delivery-123', 'admin-123'))
        .rejects
        .toThrow('MONEY_ALREADY_RELEASED');
    });

    it('DONATED_PRIZE_NO_MONEY - Rechazar premios donados', async () => {
      // DOC32 seccion 4: Escenario A - Premio donado
      const entregaPremioDonado = {
        ...mockEntregaBase,
        premio: {
          ...mockEntregaBase.premio,
          isDonated: true,
        },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaPremioDonado);

      await expect(service.markMoneyReleased('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DONATED_PRIZE_NO_MONEY');
    });

    it('Debe marcar dinero como liberado correctamente', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockEntregaBase);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...mockEntregaBase,
        moneyReleased: true,
        moneyReleasedAt: new Date(),
        moneyAmount: 200,
        deliveryStatus: DeliveryStatus.COMPLETED,
      });

      const resultado = await service.markMoneyReleased('delivery-123', 'admin-123');

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          moneyReleased: true,
          moneyReleasedAt: expect.any(Date),
          moneyAmount: 200,
          deliveryStatus: DeliveryStatus.COMPLETED,
        },
      });

      expect(resultado.moneyReleased).toBe(true);
      expect(resultado.deliveryStatus).toBe(DeliveryStatus.COMPLETED);
      expect(resultado.mensaje).toContain('liberado');
    });
  });

  describe('getStats', () => {
    it('Debe retornar estadisticas correctas', async () => {
      mockPrisma.prizeDelivery.count
        .mockResolvedValueOnce(5)  // pending
        .mockResolvedValueOnce(3)  // evidenceSubmitted
        .mockResolvedValueOnce(2)  // underReview
        .mockResolvedValueOnce(10) // verified
        .mockResolvedValueOnce(1)  // disputed
        .mockResolvedValueOnce(15); // completed

      const stats = await service.getStats();

      expect(stats.pending).toBe(5);
      expect(stats.evidenceSubmitted).toBe(3);
      expect(stats.underReview).toBe(2);
      expect(stats.verified).toBe(10);
      expect(stats.disputed).toBe(1);
      expect(stats.completed).toBe(15);
      expect(stats.total).toBe(36);
      expect(stats.pendingReview).toBe(5); // evidenceSubmitted + underReview
    });
  });

  describe('getPendingReview', () => {
    it('Debe retornar entregas pendientes de revision', async () => {
      const entregasMock = [
        {
          id: 'delivery-1',
          sorteoId: 'sorteo-1',
          premioId: 'premio-1',
          deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
          evidenceImages: ['img.jpg'],
          winnerContactInfo: { phone: '123' },
          createdAt: new Date(),
          premio: { id: 'premio-1', nombre: 'Premio Test' },
        },
      ];

      mockPrisma.prizeDelivery.findMany.mockResolvedValue(entregasMock);
      mockPrisma.prizeDelivery.count.mockResolvedValue(1);

      const resultado = await service.getPendingReview(1, 10);

      expect(resultado.data).toHaveLength(1);
      expect(resultado.meta.total).toBe(1);
      expect(mockPrisma.prizeDelivery.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deliveryStatus: {
              in: [DeliveryStatus.EVIDENCE_SUBMITTED, DeliveryStatus.UNDER_REVIEW],
            },
          },
        })
      );
    });
  });

  describe('getDeliveryDetails', () => {
    it('Debe lanzar NotFoundException si entrega no existe', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(null);

      await expect(service.getDeliveryDetails('inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe retornar detalles completos', async () => {
      const entregaCompleta = {
        id: 'delivery-123',
        sorteoId: 'sorteo-123',
        winnerId: 'winner-123',
        prizeOwnerId: 'owner-123',
        deliveryStatus: DeliveryStatus.VERIFIED,
        evidenceImages: ['img1.jpg'],
        winnerContactInfo: { phone: '123' },
        verificationNotes: 'Notas',
        verifiedBy: 'admin-123',
        verifiedAt: new Date(),
        moneyReleased: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        premio: {
          id: 'premio-123',
          nombre: 'Premio Test',
          descripcion: 'Descripcion',
          valorEstimado: 100,
          isDonated: false,
        },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(entregaCompleta);

      const resultado = await service.getDeliveryDetails('delivery-123');

      expect(resultado.id).toBe('delivery-123');
      expect(resultado.premio).toBeDefined();
      expect(resultado.premio.nombre).toBe('Premio Test');
    });
  });
});
