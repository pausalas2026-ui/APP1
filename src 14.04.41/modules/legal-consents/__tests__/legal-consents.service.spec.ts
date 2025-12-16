/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Tests antifraude para el servicio de consentimientos legales
 * 
 * CASOS CRÍTICOS A TESTEAR:
 * 1. Se requiere al menos un identificador
 * 2. SORTEO requiere referenceId
 * 3. Consentimientos son inmutables
 * 4. Versiones de documentos se validan
 * 5. Historial no se puede borrar
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LegalConsentsService } from '../legal-consents.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  ConsentType,
  ConsentContext,
  DocumentType,
  CONSENT_ERRORS,
} from '../legal-consents.constants';

describe('LegalConsentsService - Tests Antifraude', () => {
  let service: LegalConsentsService;
  let prisma: PrismaService;

  // Mock data
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';
  const mockParticipantId = '550e8400-e29b-41d4-a716-446655440001';
  const mockSessionId = 'session-abc-123';
  const mockRaffleId = '550e8400-e29b-41d4-a716-446655440002';
  const mockDocumentId = '550e8400-e29b-41d4-a716-446655440003';
  const mockConsentId = '550e8400-e29b-41d4-a716-446655440004';

  const mockLegalDocument = {
    id: mockDocumentId,
    documentType: DocumentType.TERMS_OF_SERVICE,
    version: '1.0.0',
    title: 'Términos de Uso',
    content: 'Contenido de los términos...',
    summary: 'Resumen',
    effectiveFrom: new Date(),
    effectiveUntil: null,
    isCurrent: true,
    createdAt: new Date(),
    createdBy: mockUserId,
  };

  const mockConsent = {
    id: mockConsentId,
    userId: mockUserId,
    participantId: null,
    sessionId: null,
    consentType: ConsentType.TOS,
    documentVersion: '1.0.0',
    referenceType: null,
    referenceId: null,
    acceptedAt: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    fingerprint: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    userConsent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    legalDocument: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegalConsentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LegalConsentsService>(LegalConsentsService);
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('BLOQUE 1: Validación de Identificadores', () => {
    /**
     * DOC35: Se requiere al menos un identificador (userId, participantId o sessionId)
     * SIN IDENTIFICADOR = CONSENTIMIENTO NO DEMOSTRABLE
     */
    it('ANTIFRAUDE: DEBE RECHAZAR consentimiento sin ningún identificador', async () => {
      const dto = {
        // No userId, no participantId, no sessionId
        consentType: ConsentType.TOS,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      await expect(service.recordConsent(dto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.recordConsent(dto as any)).rejects.toThrow(
        CONSENT_ERRORS.MISSING_IDENTIFIER
      );
    });

    it('DEBE ACEPTAR consentimiento con userId únicamente', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);
      mockPrismaService.userConsent.create.mockResolvedValue(mockConsent);

      const dto = {
        userId: mockUserId,
        consentType: ConsentType.TOS,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.recordConsent(dto as any);

      expect(result.success).toBe(true);
      expect(mockPrismaService.userConsent.create).toHaveBeenCalled();
    });

    it('DEBE ACEPTAR consentimiento con participantId únicamente', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);
      mockPrismaService.userConsent.create.mockResolvedValue({
        ...mockConsent,
        userId: null,
        participantId: mockParticipantId,
      });

      const dto = {
        participantId: mockParticipantId,
        consentType: ConsentType.TOS,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.recordConsent(dto as any);

      expect(result.success).toBe(true);
    });

    it('DEBE ACEPTAR consentimiento con sessionId únicamente', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);
      mockPrismaService.userConsent.create.mockResolvedValue({
        ...mockConsent,
        userId: null,
        sessionId: mockSessionId,
      });

      const dto = {
        sessionId: mockSessionId,
        consentType: ConsentType.TOS,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.recordConsent(dto as any);

      expect(result.success).toBe(true);
    });
  });

  describe('BLOQUE 2: Consentimiento SORTEO requiere referenceId', () => {
    /**
     * DOC35: SORTEO_{id} - cada sorteo tiene sus propias bases legales
     * Sin referenceId no se puede demostrar qué sorteo aceptó
     */
    it('ANTIFRAUDE: DEBE RECHAZAR SORTEO sin referenceId', async () => {
      const dto = {
        userId: mockUserId,
        consentType: ConsentType.SORTEO,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        // Sin referenceId
      };

      await expect(service.recordConsent(dto as any)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.recordConsent(dto as any)).rejects.toThrow(
        CONSENT_ERRORS.MISSING_REFERENCE_ID
      );
    });

    it('DEBE ACEPTAR SORTEO con referenceId', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue({
        ...mockLegalDocument,
        documentType: DocumentType.RAFFLE_TERMS,
      });
      mockPrismaService.userConsent.create.mockResolvedValue({
        ...mockConsent,
        consentType: ConsentType.SORTEO,
        referenceType: 'RAFFLE',
        referenceId: mockRaffleId,
      });

      const dto = {
        userId: mockUserId,
        consentType: ConsentType.SORTEO,
        documentVersion: '1.0.0',
        referenceType: 'RAFFLE',
        referenceId: mockRaffleId,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.recordConsent(dto as any);

      expect(result.success).toBe(true);
      expect(mockPrismaService.userConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          consentType: ConsentType.SORTEO,
          referenceId: mockRaffleId,
        }),
      });
    });
  });

  describe('BLOQUE 3: Validación de Documentos Legales', () => {
    /**
     * DOC35: No hay documento legal activo = ERROR
     * Los consentimientos deben registrar la versión exacta
     */
    it('ANTIFRAUDE: DEBE RECHAZAR si no hay documento legal activo', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(null);

      await expect(
        service.getCurrentDocumentVersion(DocumentType.TERMS_OF_SERVICE)
      ).rejects.toThrow(NotFoundException);
    });

    it('DEBE REGISTRAR la versión exacta del documento aceptado', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);
      mockPrismaService.userConsent.create.mockResolvedValue(mockConsent);

      const dto = {
        userId: mockUserId,
        consentType: ConsentType.TOS,
        documentVersion: '1.0.0',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      await service.recordConsent(dto as any);

      expect(mockPrismaService.userConsent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentVersion: '1.0.0',
        }),
      });
    });
  });

  describe('BLOQUE 4: Verificación de Consentimientos', () => {
    it('DEBE RETORNAR hasConsent=false si usuario no tiene consentimiento', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(null);

      const result = await service.checkConsent({
        userId: mockUserId,
        consentType: ConsentType.TOS,
      });

      expect(result.hasConsent).toBe(false);
    });

    it('DEBE RETORNAR hasConsent=true y datos si usuario tiene consentimiento', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue(mockConsent);
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);

      const result = await service.checkConsent({
        userId: mockUserId,
        consentType: ConsentType.TOS,
      });

      expect(result.hasConsent).toBe(true);
      expect(result.acceptedVersion).toBe('1.0.0');
      expect(result.acceptedAt).toBeDefined();
    });

    it('DEBE INDICAR si hay versión más reciente disponible', async () => {
      mockPrismaService.userConsent.findFirst.mockResolvedValue({
        ...mockConsent,
        documentVersion: '1.0.0',
      });
      mockPrismaService.legalDocument.findFirst.mockResolvedValue({
        ...mockLegalDocument,
        version: '2.0.0',
      });

      const result = await service.checkConsent({
        userId: mockUserId,
        consentType: ConsentType.TOS,
      });

      expect(result.hasConsent).toBe(true);
      expect(result.hasNewerVersion).toBe(true);
      expect(result.currentVersion).toBe('2.0.0');
    });
  });

  describe('BLOQUE 5: Consentimientos por Contexto', () => {
    /**
     * DOC35: Cada contexto requiere consentimientos específicos
     * REGISTRO: TOS + PRIVACY
     * SORTEO: SORTEO + PRIVACY
     */
    it('DEBE VERIFICAR todos los consentimientos para REGISTRATION', async () => {
      // Usuario tiene TOS pero no PRIVACY
      mockPrismaService.userConsent.findFirst
        .mockResolvedValueOnce(mockConsent) // TOS - tiene
        .mockResolvedValueOnce(null); // PRIVACY - no tiene

      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);

      const result = await service.hasAllConsentsForContext(
        mockUserId,
        ConsentContext.REGISTRATION
      );

      expect(result).toBe(false);
    });

    it('DEBE APROBAR si usuario tiene todos los consentimientos requeridos', async () => {
      mockPrismaService.userConsent.findFirst
        .mockResolvedValueOnce(mockConsent) // TOS
        .mockResolvedValueOnce({ ...mockConsent, consentType: ConsentType.PRIVACY }); // PRIVACY

      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);

      const result = await service.hasAllConsentsForContext(
        mockUserId,
        ConsentContext.REGISTRATION
      );

      expect(result).toBe(true);
    });
  });

  describe('BLOQUE 6: Creación de Documentos Legales', () => {
    /**
     * DOC35: Versiones duplicadas no permitidas
     * Documentos versionados, nunca borrar
     */
    it('ANTIFRAUDE: DEBE RECHAZAR versión duplicada de documento', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(mockLegalDocument);

      const dto = {
        documentType: DocumentType.TERMS_OF_SERVICE,
        version: '1.0.0', // Ya existe
        title: 'Nuevo título',
        content: 'Nuevo contenido',
        effectiveFrom: new Date().toISOString(),
      };

      await expect(
        service.createLegalDocument(dto as any, mockUserId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createLegalDocument(dto as any, mockUserId)
      ).rejects.toThrow(CONSENT_ERRORS.DUPLICATE_VERSION);
    });

    it('ANTIFRAUDE: DEBE RECHAZAR formato de versión inválido', async () => {
      const dto = {
        documentType: DocumentType.TERMS_OF_SERVICE,
        version: 'version-invalida', // Formato incorrecto
        title: 'Título',
        content: 'Contenido',
        effectiveFrom: new Date().toISOString(),
      };

      await expect(
        service.createLegalDocument(dto as any, mockUserId)
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createLegalDocument(dto as any, mockUserId)
      ).rejects.toThrow(CONSENT_ERRORS.INVALID_VERSION_FORMAT);
    });

    it('DEBE CREAR documento con versión válida', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(null); // No existe
      mockPrismaService.legalDocument.create.mockResolvedValue({
        ...mockLegalDocument,
        version: '2.0.0',
      });

      const dto = {
        documentType: DocumentType.TERMS_OF_SERVICE,
        version: '2.0.0',
        title: 'Términos v2',
        content: 'Contenido actualizado',
        effectiveFrom: new Date().toISOString(),
        isCurrent: true,
      };

      const result = await service.createLegalDocument(dto as any, mockUserId);

      expect(result.version).toBe('2.0.0');
    });

    it('DEBE DESMARCAR versión anterior al crear nueva como current', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue(null);
      mockPrismaService.legalDocument.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.legalDocument.create.mockResolvedValue({
        ...mockLegalDocument,
        version: '2.0.0',
      });

      const dto = {
        documentType: DocumentType.TERMS_OF_SERVICE,
        version: '2.0.0',
        title: 'Términos v2',
        content: 'Contenido',
        effectiveFrom: new Date().toISOString(),
        isCurrent: true,
      };

      await service.createLegalDocument(dto as any, mockUserId);

      expect(mockPrismaService.legalDocument.updateMany).toHaveBeenCalledWith({
        where: {
          documentType: DocumentType.TERMS_OF_SERVICE,
          isCurrent: true,
        },
        data: { isCurrent: false },
      });
    });
  });

  describe('BLOQUE 7: Historial de Consentimientos', () => {
    /**
     * DOC35: Los consentimientos son INMUTABLES
     * El historial NUNCA se borra
     */
    it('DEBE RETORNAR historial completo del usuario', async () => {
      const mockConsents = [
        { ...mockConsent, id: 'consent-1', consentType: ConsentType.TOS },
        { ...mockConsent, id: 'consent-2', consentType: ConsentType.PRIVACY },
      ];

      mockPrismaService.userConsent.findMany.mockResolvedValue(mockConsents);
      mockPrismaService.userConsent.count.mockResolvedValue(2);

      const result = await service.getConsentHistory(mockUserId, 1, 20);

      expect(result.consents).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('DEBE PAGINAR resultados correctamente', async () => {
      mockPrismaService.userConsent.findMany.mockResolvedValue([mockConsent]);
      mockPrismaService.userConsent.count.mockResolvedValue(50);

      const result = await service.getConsentHistory(mockUserId, 2, 10);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('BLOQUE 8: Consentimientos Bulk', () => {
    /**
     * DOC35: Al registrarse se aceptan TOS + PRIVACY juntos
     */
    it('DEBE CREAR múltiples consentimientos en transacción', async () => {
      mockPrismaService.legalDocument.findFirst
        .mockResolvedValueOnce(mockLegalDocument) // TOS
        .mockResolvedValueOnce({ ...mockLegalDocument, documentType: DocumentType.PRIVACY_POLICY }); // PRIVACY

      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockConsent, consentType: ConsentType.TOS },
        { ...mockConsent, id: 'consent-2', consentType: ConsentType.PRIVACY },
      ]);

      const dto = {
        userId: mockUserId,
        context: ConsentContext.REGISTRATION,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const result = await service.recordBulkConsents(dto as any);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 consentimientos');
    });
  });

  describe('BLOQUE 9: Usuarios que necesitan re-consentimiento', () => {
    /**
     * DOC35: Cuando hay nueva versión, usuarios con versión anterior
     * deben ser identificados para re-aceptar
     */
    it('DEBE IDENTIFICAR usuarios con versión anterior', async () => {
      mockPrismaService.legalDocument.findFirst.mockResolvedValue({
        ...mockLegalDocument,
        version: '2.0.0',
      });

      mockPrismaService.userConsent.findMany
        .mockResolvedValueOnce([
          { userId: 'user-1', documentVersion: '1.0.0' },
          { userId: 'user-2', documentVersion: '1.5.0' },
        ])
        .mockResolvedValueOnce([]); // Ninguno tiene la versión actual

      const result = await service.getUsersNeedingReConsent(DocumentType.TERMS_OF_SERVICE);

      expect(result).toHaveLength(2);
      expect(result[0].currentVersion).toBe('2.0.0');
    });
  });

  describe('BLOQUE 10: Estadísticas', () => {
    it('DEBE CALCULAR estadísticas correctamente', async () => {
      mockPrismaService.userConsent.count.mockResolvedValue(100);
      mockPrismaService.userConsent.groupBy
        .mockResolvedValueOnce([
          { consentType: ConsentType.TOS, _count: { id: 50 } },
          { consentType: ConsentType.PRIVACY, _count: { id: 40 } },
        ])
        .mockResolvedValueOnce([
          { documentVersion: '1.0.0', _count: { id: 60 } },
          { documentVersion: '2.0.0', _count: { id: 40 } },
        ]);
      mockPrismaService.userConsent.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);

      const result = await service.getConsentStats();

      expect(result.totalConsents).toBe(100);
      expect(result.byType[ConsentType.TOS]).toBe(50);
      expect(result.byVersion['1.0.0']).toBe(60);
    });
  });
});
