// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Servicio de participaciones (SIN flujos de dinero)

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoSorteo } from '@prisma/client';

@Injectable()
export class ParticipacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [participaciones, total] = await Promise.all([
      this.prisma.participacion.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          sorteo: {
            include: {
              premios: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.participacion.count({ where: { userId } }),
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

  async findBySorteo(sorteoId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [participaciones, total] = await Promise.all([
      this.prisma.participacion.findMany({
        where: { sorteoId },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              nombre: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          numeroBoleto: 'asc',
        },
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
      },
    };
  }

  async findById(id: string) {
    const participacion = await this.prisma.participacion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            email: true,
          },
        },
        sorteo: {
          include: {
            premios: true,
          },
        },
      },
    });

    if (!participacion) {
      throw new NotFoundException('Participacion no encontrada');
    }

    return participacion;
  }

  // Registrar participacion (estructura base SIN pago)
  async registrar(userId: string, sorteoId: string) {
    // Verificar que el sorteo existe y esta activo
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    if (sorteo.estado !== EstadoSorteo.ACTIVO) {
      throw new BadRequestException('El sorteo no esta activo');
    }

    // Verificar si quedan boletos
    if (sorteo.boletosVendidos >= sorteo.totalBoletos) {
      throw new BadRequestException('No quedan boletos disponibles');
    }

    // Asignar numero de boleto
    const numeroBoleto = sorteo.boletosVendidos + 1;

    // Crear participacion
    const participacion = await this.prisma.participacion.create({
      data: {
        userId,
        sorteoId,
        numeroBoleto,
      },
      include: {
        sorteo: true,
      },
    });

    // Actualizar contador de boletos vendidos
    await this.prisma.sorteo.update({
      where: { id: sorteoId },
      data: {
        boletosVendidos: {
          increment: 1,
        },
      },
    });

    return participacion;
  }

  async marcarGanador(participacionId: string) {
    return this.prisma.participacion.update({
      where: { id: participacionId },
      data: { esGanador: true },
    });
  }
}
