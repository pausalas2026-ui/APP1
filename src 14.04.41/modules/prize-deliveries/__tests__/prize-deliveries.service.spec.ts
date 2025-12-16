// DOCUMENTO 32 - TESTS FLUJOS CRITICOS ANTIFRAUDE
// Tests para PrizeDeliveriesService
// REGLA DE ORO: SIN EVIDENCIA = SIN DINERO

import { Test, TestingModule } from '@nestjs/testing';
import { PrizeDeliveriesService } from '../prize-deliveries.service';
import { PrismaService } from '../../shared/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeliveryStatus } from '@prisma/client';

describe('PrizeDeliveriesService - Flujos Antifraude', () => {
  let service: PrizeDeliveriesService;
  let prismaService: PrismaService;

  // Mock de PrismaService
  const mockPrisma = {
    prizeDelivery: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrizeDeliveriesService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<PrizeDeliveriesService>(PrizeDeliveriesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('releaseMoney - REGLA DE ORO ANTIFRAUDE', () => {
    const mockDeliveryBase = {
      id: 'delivery-123',
      sorteoId: 'sorteo-123',
      premioId: 'premio-123',
      winnerId: 'winner-123',
      prizeOwnerId: 'owner-123',
      evidenceImages: ['img1.jpg', 'img2.jpg'],
      winnerContactInfo: { phone: '123456789' },
      deliveryStatus: DeliveryStatus.VERIFIED,
      moneyReleased: false,
      premio: {
        id: 'premio-123',
        isDonated: false,
        valorEstimado: 100,
      },
    };

    it('NO_EVIDENCE_SUBMITTED - Debe rechazar liberacion sin evidencia', async () => {
      // DOC32 seccion 5: Nunca se libera dinero sin evidencia
      const deliverySinEvidencia = {
        ...mockDeliveryBase,
        evidenceImages: [], // SIN EVIDENCIA
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliverySinEvidencia);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('NO_EVIDENCE_SUBMITTED');

      // Verificar que NO se llamo update
      expect(mockPrisma.prizeDelivery.update).not.toHaveBeenCalled();
    });

    it('NO_EVIDENCE_SUBMITTED - Debe rechazar con evidenceImages null', async () => {
      const deliveryNullEvidence = {
        ...mockDeliveryBase,
        evidenceImages: null, // NULL
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryNullEvidence);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('NO_EVIDENCE_SUBMITTED');

      expect(mockPrisma.prizeDelivery.update).not.toHaveBeenCalled();
    });

    it('DELIVERY_NOT_VERIFIED - Debe rechazar sin verificacion previa', async () => {
      // DOC32 seccion 5: Solo se libera si la entrega esta verificada
      const deliveryNoVerificada = {
        ...mockDeliveryBase,
        deliveryStatus: DeliveryStatus.UNDER_REVIEW, // No verificada
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryNoVerificada);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DELIVERY_NOT_VERIFIED');

      expect(mockPrisma.prizeDelivery.update).not.toHaveBeenCalled();
    });

    it('DELIVERY_NOT_VERIFIED - Debe rechazar estado PENDING', async () => {
      const deliveryPending = {
        ...mockDeliveryBase,
        deliveryStatus: DeliveryStatus.PENDING,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryPending);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DELIVERY_NOT_VERIFIED');
    });

    it('DELIVERY_NOT_VERIFIED - Debe rechazar estado EVIDENCE_SUBMITTED', async () => {
      const deliveryEvidenceSubmitted = {
        ...mockDeliveryBase,
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryEvidenceSubmitted);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DELIVERY_NOT_VERIFIED');
    });

    it('DELIVERY_NOT_VERIFIED - Debe rechazar estado DISPUTED', async () => {
      const deliveryDisputed = {
        ...mockDeliveryBase,
        deliveryStatus: DeliveryStatus.DISPUTED,
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryDisputed);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DELIVERY_NOT_VERIFIED');
    });

    it('MONEY_ALREADY_RELEASED - Debe rechazar doble liberacion', async () => {
      const deliveryYaLiberada = {
        ...mockDeliveryBase,
        moneyReleased: true, // Ya liberado
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryYaLiberada);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('MONEY_ALREADY_RELEASED');
    });

    it('DONATED_PRIZE_NO_MONEY - Debe rechazar premios donados', async () => {
      // DOC32 seccion 4: Escenario A - Premio donado = sin compensacion
      const deliveryPremioDonado = {
        ...mockDeliveryBase,
        premio: {
          ...mockDeliveryBase.premio,
          isDonated: true, // DONADO
        },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryPremioDonado);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow(BadRequestException);

      await expect(service.releaseMoney('delivery-123', 'admin-123'))
        .rejects
        .toThrow('DONATED_PRIZE_NO_MONEY');
    });

    it('FLUJO EXITOSO - Debe liberar dinero con todas las condiciones cumplidas', async () => {
      // DOC32 seccion 15.1: releasePrizeMoney flujo correcto
      const deliveryValida = {
        ...mockDeliveryBase,
        evidenceImages: ['img1.jpg', 'img2.jpg'],
        deliveryStatus: DeliveryStatus.VERIFIED,
        moneyReleased: false,
        premio: {
          id: 'premio-123',
          isDonated: false,
          valorEstimado: 150,
        },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryValida);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...deliveryValida,
        moneyReleased: true,
        moneyReleasedAt: new Date(),
        moneyAmount: 150,
        deliveryStatus: DeliveryStatus.COMPLETED,
      });

      const resultado = await service.releaseMoney('delivery-123', 'admin-123');

      // Verificar que se llamo update con los datos correctos
      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith({
        where: { id: 'delivery-123' },
        data: {
          moneyReleased: true,
          moneyReleasedAt: expect.any(Date),
          moneyAmount: 150,
          deliveryStatus: DeliveryStatus.COMPLETED,
        },
      });

      expect(resultado.moneyReleased).toBe(true);
      expect(resultado.deliveryStatus).toBe(DeliveryStatus.COMPLETED);
    });
  });

  describe('submitEvidence - Validaciones', () => {
    const mockDeliveryForEvidence = {
      id: 'delivery-456',
      prizeOwnerId: 'owner-456',
      deliveryStatus: DeliveryStatus.PENDING,
      premio: { id: 'premio-456' },
    };

    it('Debe rechazar si no es el dueno del premio', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDeliveryForEvidence);

      await expect(
        service.submitEvidence('otro-usuario', 'delivery-456', {
          images: ['img.jpg'],
          winnerPhone: '123456789',
          deliveryDate: new Date(),
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('Debe rechazar sin datos de contacto del ganador', async () => {
      // DOC32 seccion 16: Se requiere al menos un dato de contacto
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDeliveryForEvidence);

      await expect(
        service.submitEvidence('owner-456', 'delivery-456', {
          images: ['img.jpg'],
          // Sin winnerPhone ni winnerEmail
          deliveryDate: new Date(),
        })
      ).rejects.toThrow('Se requiere al menos un dato de contacto del ganador');
    });

    it('Debe rechazar sin imagenes de evidencia', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDeliveryForEvidence);

      await expect(
        service.submitEvidence('owner-456', 'delivery-456', {
          images: [], // Sin imagenes
          winnerPhone: '123456789',
          deliveryDate: new Date(),
        })
      ).rejects.toThrow('Debe incluir al menos 1 imagen de evidencia');
    });

    it('Debe rechazar si estado no es PENDING', async () => {
      // DOC32 seccion 14: pending -> evidence_submitted
      const deliveryNoValida = {
        ...mockDeliveryForEvidence,
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED, // Ya tiene evidencia
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryNoValida);

      await expect(
        service.submitEvidence('owner-456', 'delivery-456', {
          images: ['img.jpg'],
          winnerPhone: '123456789',
          deliveryDate: new Date(),
        })
      ).rejects.toThrow('Solo se puede subir evidencia cuando el estado es PENDING');
    });

    it('Debe aceptar evidencia con telefono como contacto', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDeliveryForEvidence);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...mockDeliveryForEvidence,
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
      });

      await service.submitEvidence('owner-456', 'delivery-456', {
        images: ['img1.jpg', 'img2.jpg'],
        winnerPhone: '123456789',
        deliveryDate: new Date(),
      });

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
          }),
        })
      );
    });

    it('Debe aceptar evidencia con email como contacto', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDeliveryForEvidence);
      mockPrisma.prizeDelivery.update.mockResolvedValue({
        ...mockDeliveryForEvidence,
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
      });

      await service.submitEvidence('owner-456', 'delivery-456', {
        images: ['img.jpg'],
        winnerEmail: 'winner@test.com',
        deliveryDate: new Date(),
      });

      expect(mockPrisma.prizeDelivery.update).toHaveBeenCalled();
    });
  });

  describe('Transiciones de Estado - Flujo Antifraude', () => {
    it('markUnderReview - Solo desde EVIDENCE_SUBMITTED', async () => {
      const deliveryWrongState = {
        id: 'delivery-789',
        deliveryStatus: DeliveryStatus.PENDING, // Estado incorrecto
        premio: { id: 'premio-789' },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryWrongState);

      await expect(service.markUnderReview('delivery-789', 'admin-123'))
        .rejects
        .toThrow('Solo se puede revisar entregas con evidencia');
    });

    it('verifyDelivery - Solo desde UNDER_REVIEW', async () => {
      const deliveryWrongState = {
        id: 'delivery-789',
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED, // No en revision
        premio: { id: 'premio-789' },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryWrongState);

      await expect(service.verifyDelivery('delivery-789', 'admin-123'))
        .rejects
        .toThrow('Solo se puede verificar entregas en revision');
    });

    it('markDisputed - Solo desde UNDER_REVIEW', async () => {
      const deliveryWrongState = {
        id: 'delivery-789',
        deliveryStatus: DeliveryStatus.VERIFIED, // Ya verificada
        premio: { id: 'premio-789' },
      };

      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(deliveryWrongState);

      await expect(service.markDisputed('delivery-789', 'admin-123', 'razon'))
        .rejects
        .toThrow('Solo se puede disputar entregas en revision');
    });
  });

  describe('findById', () => {
    it('Debe lanzar NotFoundException si no existe', async () => {
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(null);

      await expect(service.findById('inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe retornar la entrega si existe', async () => {
      const mockDelivery = { id: 'existe', premio: {} };
      mockPrisma.prizeDelivery.findUnique.mockResolvedValue(mockDelivery);

      const result = await service.findById('existe');
      expect(result.id).toBe('existe');
    });
  });
});
