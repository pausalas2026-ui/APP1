// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.2: Servicio de Participaciones
// Registro, gestion y listado de participaciones

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoSorteo } from '@prisma/client';
import {
  validarSorteoParaParticipar,
  validarUsuarioParaParticipar,
  generarNumeroBoletoAleatorio,
  calcularEstadisticas,
  ESTADO_VALIDO_PARA_PARTICIPAR,
  ESTADOS_VISIBLES_PARTICIPACIONES,
  EstadisticasParticipacion,
} from './participaciones-core.validations';
import { RegistrarParticipacionDto } from './dto/registrar-participacion.dto';

export interface ResultadoParticipacion {
  participacion: any;
  validacion: {
    advertencias: string[];
  };
}

@Injectable()
export class ParticipacionesCoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registrar nueva participacion en un sorteo ACTIVO
   * Genera boleto automaticamente
   */
  async registrarParticipacion(
    dto: RegistrarParticipacionDto,
  ): Promise<ResultadoParticipacion> {
    // 1. Obtener sorteo con participaciones existentes
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: dto.sorteoId },
      include: {
        participaciones: {
          select: { userId: true, numeroBoleto: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // 2. Validar sorteo para participar
    const validacionSorteo = validarSorteoParaParticipar({
      id: sorteo.id,
      estado: sorteo.estado,
      totalBoletos: sorteo.totalBoletos,
      boletosVendidos: sorteo.boletosVendidos,
      fechaInicio: sorteo.fechaInicio,
      fechaFin: sorteo.fechaFin,
    });

    if (!validacionSorteo.valido) {
      throw new ForbiddenException({
        message: 'No se puede participar en este sorteo',
        errores: validacionSorteo.errores,
      });
    }

    // 3. Validar usuario para participar
    const validacionUsuario = validarUsuarioParaParticipar(
      dto.userId,
      sorteo.participaciones,
      dto.maxBoletos || 1,
    );

    if (!validacionUsuario.valido) {
      throw new ConflictException({
        message: 'No puedes participar en este sorteo',
        errores: validacionUsuario.errores,
      });
    }

    // 4. Generar numero de boleto
    const boletosAsignados = sorteo.participaciones.map((p) => p.numeroBoleto);
    const numeroBoleto = generarNumeroBoletoAleatorio(
      boletosAsignados,
      sorteo.totalBoletos,
    );

    if (numeroBoleto === null) {
      throw new ConflictException('No hay boletos disponibles');
    }

    // 5. Crear participacion y actualizar contador en transaccion
    const [participacion] = await this.prisma.$transaction([
      this.prisma.participacion.create({
        data: {
          userId: dto.userId,
          sorteoId: dto.sorteoId,
          numeroBoleto,
          esGanador: false,
        },
        include: {
          user: {
            select: { id: true, nombre: true, email: true },
          },
          sorteo: {
            select: { id: true, codigo: true, titulo: true },
          },
        },
      }),
      this.prisma.sorteo.update({
        where: { id: dto.sorteoId },
        data: {
          boletosVendidos: { increment: 1 },
        },
      }),
    ]);

    // Combinar advertencias
    const advertencias = [
      ...validacionSorteo.advertencias,
      ...validacionUsuario.advertencias,
    ];

    return {
      participacion,
      validacion: {
        advertencias,
      },
    };
  }

  /**
   * Obtener participacion por ID
   */
  async obtenerPorId(id: string) {
    const participacion = await this.prisma.participacion.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, nombre: true, email: true },
        },
        sorteo: {
          select: {
            id: true,
            codigo: true,
            titulo: true,
            estado: true,
            fechaSorteo: true,
          },
        },
      },
    });

    if (!participacion) {
      throw new NotFoundException('Participacion no encontrada');
    }

    return participacion;
  }

  /**
   * Listar participaciones de un sorteo
   */
  async listarPorSorteo(
    sorteoId: string,
    params: {
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    // Verificar que el sorteo existe
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: {
        id: true,
        estado: true,
        totalBoletos: true,
        boletosVendidos: true,
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Verificar que el estado permite ver participaciones
    if (!ESTADOS_VISIBLES_PARTICIPACIONES.includes(sorteo.estado as any)) {
      throw new ForbiddenException(
        `No se pueden ver participaciones de un sorteo en estado ${sorteo.estado}`,
      );
    }

    const [participaciones, total] = await Promise.all([
      this.prisma.participacion.findMany({
        where: { sorteoId },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, nombre: true },
          },
        },
        orderBy: { numeroBoleto: 'asc' },
      }),
      this.prisma.participacion.count({ where: { sorteoId } }),
    ]);

    return {
      data: participaciones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sorteo: {
          id: sorteo.id,
          estado: sorteo.estado,
          totalBoletos: sorteo.totalBoletos,
          boletosAsignados: sorteo.boletosVendidos,
        },
      },
    };
  }

  /**
   * Listar participaciones de un usuario
   */
  async listarPorUsuario(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      soloActivos?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 20, soloActivos } = params;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (soloActivos) {
      where.sorteo = {
        estado: EstadoSorteo.ACTIVO,
      };
    }

    const [participaciones, total] = await Promise.all([
      this.prisma.participacion.findMany({
        where,
        skip,
        take: limit,
        include: {
          sorteo: {
            select: {
              id: true,
              codigo: true,
              titulo: true,
              estado: true,
              fechaFin: true,
              fechaSorteo: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.participacion.count({ where }),
    ]);

    return {
      data: participaciones,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Verificar si un usuario ya participa en un sorteo
   */
  async verificarParticipacion(
    userId: string,
    sorteoId: string,
  ): Promise<{
    participa: boolean;
    participaciones: any[];
    puedeParticiparMas: boolean;
    boletosAsignados: number[];
  }> {
    const participaciones = await this.prisma.participacion.findMany({
      where: {
        userId,
        sorteoId,
      },
      select: {
        id: true,
        numeroBoleto: true,
        createdAt: true,
      },
    });

    const boletosAsignados = participaciones.map((p) => p.numeroBoleto);

    return {
      participa: participaciones.length > 0,
      participaciones,
      puedeParticiparMas: participaciones.length < 1, // Por defecto max 1
      boletosAsignados,
    };
  }

  /**
   * Obtener estadisticas de participacion de un sorteo
   */
  async obtenerEstadisticas(sorteoId: string): Promise<EstadisticasParticipacion> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: {
        totalBoletos: true,
        participaciones: {
          select: { userId: true, numeroBoleto: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    return calcularEstadisticas(sorteo.totalBoletos, sorteo.participaciones);
  }

  /**
   * Validar si se puede participar (sin crear participacion)
   */
  async validarParticipacion(
    userId: string,
    sorteoId: string,
  ): Promise<{
    puedeParticipar: boolean;
    errores: string[];
    advertencias: string[];
  }> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: {
        participaciones: {
          select: { userId: true, numeroBoleto: true },
        },
      },
    });

    if (!sorteo) {
      return {
        puedeParticipar: false,
        errores: ['Sorteo no encontrado'],
        advertencias: [],
      };
    }

    const validacionSorteo = validarSorteoParaParticipar({
      id: sorteo.id,
      estado: sorteo.estado,
      totalBoletos: sorteo.totalBoletos,
      boletosVendidos: sorteo.boletosVendidos,
      fechaInicio: sorteo.fechaInicio,
      fechaFin: sorteo.fechaFin,
    });

    const validacionUsuario = validarUsuarioParaParticipar(
      userId,
      sorteo.participaciones,
      1,
    );

    const errores = [...validacionSorteo.errores, ...validacionUsuario.errores];
    const advertencias = [
      ...validacionSorteo.advertencias,
      ...validacionUsuario.advertencias,
    ];

    return {
      puedeParticipar: errores.length === 0,
      errores,
      advertencias,
    };
  }

  /**
   * Obtener boletos disponibles de un sorteo
   */
  async obtenerBoletosDisponibles(sorteoId: string): Promise<{
    disponibles: number;
    total: number;
    porcentajeOcupacion: number;
  }> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: {
        totalBoletos: true,
        boletosVendidos: true,
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    const disponibles = sorteo.totalBoletos - sorteo.boletosVendidos;
    const porcentajeOcupacion =
      (sorteo.boletosVendidos / sorteo.totalBoletos) * 100;

    return {
      disponibles,
      total: sorteo.totalBoletos,
      porcentajeOcupacion: Math.round(porcentajeOcupacion * 100) / 100,
    };
  }
}
