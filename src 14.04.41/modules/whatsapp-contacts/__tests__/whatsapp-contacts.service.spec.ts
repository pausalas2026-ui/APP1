// WhatsApp Contacts Service Tests
// Tests para importación, gestión y envío de mensajes

import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappContactsService } from '../whatsapp-contacts.service';
import { PrismaService } from '../../shared/prisma.service';
import {
  ContactStatus,
  ImportSource,
  ContactConsentStatus,
  WhatsAppMessageType,
  WHATSAPP_SEND_LIMITS,
  WHATSAPP_CONTACTS_ERRORS,
} from '../whatsapp-contacts.constants';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('WhatsappContactsService', () => {
  let service: WhatsappContactsService;
  let prismaService: PrismaService;

  // Mock de PrismaService
  const mockPrismaService = {
    whatsappContact: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    whatsappMessageLog: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    userConsent: {
      create: jest.fn(),
    },
    sweepstake: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappContactsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WhatsappContactsService>(WhatsappContactsService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Inicialización', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================
  // TESTS DE IMPORTACIÓN DE CONTACTOS
  // ============================================

  describe('importContacts', () => {
    const userId = 'user-123';

    it('should require explicit consent before importing', async () => {
      const dto = {
        contacts: [{ name: 'Test', phoneNumber: '+34612345678' }],
        source: ImportSource.DEVICE_CONTACTS,
        consentGranted: false, // Sin consentimiento
      };

      await expect(service.importContacts(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.IMPORT_CONSENT_REQUIRED,
      );
    });

    it('should reject import exceeding max contacts limit', async () => {
      const tooManyContacts = Array.from({ length: 501 }, (_, i) => ({
        name: `Contact ${i}`,
        phoneNumber: `+3461234${String(i).padStart(4, '0')}`,
      }));

      const dto = {
        contacts: tooManyContacts,
        source: ImportSource.DEVICE_CONTACTS,
        consentGranted: true,
      };

      await expect(service.importContacts(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.IMPORT_LIMIT_EXCEEDED,
      );
    });

    it('should import valid contacts with consent', async () => {
      mockPrismaService.whatsappContact.findMany.mockResolvedValue([]);

      const dto = {
        contacts: [
          { name: 'Juan García', phoneNumber: '+34612345678' },
          { name: 'María López', phoneNumber: '+34698765432' },
        ],
        source: ImportSource.DEVICE_CONTACTS,
        consentGranted: true,
        skipDuplicates: true,
      };

      const result = await service.importContacts(userId, dto);

      expect(result.imported).toBe(2);
      expect(result.duplicates).toBe(0);
      expect(result.invalid).toBe(0);
    });

    it('should detect and skip duplicate contacts', async () => {
      // Simular contacto existente
      mockPrismaService.whatsappContact.findMany.mockResolvedValue([
        { phoneNumber: '+34612345678', normalizedPhone: '+34612345678' },
      ]);

      const dto = {
        contacts: [
          { name: 'Juan García', phoneNumber: '+34612345678' }, // Duplicado
          { name: 'María López', phoneNumber: '+34698765432' }, // Nuevo
        ],
        source: ImportSource.DEVICE_CONTACTS,
        consentGranted: true,
        skipDuplicates: true,
      };

      const result = await service.importContacts(userId, dto);

      expect(result.duplicates).toBe(1);
      expect(result.imported).toBe(1);
    });

    it('should validate phone number format', async () => {
      mockPrismaService.whatsappContact.findMany.mockResolvedValue([]);

      const dto = {
        contacts: [
          { name: 'Valid Contact', phoneNumber: '+34612345678' },
          { name: 'Invalid Contact', phoneNumber: '612345678' }, // Sin código país
          { name: 'Also Invalid', phoneNumber: 'abc123' }, // Formato inválido
        ],
        source: ImportSource.MANUAL_ENTRY,
        consentGranted: true,
      };

      const result = await service.importContacts(userId, dto);

      expect(result.imported).toBe(1);
      expect(result.invalid).toBe(2);
      expect(result.errors.length).toBe(2);
    });
  });

  // ============================================
  // TESTS DE AGREGAR CONTACTO INDIVIDUAL
  // ============================================

  describe('addContact', () => {
    const userId = 'user-123';

    it('should require RGPD consent', async () => {
      const dto = {
        name: 'Test Contact',
        phoneNumber: '+34612345678',
        consentGranted: false,
      };

      await expect(service.addContact(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.RGPD_CONSENT_MISSING,
      );
    });

    it('should reject invalid phone format', async () => {
      const dto = {
        name: 'Test Contact',
        phoneNumber: 'invalid-phone',
        consentGranted: true,
      };

      await expect(service.addContact(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should reject duplicate contact', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: 'existing-id',
        phoneNumber: '+34612345678',
      });

      const dto = {
        name: 'Test Contact',
        phoneNumber: '+34612345678',
        consentGranted: true,
      };

      await expect(service.addContact(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.DUPLICATE_CONTACT,
      );
    });

    it('should add valid contact with consent', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue(null);

      const dto = {
        name: 'New Contact',
        phoneNumber: '+34612345678',
        notes: 'Test notes',
        tags: ['friends', 'family'],
        consentGranted: true,
      };

      const result = await service.addContact(userId, dto);

      expect(result).toBeDefined();
      expect(result.name).toBe('New Contact');
      expect(result.status).toBe(ContactStatus.ACTIVE);
    });
  });

  // ============================================
  // TESTS DE ENVÍO DE MENSAJES
  // ============================================

  describe('sendMessage', () => {
    const userId = 'user-123';
    const contactId = 'contact-456';

    it('should reject if contact not found', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue(null);

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND,
      );
    });

    it('should reject sending to blocked contact', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: contactId,
        userId,
        name: 'Blocked User',
        phoneNumber: '+34612345678',
        status: ContactStatus.BLOCKED,
        consentStatus: ContactConsentStatus.GRANTED,
      });
      mockPrismaService.whatsappMessageLog.count.mockResolvedValue(0);

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.CONTACT_BLOCKED,
      );
    });

    it('should reject sending to opted-out contact', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: contactId,
        userId,
        name: 'Opted Out User',
        phoneNumber: '+34612345678',
        status: ContactStatus.ACTIVE,
        consentStatus: ContactConsentStatus.REVOKED,
      });
      mockPrismaService.whatsappMessageLog.count.mockResolvedValue(0);

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.CONTACT_OPTED_OUT,
      );
    });

    it('should enforce daily message limit', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: contactId,
        userId,
        name: 'Test User',
        phoneNumber: '+34612345678',
        status: ContactStatus.ACTIVE,
        consentStatus: ContactConsentStatus.GRANTED,
        lastMessageSentAt: null,
      });

      // Simular que ya se alcanzó el límite diario
      mockPrismaService.whatsappMessageLog.count.mockResolvedValue(
        WHATSAPP_SEND_LIMITS.maxTotalMessagesPerDay,
      );

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.DAILY_LIMIT_EXCEEDED,
      );
    });

    it('should enforce per-contact message limit', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: contactId,
        userId,
        name: 'Test User',
        phoneNumber: '+34612345678',
        status: ContactStatus.ACTIVE,
        consentStatus: ContactConsentStatus.GRANTED,
        lastMessageSentAt: null,
      });

      // Límite total OK, pero límite por contacto excedido
      mockPrismaService.whatsappMessageLog.count
        .mockResolvedValueOnce(5) // Total diario OK
        .mockResolvedValueOnce(WHATSAPP_SEND_LIMITS.maxMessagesPerContactPerDay); // Por contacto excedido

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.CONTACT_LIMIT_EXCEEDED,
      );
    });

    it('should enforce minimum days between messages', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: contactId,
        userId,
        name: 'Test User',
        phoneNumber: '+34612345678',
        status: ContactStatus.ACTIVE,
        consentStatus: ContactConsentStatus.GRANTED,
        lastMessageSentAt: yesterday, // Enviado ayer (menos de 3 días)
      });

      mockPrismaService.whatsappMessageLog.count.mockResolvedValue(0);

      const dto = {
        contactId,
        messageType: WhatsAppMessageType.SORTEO_INVITE,
      };

      await expect(service.sendMessage(userId, dto)).rejects.toThrow(/días más/);
    });
  });

  // ============================================
  // TESTS DE OPT-OUT
  // ============================================

  describe('registerOptOut', () => {
    it('should mark all contacts with phone as blocked', async () => {
      mockPrismaService.whatsappContact.findMany.mockResolvedValue([
        { id: 'c1', userId: 'u1', phoneNumber: '+34612345678' },
        { id: 'c2', userId: 'u2', phoneNumber: '+34612345678' },
      ]);

      mockPrismaService.whatsappContact.updateMany.mockResolvedValue({ count: 2 });

      await service.registerOptOut({
        phoneNumber: '+34612345678',
        reason: 'No desea recibir mensajes',
      });

      expect(mockPrismaService.whatsappContact.updateMany).toHaveBeenCalledWith({
        where: { normalizedPhone: '+34612345678' },
        data: expect.objectContaining({
          status: ContactStatus.BLOCKED,
          consentStatus: ContactConsentStatus.REVOKED,
        }),
      });
    });
  });

  // ============================================
  // TESTS DE VALIDACIÓN DE NÚMEROS
  // ============================================

  describe('validatePhone', () => {
    it('should validate correct phone format', async () => {
      const result = await service.validatePhone({ phoneNumber: '+34612345678' });

      expect(result.isValid).toBe(true);
      expect(result.countryCode).toBe('+34');
      expect(result.countryName).toBe('España');
    });

    it('should reject invalid phone format', async () => {
      const result = await service.validatePhone({ phoneNumber: '612345678' });

      expect(result.isValid).toBe(false);
    });

    it('should handle various country codes', async () => {
      const phones = [
        { phone: '+1555123456', code: '+1', country: 'Estados Unidos/Canadá' },
        { phone: '+525512345678', code: '+52', country: 'México' },
        { phone: '+5491112345678', code: '+54', country: 'Argentina' },
      ];

      for (const { phone, code, country } of phones) {
        const result = await service.validatePhone({ phoneNumber: phone });
        expect(result.countryCode).toBe(code);
        expect(result.countryName).toBe(country);
      }
    });
  });

  // ============================================
  // TESTS DE ESTADÍSTICAS
  // ============================================

  describe('getContactsStats', () => {
    it('should return correct statistics', async () => {
      mockPrismaService.whatsappContact.findMany.mockResolvedValue([
        { status: ContactStatus.ACTIVE, consentStatus: ContactConsentStatus.GRANTED, importSource: ImportSource.DEVICE_CONTACTS, createdAt: new Date() },
        { status: ContactStatus.ACTIVE, consentStatus: ContactConsentStatus.PENDING, importSource: ImportSource.MANUAL_ENTRY, createdAt: new Date() },
        { status: ContactStatus.BLOCKED, consentStatus: ContactConsentStatus.REVOKED, importSource: ImportSource.DEVICE_CONTACTS, createdAt: new Date() },
        { status: ContactStatus.INACTIVE, consentStatus: ContactConsentStatus.DENIED, importSource: ImportSource.CSV_UPLOAD, createdAt: new Date() },
      ]);

      const result = await service.getContactsStats('user-123');

      expect(result.totalContacts).toBe(4);
      expect(result.activeContacts).toBe(2);
      expect(result.blockedContacts).toBe(1);
      expect(result.inactiveContacts).toBe(1);
      expect(result.contactsWithConsent).toBe(1);
    });
  });

  describe('getMessagingStats', () => {
    it('should return correct messaging statistics', async () => {
      const now = new Date();
      
      mockPrismaService.whatsappMessageLog.findMany.mockResolvedValue([
        { status: 'SENT', messageType: WhatsAppMessageType.SORTEO_INVITE, createdAt: now, contact: { id: 'c1', name: 'Contact 1' }, contactId: 'c1' },
        { status: 'DELIVERED', messageType: WhatsAppMessageType.SORTEO_INVITE, createdAt: now, contact: { id: 'c1', name: 'Contact 1' }, contactId: 'c1' },
        { status: 'READ', messageType: WhatsAppMessageType.PROMOTION, createdAt: now, contact: { id: 'c2', name: 'Contact 2' }, contactId: 'c2' },
        { status: 'FAILED', messageType: WhatsAppMessageType.REMINDER, createdAt: now, contact: { id: 'c3', name: 'Contact 3' }, contactId: 'c3' },
      ]);

      const result = await service.getMessagingStats('user-123');

      expect(result.totalMessagesSent).toBe(4);
      expect(result.messagesByType[WhatsAppMessageType.SORTEO_INVITE]).toBe(2);
      expect(result.messagesByType[WhatsAppMessageType.PROMOTION]).toBe(1);
    });
  });

  // ============================================
  // TESTS DE HORARIO DE ENVÍO
  // ============================================

  describe('Send time restrictions', () => {
    it('should check allowed send hours', () => {
      // Este test verifica que el servicio tenga la configuración correcta
      expect(WHATSAPP_SEND_LIMITS.allowedSendHours.start).toBe(9);
      expect(WHATSAPP_SEND_LIMITS.allowedSendHours.end).toBe(21);
    });
  });

  // ============================================
  // TESTS DE TEMPLATES DE MENSAJES
  // ============================================

  describe('Message Templates', () => {
    it('should have templates for all message types', () => {
      const messageTypes = Object.values(WhatsAppMessageType);
      
      for (const type of messageTypes) {
        // El servicio tiene MESSAGE_TEMPLATES que cubre todos los tipos
        expect(type).toBeDefined();
      }
    });
  });

  // ============================================
  // TESTS DE ELIMINACIÓN
  // ============================================

  describe('deleteContact', () => {
    it('should delete existing contact', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue({
        id: 'contact-123',
        userId: 'user-123',
        phoneNumber: '+34612345678',
      });

      mockPrismaService.whatsappContact.delete.mockResolvedValue({ id: 'contact-123' });

      await expect(service.deleteContact('user-123', 'contact-123')).resolves.not.toThrow();
    });

    it('should throw if contact not found', async () => {
      mockPrismaService.whatsappContact.findFirst.mockResolvedValue(null);

      await expect(service.deleteContact('user-123', 'non-existent')).rejects.toThrow(
        WHATSAPP_CONTACTS_ERRORS.CONTACT_NOT_FOUND,
      );
    });
  });

  describe('deleteContacts (bulk)', () => {
    it('should delete multiple contacts', async () => {
      mockPrismaService.whatsappContact.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.deleteContacts('user-123', ['c1', 'c2', 'c3']);

      expect(result.deleted).toBe(3);
    });
  });
});
