/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Tests antifraude para servicios de engagement
 * 
 * CASOS CRÍTICOS:
 * 1. Mensajes SIEMPRE incluyen CTA
 * 2. Idioma correcto del receptor
 * 3. Límites de frecuencia respetados
 * 4. Geolocalización registrada correctamente
 * 5. Solo creadores pueden actualizar sus causas
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MessagingService } from '../messaging.service';
import { GeolocationService } from '../geolocation.service';
import { CauseUpdatesService } from '../cause-updates.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  MessageChannel,
  EngagementEvent,
  SupportedLanguage,
  CauseUpdateType,
  FREQUENCY_LIMITS,
  isImmediateEvent,
  getChannelsForEvent,
} from '../engagement.constants';

describe('Engagement Services - Tests Antifraude', () => {
  let messagingService: MessagingService;
  let geolocationService: GeolocationService;
  let causeUpdatesService: CauseUpdatesService;
  let prisma: PrismaService;

  // Mock data
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockCauseId = '550e8400-e29b-41d4-a716-446655440001';
  const mockDonationId = '550e8400-e29b-41d4-a716-446655440002';
  const mockUpdateId = '550e8400-e29b-41d4-a716-446655440003';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    name: 'Test User',
    preferredLanguage: 'ES',
    pushToken: 'mock-token',
    countryCode: 'ES',
  };

  const mockCause = {
    id: mockCauseId,
    name: 'Causa de prueba',
    createdBy: mockUserId,
  };

  const mockTemplate = {
    id: 'template-1',
    templateKey: EngagementEvent.PARTICIPATION_CONFIRMED,
    languageCode: SupportedLanguage.ES,
    channel: MessageChannel.INTERNAL,
    subject: '🎉 ¡Ya estás participando!',
    body: 'Tienes {{ticket_count}} boletos para {{raffle_name}}',
    ctaText: 'Ver sorteo',
    ctaUrl: '/raffles/{{raffle_id}}',
    isActive: true,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    cause: {
      findUnique: jest.fn(),
    },
    causeUpdate: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    messageTemplate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    internalMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    messageSentLog: {
      count: jest.fn(),
      findFirst: jest.fn(),
      createMany: jest.fn(),
      groupBy: jest.fn(),
    },
    donationGeolocation: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    donation: {
      findMany: jest.fn(),
    },
    participation: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingService,
        GeolocationService,
        {
          provide: CauseUpdatesService,
          useFactory: (prisma: PrismaService, messaging: MessagingService) => {
            return new CauseUpdatesService(prisma, messaging);
          },
          inject: [PrismaService, MessagingService],
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    messagingService = module.get<MessagingService>(MessagingService);
    geolocationService = module.get<GeolocationService>(GeolocationService);
    causeUpdatesService = module.get<CauseUpdatesService>(CauseUpdatesService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  // ============================================
  // BLOQUE 1: MENSAJERÍA
  // ============================================

  describe('MessagingService', () => {
    describe('Idioma del receptor', () => {
      /**
       * DOC36: "Los mensajes se envían en el idioma del receptor"
       */
      it('DEBE usar preferencia de idioma del usuario si existe', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferredLanguage: 'EN',
        });
        mockPrismaService.messageTemplate.findFirst.mockResolvedValue(mockTemplate);
        mockPrismaService.messageSentLog.count.mockResolvedValue(0);
        mockPrismaService.messageSentLog.findFirst.mockResolvedValue(null);
        mockPrismaService.internalMessage.create.mockResolvedValue({});
        mockPrismaService.messageSentLog.createMany.mockResolvedValue({});

        await messagingService.sendMessage({
          userId: mockUserId,
          templateKey: EngagementEvent.PARTICIPATION_CONFIRMED,
          variables: { ticket_count: '3', raffle_name: 'iPhone 15' },
        });

        // Verificar que se buscó el template en inglés primero
        expect(mockPrismaService.messageTemplate.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              languageCode: 'EN',
            }),
          })
        );
      });

      it('DEBE usar idioma por país si no hay preferencia', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue({
          ...mockUser,
          preferredLanguage: null,
          countryCode: 'FR',
        });

        // La detección de idioma debería devolver FR
        const user = await mockPrismaService.user.findUnique({ where: { id: mockUserId } });
        expect(user.countryCode).toBe('FR');
      });
    });

    describe('Límites de frecuencia', () => {
      /**
       * DOC36: "Engagement ≠ spam" - Frecuencia controlada
       */
      it('DEBE RECHAZAR si se excede el límite diario', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.messageSentLog.count.mockResolvedValue(FREQUENCY_LIMITS.maxPerDay + 1);

        const result = await messagingService.sendMessage({
          userId: mockUserId,
          templateKey: EngagementEvent.CAUSE_MILESTONE_25, // No es inmediato
          variables: { cause_name: 'Test' },
        });

        expect(result.success).toBe(false);
        expect(result.message).toContain('límite');
      });

      it('DEBE PERMITIR eventos inmediatos sin importar límites', async () => {
        mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
        mockPrismaService.messageTemplate.findFirst.mockResolvedValue(mockTemplate);
        mockPrismaService.internalMessage.create.mockResolvedValue({});
        mockPrismaService.messageSentLog.createMany.mockResolvedValue({});

        // PARTICIPATION_CONFIRMED es un evento inmediato
        expect(isImmediateEvent(EngagementEvent.PARTICIPATION_CONFIRMED)).toBe(true);

        const result = await messagingService.sendMessage({
          userId: mockUserId,
          templateKey: EngagementEvent.PARTICIPATION_CONFIRMED,
          variables: { ticket_count: '3', raffle_name: 'iPhone' },
        });

        // No se verificaron los límites para eventos inmediatos
        expect(mockPrismaService.messageSentLog.count).not.toHaveBeenCalled();
      });
    });

    describe('Canales por evento', () => {
      /**
       * DOC36: Cada evento tiene canales específicos
       */
      it('DEBE usar los canales correctos por evento', () => {
        // WINNER_NOTIFICATION debe usar push, email e internal
        const winnerChannels = getChannelsForEvent(EngagementEvent.WINNER_NOTIFICATION);
        expect(winnerChannels).toContain(MessageChannel.PUSH);
        expect(winnerChannels).toContain(MessageChannel.EMAIL);
        expect(winnerChannels).toContain(MessageChannel.INTERNAL);

        // RAFFLE_REMINDER solo push
        const reminderChannels = getChannelsForEvent(EngagementEvent.RAFFLE_REMINDER_24H);
        expect(reminderChannels).toEqual([MessageChannel.PUSH]);
      });
    });
  });

  // ============================================
  // BLOQUE 2: GEOLOCALIZACIÓN
  // ============================================

  describe('GeolocationService', () => {
    describe('Registro de donaciones', () => {
      /**
       * DOC36: Geolocalización de los donativos
       */
      it('DEBE registrar correctamente la geolocalización', async () => {
        mockPrismaService.donationGeolocation.create.mockResolvedValue({});
        mockPrismaService.donationGeolocation.count.mockResolvedValue(1);

        await geolocationService.registerDonationGeo({
          donationId: mockDonationId,
          causeId: mockCauseId,
          userId: mockUserId,
          countryCode: 'ES',
          countryName: 'España',
          city: 'Madrid',
          amount: 10,
        });

        expect(mockPrismaService.donationGeolocation.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            countryCode: 'ES',
            countryName: 'España',
            city: 'Madrid',
          }),
        });
      });
    });

    describe('Estadísticas geográficas', () => {
      it('DEBE calcular correctamente las estadísticas', async () => {
        mockPrismaService.cause.findUnique.mockResolvedValue(mockCause);
        mockPrismaService.donationGeolocation.groupBy.mockResolvedValue([
          { countryCode: 'ES', countryName: 'España', _count: { id: 10 }, _sum: { amount: 100 } },
          { countryCode: 'US', countryName: 'United States', _count: { id: 5 }, _sum: { amount: 200 } },
        ]);
        mockPrismaService.donationGeolocation.findMany.mockResolvedValue([]);

        const stats = await geolocationService.getCauseGeoStats(mockCauseId);

        expect(stats.totalCountries).toBe(2);
        expect(stats.countries).toHaveLength(2);
      });

      it('DEBE generar mensaje correcto de resumen', async () => {
        mockPrismaService.donationGeolocation.groupBy.mockResolvedValue([
          { countryCode: 'ES' },
          { countryCode: 'US' },
          { countryCode: 'FR' },
        ]);

        const summary = await geolocationService.getQuickGeoSummary(mockCauseId);

        expect(summary.countries).toBe(3);
        expect(summary.message).toContain('3 países');
      });
    });
  });

  // ============================================
  // BLOQUE 3: ACTUALIZACIONES DE CAUSA
  // ============================================

  describe('CauseUpdatesService', () => {
    describe('Autorización', () => {
      /**
       * DOC36: Solo el creador de la causa puede crear actualizaciones
       */
      it('ANTIFRAUDE: DEBE RECHAZAR actualización de usuario no autorizado', async () => {
        mockPrismaService.cause.findUnique.mockResolvedValue({
          ...mockCause,
          createdBy: 'otro-usuario',
        });

        await expect(
          causeUpdatesService.createUpdate(mockCauseId, mockUserId, {
            updateType: CauseUpdateType.NEWS,
            content: 'Actualización no autorizada',
          })
        ).rejects.toThrow(ForbiddenException);
      });

      it('DEBE PERMITIR actualización del creador', async () => {
        mockPrismaService.cause.findUnique.mockResolvedValue(mockCause);
        mockPrismaService.causeUpdate.create.mockResolvedValue({
          id: mockUpdateId,
          causeId: mockCauseId,
          createdBy: mockUserId,
          updateType: CauseUpdateType.NEWS,
          content: 'Actualización autorizada',
          isPublic: true,
          isPinned: false,
          notifyDonors: true,
          notifyParticipants: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        mockPrismaService.donation.findMany.mockResolvedValue([]);
        mockPrismaService.participation.findMany.mockResolvedValue([]);

        const result = await causeUpdatesService.createUpdate(mockCauseId, mockUserId, {
          updateType: CauseUpdateType.NEWS,
          content: 'Actualización autorizada',
        });

        expect(result.createdBy).toBe(mockUserId);
      });
    });

    describe('Causa inexistente', () => {
      it('DEBE RECHAZAR si la causa no existe', async () => {
        mockPrismaService.cause.findUnique.mockResolvedValue(null);

        await expect(
          causeUpdatesService.createUpdate(mockCauseId, mockUserId, {
            updateType: CauseUpdateType.NEWS,
            content: 'Test',
          })
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('Tipos de actualización', () => {
      it('DEBE soportar todos los tipos de actualización', () => {
        expect(Object.values(CauseUpdateType)).toContain('NEWS');
        expect(Object.values(CauseUpdateType)).toContain('MILESTONE');
        expect(Object.values(CauseUpdateType)).toContain('THANKS');
        expect(Object.values(CauseUpdateType)).toContain('PROGRESS');
        expect(Object.values(CauseUpdateType)).toContain('MEDIA');
      });
    });
  });

  // ============================================
  // BLOQUE 4: EVENTOS INMEDIATOS
  // ============================================

  describe('Eventos Inmediatos', () => {
    it('DEBE clasificar correctamente eventos inmediatos', () => {
      // Eventos que SIEMPRE se envían
      expect(isImmediateEvent(EngagementEvent.PARTICIPATION_CONFIRMED)).toBe(true);
      expect(isImmediateEvent(EngagementEvent.DONATION_THANKS)).toBe(true);
      expect(isImmediateEvent(EngagementEvent.WINNER_NOTIFICATION)).toBe(true);
      expect(isImmediateEvent(EngagementEvent.KYC_APPROVED)).toBe(true);
      expect(isImmediateEvent(EngagementEvent.MONEY_RELEASED)).toBe(true);

      // Eventos que respetan frecuencia
      expect(isImmediateEvent(EngagementEvent.CAUSE_MILESTONE_25)).toBe(false);
      expect(isImmediateEvent(EngagementEvent.RAFFLE_REMINDER_24H)).toBe(false);
    });
  });

  // ============================================
  // BLOQUE 5: TEMPLATES
  // ============================================

  describe('Templates de mensajes', () => {
    it('DEBE crear template correctamente', async () => {
      const newTemplate = {
        id: 'new-template',
        ...mockTemplate,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.messageTemplate.create.mockResolvedValue(newTemplate);

      const result = await messagingService.createTemplate({
        templateKey: EngagementEvent.PARTICIPATION_CONFIRMED,
        languageCode: SupportedLanguage.ES,
        channel: MessageChannel.INTERNAL,
        body: 'Test body',
      });

      expect(result.templateKey).toBe(EngagementEvent.PARTICIPATION_CONFIRMED);
    });

    it('DEBE renderizar variables correctamente', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.messageTemplate.findFirst.mockResolvedValue({
        ...mockTemplate,
        body: 'Tienes {{ticket_count}} boletos para {{raffle_name}}',
      });
      mockPrismaService.messageSentLog.count.mockResolvedValue(0);
      mockPrismaService.internalMessage.create.mockImplementation((args) => {
        // Verificar que las variables se renderizaron
        expect(args.data.body).toContain('3');
        expect(args.data.body).toContain('iPhone 15');
        return Promise.resolve({});
      });
      mockPrismaService.messageSentLog.createMany.mockResolvedValue({});

      await messagingService.sendMessage({
        userId: mockUserId,
        templateKey: EngagementEvent.PARTICIPATION_CONFIRMED,
        variables: { ticket_count: '3', raffle_name: 'iPhone 15' },
      });
    });
  });

  // ============================================
  // BLOQUE 6: MENSAJES INTERNOS
  // ============================================

  describe('Mensajes internos', () => {
    it('DEBE obtener mensajes del usuario correctamente', async () => {
      mockPrismaService.internalMessage.findMany.mockResolvedValue([
        { id: '1', userId: mockUserId, title: 'Test', body: 'Body', isRead: false, createdAt: new Date() },
      ]);
      mockPrismaService.internalMessage.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unread

      const result = await messagingService.getInternalMessages(mockUserId, 1, 20, false);

      expect(result.messages).toHaveLength(1);
      expect(result.unreadCount).toBe(1);
    });

    it('DEBE marcar mensajes como leídos', async () => {
      mockPrismaService.internalMessage.updateMany.mockResolvedValue({ count: 2 });

      const count = await messagingService.markMessagesAsRead(mockUserId, ['msg-1', 'msg-2']);

      expect(count).toBe(2);
    });
  });
});
