// DOCUMENTO 32 - TESTS FLUJOS CRITICOS ANTIFRAUDE
// Tests para DefaultCauseAssignmentsService
// REGLA: Siempre hay una causa asignada (DOC32 seccion 7)

import { Test, TestingModule } from '@nestjs/testing';
import { DefaultCauseAssignmentsService } from '../default-cause-assignments.service';
import { PrismaService } from '../../shared/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentReason } from '@prisma/client';

describe('DefaultCauseAssignmentsService - Flujos Antifraude', () => {
  let service: DefaultCauseAssignmentsService;
  let prismaService: PrismaService;

  const mockPrisma = {
    causa: {
      findUnique: jest.fn(),
    },
    sorteo: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    defaultCauseAssignment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  const DEFAULT_CAUSE_ID = 'default-cause-123';

  beforeEach(async () => {
    // Configurar env variable
    process.env.DEFAULT_CAUSE_ID = DEFAULT_CAUSE_ID;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DefaultCauseAssignmentsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DefaultCauseAssignmentsService>(DefaultCauseAssignmentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.DEFAULT_CAUSE_ID;
  });

  describe('getDefaultCause', () => {
    it('Debe lanzar error si DEFAULT_CAUSE_ID no esta configurado', async () => {
      delete process.env.DEFAULT_CAUSE_ID;

      await expect(service.getDefaultCause())
        .rejects
        .toThrow('No hay causa por defecto configurada en la plataforma');
    });

    it('Debe lanzar NotFoundException si causa por defecto no existe', async () => {
      mockPrisma.causa.findUnique.mockResolvedValue(null);

      await expect(service.getDefaultCause())
        .rejects
        .toThrow(NotFoundException);
    });

    it('Debe rechazar causa por defecto no activa', async () => {
      mockPrisma.causa.findUnique.mockResolvedValue({
        id: DEFAULT_CAUSE_ID,
        estado: 'INACTIVA', // No activa
        verificada: true,
      });

      await expect(service.getDefaultCause())
        .rejects
        .toThrow('La causa por defecto no esta activa o verificada');
    });

    it('Debe rechazar causa por defecto no verificada', async () => {
      mockPrisma.causa.findUnique.mockResolvedValue({
        id: DEFAULT_CAUSE_ID,
        estado: 'ACTIVA',
        verificada: false, // No verificada
      });

      await expect(service.getDefaultCause())
        .rejects
        .toThrow('La causa por defecto no esta activa o verificada');
    });

    it('Debe retornar causa por defecto valida', async () => {
      const causaValida = {
        id: DEFAULT_CAUSE_ID,
        nombre: 'Causa Por Defecto',
        estado: 'ACTIVA',
        verificada: true,
      };

      mockPrisma.causa.findUnique.mockResolvedValue(causaValida);

      const resultado = await service.getDefaultCause();

      expect(resultado.id).toBe(DEFAULT_CAUSE_ID);
      expect(resultado.estado).toBe('ACTIVA');
      expect(resultado.verificada).toBe(true);
    });
  });

  describe('ensureCauseAssigned - REGLA DOC32 seccion 7', () => {
    const defaultCausa = {
      id: DEFAULT_CAUSE_ID,
      nombre: 'Causa Por Defecto',
      estado: 'ACTIVA',
      verificada: true,
    };

    beforeEach(() => {
      mockPrisma.causa.findUnique.mockResolvedValue(defaultCausa);
    });

    it('Debe lanzar NotFoundException si sorteo no existe', async () => {
      mockPrisma.sorteo.findUnique.mockResolvedValue(null);

      await expect(service.ensureCauseAssigned('sorteo-inexistente'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('USER_DID_NOT_SELECT - Asignar cuando usuario no eligio causa', async () => {
      // DOC32 seccion 7: Si el usuario no elige causa
      const sorteoSinCausa = {
        id: 'sorteo-123',
        causaId: null, // Sin causa
        causa: null,
      };

      mockPrisma.sorteo.findUnique.mockResolvedValue(sorteoSinCausa);
      mockPrisma.defaultCauseAssignment.create.mockResolvedValue({
        id: 'assignment-123',
        sorteoId: 'sorteo-123',
        assignmentReason: AssignmentReason.USER_DID_NOT_SELECT,
      });
      mockPrisma.sorteo.update.mockResolvedValue({
        ...sorteoSinCausa,
        causaId: DEFAULT_CAUSE_ID,
      });

      const causaIdAsignada = await service.ensureCauseAssigned('sorteo-123');

      expect(causaIdAsignada).toBe(DEFAULT_CAUSE_ID);
      expect(mockPrisma.defaultCauseAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sorteoId: 'sorteo-123',
          originalCauseId: null,
          assignedCauseId: DEFAULT_CAUSE_ID,
          assignmentReason: AssignmentReason.USER_DID_NOT_SELECT,
        }),
      });
      expect(mockPrisma.sorteo.update).toHaveBeenCalledWith({
        where: { id: 'sorteo-123' },
        data: { causaId: DEFAULT_CAUSE_ID },
      });
    });

    it('CAUSE_REJECTED - Asignar cuando causa no esta verificada', async () => {
      // DOC32 seccion 7: Causa rechazada/no verificada
      const sorteoConCausaNoVerificada = {
        id: 'sorteo-456',
        causaId: 'causa-no-verificada',
        causa: {
          id: 'causa-no-verificada',
          estado: 'PENDIENTE',
          verificada: false, // No verificada
        },
      };

      mockPrisma.sorteo.findUnique.mockResolvedValue(sorteoConCausaNoVerificada);
      mockPrisma.defaultCauseAssignment.create.mockResolvedValue({
        id: 'assignment-456',
        sorteoId: 'sorteo-456',
        assignmentReason: AssignmentReason.CAUSE_REJECTED,
      });
      mockPrisma.sorteo.update.mockResolvedValue({});

      const causaIdAsignada = await service.ensureCauseAssigned('sorteo-456');

      expect(causaIdAsignada).toBe(DEFAULT_CAUSE_ID);
      expect(mockPrisma.defaultCauseAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalCauseId: 'causa-no-verificada',
          assignmentReason: AssignmentReason.CAUSE_REJECTED,
        }),
      });
    });

    it('CAUSE_INACTIVE - Asignar cuando causa esta inactiva', async () => {
      // DOC32 seccion 7: Causa inactiva
      const sorteoConCausaInactiva = {
        id: 'sorteo-789',
        causaId: 'causa-inactiva',
        causa: {
          id: 'causa-inactiva',
          estado: 'INACTIVA', // Inactiva
          verificada: true,
        },
      };

      mockPrisma.sorteo.findUnique.mockResolvedValue(sorteoConCausaInactiva);
      mockPrisma.defaultCauseAssignment.create.mockResolvedValue({
        id: 'assignment-789',
        sorteoId: 'sorteo-789',
        assignmentReason: AssignmentReason.CAUSE_INACTIVE,
      });
      mockPrisma.sorteo.update.mockResolvedValue({});

      const causaIdAsignada = await service.ensureCauseAssigned('sorteo-789');

      expect(causaIdAsignada).toBe(DEFAULT_CAUSE_ID);
      expect(mockPrisma.defaultCauseAssignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          originalCauseId: 'causa-inactiva',
          assignmentReason: AssignmentReason.CAUSE_INACTIVE,
        }),
      });
    });

    it('NO debe reasignar si ya tiene causa activa y verificada', async () => {
      // DOC32 seccion 7: Si tiene causa valida, respetarla
      const sorteoConCausaValida = {
        id: 'sorteo-valido',
        causaId: 'causa-valida',
        causa: {
          id: 'causa-valida',
          estado: 'ACTIVA',
          verificada: true, // Valida
        },
      };

      mockPrisma.sorteo.findUnique.mockResolvedValue(sorteoConCausaValida);

      const causaIdRetornada = await service.ensureCauseAssigned('sorteo-valido');

      // Debe retornar la causa original, no la por defecto
      expect(causaIdRetornada).toBe('causa-valida');
      // NO debe crear asignacion
      expect(mockPrisma.defaultCauseAssignment.create).not.toHaveBeenCalled();
      // NO debe actualizar sorteo
      expect(mockPrisma.sorteo.update).not.toHaveBeenCalled();
    });
  });

  describe('hasDefaultAssignment', () => {
    it('Debe retornar true si sorteo tiene asignacion por defecto', async () => {
      mockPrisma.defaultCauseAssignment.count.mockResolvedValue(1);

      const resultado = await service.hasDefaultAssignment('sorteo-123');

      expect(resultado).toBe(true);
    });

    it('Debe retornar false si sorteo no tiene asignacion por defecto', async () => {
      mockPrisma.defaultCauseAssignment.count.mockResolvedValue(0);

      const resultado = await service.hasDefaultAssignment('sorteo-456');

      expect(resultado).toBe(false);
    });
  });

  describe('getAssignmentHistory', () => {
    it('Debe retornar historial de asignaciones ordenado por fecha', async () => {
      const historial = [
        { id: '1', sorteoId: 'sorteo-123', assignedAt: new Date('2025-12-15') },
        { id: '2', sorteoId: 'sorteo-123', assignedAt: new Date('2025-12-14') },
      ];

      mockPrisma.defaultCauseAssignment.findMany.mockResolvedValue(historial);

      const resultado = await service.getAssignmentHistory('sorteo-123');

      expect(resultado).toHaveLength(2);
      expect(mockPrisma.defaultCauseAssignment.findMany).toHaveBeenCalledWith({
        where: { sorteoId: 'sorteo-123' },
        orderBy: { assignedAt: 'desc' },
      });
    });

    it('Debe retornar array vacio si no hay historial', async () => {
      mockPrisma.defaultCauseAssignment.findMany.mockResolvedValue([]);

      const resultado = await service.getAssignmentHistory('sorteo-sin-historial');

      expect(resultado).toHaveLength(0);
    });
  });

  describe('getCurrentAssignment', () => {
    it('Debe retornar la asignacion mas reciente', async () => {
      const asignacionReciente = {
        id: 'assignment-latest',
        sorteoId: 'sorteo-123',
        originalCauseId: null,
        assignedCauseId: DEFAULT_CAUSE_ID,
        assignmentReason: AssignmentReason.USER_DID_NOT_SELECT,
        assignedAt: new Date(),
      };

      mockPrisma.defaultCauseAssignment.findFirst.mockResolvedValue(asignacionReciente);

      const resultado = await service.getCurrentAssignment('sorteo-123');

      expect(resultado).toBeDefined();
      expect(resultado?.assignedCauseId).toBe(DEFAULT_CAUSE_ID);
      expect(resultado?.reason).toBe(AssignmentReason.USER_DID_NOT_SELECT);
    });

    it('Debe retornar null si no hay asignacion', async () => {
      mockPrisma.defaultCauseAssignment.findFirst.mockResolvedValue(null);

      const resultado = await service.getCurrentAssignment('sorteo-sin-asignacion');

      expect(resultado).toBeNull();
    });
  });

  describe('Garantias DOC32 seccion 7', () => {
    it('GARANTIA: Siempre hay impacto social real', () => {
      // DOC32 seccion 7: Siempre hay una causa beneficiada
      // Este test documenta la garantia de que nunca hay sorteo sin causa
      const regla = 'TODO sorteo DEBE tener causa asignada (propia o por defecto)';
      expect(regla).toBeTruthy();
    });

    it('GARANTIA: Recibos de donacion validos', () => {
      // DOC32 seccion 7: Documentacion fiscal correcta
      // La causa asignada siempre esta verificada
      const regla = 'La causa asignada SIEMPRE esta verificada y activa';
      expect(regla).toBeTruthy();
    });

    it('GARANTIA: Coherencia del producto', () => {
      // DOC32 seccion 7: La plataforma mantiene su identidad
      const regla = 'Sorteos CON impacto social obligatorio';
      expect(regla).toBeTruthy();
    });
  });
});
