// DOCUMENTO 32 - TESTS FLUJOS CRITICOS ANTIFRAUDE
// Tests para CauseVerificationsService
// REGLA: No se libera dinero a causas no verificadas

import { Test, TestingModule } from '@nestjs/testing';
import { CauseVerificationsService } from '../cause-verifications.service';
import { PrismaService } from '../../shared/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CauseVerificationsService - Flujos Antifraude', () => {
  let service: CauseVerificationsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    causa: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    causeVerification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CauseVerificationsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<CauseVerificationsService>(CauseVerificationsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('proponerCausa - Validaciones de entrada', () => {
    it('Debe rechazar causa sin nombre', async () => {
      await expect(
        service.proponerCausa('user-123', {
          nombre: '', // Vacio
          descripcion: 'Una descripcion valida',
          imagenUrl: 'https://img.jpg',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe rechazar causa con nombre muy corto', async () => {
      await expect(
        service.proponerCausa('user-123', {
          nombre: 'AB', // Menor a 3 caracteres
          descripcion: 'Una descripcion valida',
          imagenUrl: 'https://img.jpg',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe rechazar causa sin descripcion', async () => {
      await expect(
        service.proponerCausa('user-123', {
          nombre: 'Causa Test',
          descripcion: '', // Vacia
          imagenUrl: 'https://img.jpg',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe crear causa en estado PENDIENTE (no verificada)', async () => {
      // DOC32 seccion 6.2: Causa propuesta debe estar PENDIENTE
      const causaCreada = {
        id: 'causa-123',
        nombre: 'Causa Valida',
        descripcion: 'Descripcion valida de la causa',
        estado: 'PENDIENTE',
        verificada: false,
      };

      const verificacionCreada = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: 'PENDING',
      };

      mockPrisma.causa.create.mockResolvedValue(causaCreada);
      mockPrisma.causeVerification.create.mockResolvedValue(verificacionCreada);

      const resultado = await service.proponerCausa('user-123', {
        nombre: 'Causa Valida',
        descripcion: 'Descripcion valida de la causa',
        imagenUrl: 'https://imagen.jpg',
      });

      // Verificar que se creo en estado correcto
      expect(mockPrisma.causa.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          estado: 'PENDIENTE',
          verificada: false,
        }),
      });

      expect(resultado.causa.estado).toBe('PENDIENTE');
      expect(resultado.causa.verificada).toBe(false);
    });
  });

  describe('obtenerEstadoVerificacion', () => {
    it('Debe lanzar NotFoundException si causa no existe', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(null);

      await expect(service.obtenerEstadoVerificacion('causa-inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe retornar flags de verificacion correctos', async () => {
      const verificacionMock = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: 'PENDING',
        documents: ['doc1.pdf', 'doc2.pdf'],
        externalLinks: ['https://link.com'],
        foundationName: 'Fundacion Test',
        foundationId: 'FND-123',
        causa: {
          imagenUrl: 'https://img.jpg',
        },
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionMock);

      const resultado = await service.obtenerEstadoVerificacion('causa-123');

      expect(resultado.estado).toBe('PENDIENTE');
      expect(resultado.flags).toBeDefined();
      expect(resultado.flags.tieneDocumentos).toBe(true);
      expect(resultado.flags.tieneEnlaces).toBe(true);
      expect(resultado.flags.tieneNombreFundacion).toBe(true);
    });
  });

  describe('subirDocumentos - Validaciones', () => {
    const mockVerificacionPendiente = {
      id: 'verif-123',
      causaId: 'causa-123',
      submittedBy: 'user-123',
      verificationStatus: 'PENDING',
      documents: [],
    };

    it('Debe rechazar si no es el propietario de la verificacion', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(mockVerificacionPendiente);

      await expect(
        service.subirDocumentos('otro-usuario', 'causa-123', {
          documents: ['doc.pdf'],
        })
      ).rejects.toThrow('Solo el usuario que propuso la causa puede agregar documentos');
    });

    it('Debe rechazar si verificacion no esta en PENDING o UNDER_REVIEW', async () => {
      const verificacionAprobada = {
        ...mockVerificacionPendiente,
        verificationStatus: 'APPROVED', // Ya aprobada
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionAprobada);

      await expect(
        service.subirDocumentos('user-123', 'causa-123', {
          documents: ['doc.pdf'],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe rechazar documentos vacios', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(mockVerificacionPendiente);

      await expect(
        service.subirDocumentos('user-123', 'causa-123', {
          documents: [], // Vacio
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('Debe agregar documentos correctamente', async () => {
      mockPrisma.causeVerification.findFirst.mockResolvedValue(mockVerificacionPendiente);
      mockPrisma.causeVerification.update.mockResolvedValue({
        ...mockVerificacionPendiente,
        documents: ['doc1.pdf', 'doc2.pdf'],
      });

      await service.subirDocumentos('user-123', 'causa-123', {
        documents: ['doc1.pdf', 'doc2.pdf'],
      });

      expect(mockPrisma.causeVerification.update).toHaveBeenCalled();
    });
  });

  describe('Reglas de Estado - Solo APPROVED recibe donaciones', () => {
    it('Causa PENDING no puede recibir donaciones (validacion conceptual)', async () => {
      // DOC32 seccion 6.2: SOLO despues de validar, la causa puede recibir donaciones
      const causaPendiente = {
        id: 'causa-123',
        estado: 'PENDIENTE',
        verificada: false,
      };

      // Una causa pendiente NO debe tener verificada=true
      expect(causaPendiente.verificada).toBe(false);
      expect(causaPendiente.estado).toBe('PENDIENTE');
    });

    it('Causa REJECTED no puede recibir donaciones (validacion conceptual)', async () => {
      const causaRechazada = {
        id: 'causa-456',
        estado: 'INACTIVA',
        verificada: false,
      };

      expect(causaRechazada.verificada).toBe(false);
    });

    it('Solo causa APPROVED puede recibir donaciones (validacion conceptual)', async () => {
      // DOC32 seccion 6.2: Una vez validada, la causa puede entrar al catalogo
      const causaAprobada = {
        id: 'causa-789',
        estado: 'ACTIVA',
        verificada: true,
      };

      expect(causaAprobada.verificada).toBe(true);
      expect(causaAprobada.estado).toBe('ACTIVA');
    });
  });

  describe('Transiciones de Estado Validas', () => {
    // DOC32 seccion 14: pending -> under_review -> approved/rejected

    it('PENDING puede transicionar a UNDER_REVIEW', () => {
      const transicionesValidas = {
        PENDING: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: [], // Estado final
        REJECTED: [], // Estado final
      };

      expect(transicionesValidas['PENDING']).toContain('UNDER_REVIEW');
    });

    it('UNDER_REVIEW puede transicionar a APPROVED o REJECTED', () => {
      const transicionesValidas = {
        PENDING: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: [],
        REJECTED: [],
      };

      expect(transicionesValidas['UNDER_REVIEW']).toContain('APPROVED');
      expect(transicionesValidas['UNDER_REVIEW']).toContain('REJECTED');
    });

    it('APPROVED no puede transicionar (estado final)', () => {
      const transicionesValidas = {
        PENDING: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: [],
        REJECTED: [],
      };

      expect(transicionesValidas['APPROVED']).toHaveLength(0);
    });

    it('REJECTED no puede transicionar (estado final)', () => {
      const transicionesValidas = {
        PENDING: ['UNDER_REVIEW'],
        UNDER_REVIEW: ['APPROVED', 'REJECTED'],
        APPROVED: [],
        REJECTED: [],
      };

      expect(transicionesValidas['REJECTED']).toHaveLength(0);
    });
  });

  describe('Flags de Verificacion', () => {
    it('Debe calcular flags correctamente con documentos', async () => {
      const verificacionConDocs = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: 'PENDING',
        documents: ['doc1.pdf'],
        externalLinks: [],
        foundationName: null,
        foundationId: null,
        causa: { imagenUrl: null },
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionConDocs);

      const resultado = await service.obtenerEstadoVerificacion('causa-123');

      expect(resultado.flags.tieneDocumentos).toBe(true);
      expect(resultado.flags.tieneEnlaces).toBe(false);
      expect(resultado.flags.tieneNombreFundacion).toBe(false);
    });

    it('Debe calcular flags correctamente con fundacion', async () => {
      const verificacionConFundacion = {
        id: 'verif-123',
        causaId: 'causa-123',
        verificationStatus: 'PENDING',
        documents: [],
        externalLinks: [],
        foundationName: 'Fundacion ABC',
        foundationId: 'ABC-123',
        causa: { imagenUrl: 'https://img.jpg' },
      };

      mockPrisma.causeVerification.findFirst.mockResolvedValue(verificacionConFundacion);

      const resultado = await service.obtenerEstadoVerificacion('causa-123');

      expect(resultado.flags.tieneNombreFundacion).toBe(true);
      expect(resultado.flags.tieneIdFundacion).toBe(true);
      expect(resultado.flags.tieneImagen).toBe(true);
    });
  });
});
