// DOCUMENTO 06 - MODULOS CLAVE
// Servicio de causas/ONGs (estructura y estados, SIN liberacion de dinero)

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoCausa } from '@prisma/client';

interface FindAllParams {
  page?: number;
  limit?: number;
  estado?: string;
}

@Injectable()
export class CausasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { page = 1, limit = 10, estado } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) {
      where.estado = estado;
    }

    const [causas, total] = await Promise.all([
      this.prisma.causa.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { sorteos: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.causa.count({ where }),
    ]);

    return {
      data: causas,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActivas() {
    return this.prisma.causa.findMany({
      where: {
        estado: EstadoCausa.ACTIVA,
        verificada: true,
      },
      include: {
        _count: {
          select: { sorteos: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findById(id: string) {
    const causa = await this.prisma.causa.findUnique({
      where: { id },
      include: {
        sorteos: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { sorteos: true },
        },
      },
    });

    if (!causa) {
      throw new NotFoundException('Causa no encontrada');
    }

    return causa;
  }

  async create(data: {
    nombre: string;
    descripcion: string;
    imagenUrl?: string;
    sitioWeb?: string;
  }) {
    return this.prisma.causa.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl,
        sitioWeb: data.sitioWeb,
        estado: EstadoCausa.PENDIENTE,
        verificada: false,
      },
    });
  }

  async update(id: string, data: Partial<{
    nombre: string;
    descripcion: string;
    imagenUrl: string;
    sitioWeb: string;
  }>) {
    await this.findById(id);

    return this.prisma.causa.update({
      where: { id },
      data,
    });
  }

  async cambiarEstado(id: string, nuevoEstado: string) {
    const causa = await this.findById(id);
    const estadoActual = causa.estado;

    // Validar transiciones de estado
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['ACTIVA', 'CANCELADA'],
      ACTIVA: ['PAUSADA', 'COMPLETADA', 'CANCELADA'],
      PAUSADA: ['ACTIVA', 'CANCELADA'],
      COMPLETADA: [],
      CANCELADA: [],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`,
      );
    }

    return this.prisma.causa.update({
      where: { id },
      data: { estado: nuevoEstado as EstadoCausa },
    });
  }

  async verificar(id: string) {
    await this.findById(id);

    return this.prisma.causa.update({
      where: { id },
      data: { verificada: true },
    });
  }

  async delete(id: string) {
    const causa = await this.findById(id);

    // Verificar que no tenga sorteos asociados
    if (causa._count.sorteos > 0) {
      throw new BadRequestException('No se puede eliminar una causa con sorteos asociados');
    }

    await this.prisma.causa.delete({
      where: { id },
    });

    return { message: 'Causa eliminada', id };
  }
}
