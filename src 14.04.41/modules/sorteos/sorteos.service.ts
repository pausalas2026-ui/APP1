// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Servicio de sorteos (SIN flujos de dinero)

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoSorteo } from '@prisma/client';

interface FindAllParams {
  page?: number;
  limit?: number;
  estado?: string;
  tipo?: string;
}

@Injectable()
export class SorteosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: FindAllParams) {
    const { page = 1, limit = 10, estado, tipo } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (estado) {
      where.estado = estado;
    }
    if (tipo) {
      where.tipo = tipo;
    }

    const [sorteos, total] = await Promise.all([
      this.prisma.sorteo.findMany({
        where,
        skip,
        take: limit,
        include: {
          causa: true,
          premios: true,
          _count: {
            select: { participaciones: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.sorteo.count({ where }),
    ]);

    return {
      data: sorteos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findActivos() {
    return this.prisma.sorteo.findMany({
      where: {
        estado: EstadoSorteo.ACTIVO,
      },
      include: {
        causa: true,
        premios: true,
        _count: {
          select: { participaciones: true },
        },
      },
      orderBy: {
        fechaFin: 'asc',
      },
    });
  }

  async findById(id: string) {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id },
      include: {
        causa: true,
        premios: {
          orderBy: { posicion: 'asc' },
        },
        _count: {
          select: { participaciones: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    return sorteo;
  }

  async findByCodigo(codigo: string) {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { codigo },
      include: {
        causa: true,
        premios: {
          orderBy: { posicion: 'asc' },
        },
        _count: {
          select: { participaciones: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    return sorteo;
  }

  async create(data: {
    titulo: string;
    descripcion: string;
    imagenUrl?: string;
    tipo?: string;
    fechaInicio: Date;
    fechaFin: Date;
    fechaSorteo?: Date;
    totalBoletos: number;
    minimoParticipantes?: number;
    causaId?: string;
    porcentajeCausa?: number;
  }) {
    // Generar codigo unico
    const codigo = await this.generarCodigo();

    return this.prisma.sorteo.create({
      data: {
        codigo,
        titulo: data.titulo,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl,
        tipo: data.tipo as any || 'ESTANDAR',
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
        fechaSorteo: data.fechaSorteo ? new Date(data.fechaSorteo) : null,
        totalBoletos: data.totalBoletos,
        minimoParticipantes: data.minimoParticipantes || 1,
        causaId: data.causaId,
        porcentajeCausa: data.porcentajeCausa || 10,
      },
      include: {
        causa: true,
      },
    });
  }

  async update(id: string, data: Partial<{
    titulo: string;
    descripcion: string;
    imagenUrl: string;
    fechaInicio: Date;
    fechaFin: Date;
    fechaSorteo: Date;
    totalBoletos: number;
    minimoParticipantes: number;
    causaId: string;
    porcentajeCausa: number;
  }>) {
    const sorteo = await this.findById(id);

    // Solo permitir edicion si esta en BORRADOR
    if (sorteo.estado !== EstadoSorteo.BORRADOR) {
      throw new BadRequestException('Solo se pueden editar sorteos en estado BORRADOR');
    }

    return this.prisma.sorteo.update({
      where: { id },
      data: {
        ...data,
        fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : undefined,
        fechaFin: data.fechaFin ? new Date(data.fechaFin) : undefined,
        fechaSorteo: data.fechaSorteo ? new Date(data.fechaSorteo) : undefined,
      },
      include: {
        causa: true,
        premios: true,
      },
    });
  }

  async cambiarEstado(id: string, nuevoEstado: string) {
    const sorteo = await this.findById(id);
    const estadoActual = sorteo.estado;

    // Validar transiciones de estado segun DOCUMENTO 32
    const transicionesValidas: Record<string, string[]> = {
      BORRADOR: ['PROGRAMADO', 'CANCELADO'],
      PROGRAMADO: ['ACTIVO', 'CANCELADO'],
      ACTIVO: ['CERRADO', 'CANCELADO'],
      CERRADO: ['SORTEANDO', 'CANCELADO'],
      SORTEANDO: ['FINALIZADO'],
      FINALIZADO: [],
      CANCELADO: [],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`,
      );
    }

    return this.prisma.sorteo.update({
      where: { id },
      data: { estado: nuevoEstado as EstadoSorteo },
      include: {
        causa: true,
        premios: true,
      },
    });
  }

  async delete(id: string) {
    const sorteo = await this.findById(id);

    if (sorteo.estado !== EstadoSorteo.BORRADOR) {
      throw new BadRequestException('Solo se pueden eliminar sorteos en estado BORRADOR');
    }

    await this.prisma.sorteo.delete({
      where: { id },
    });

    return { message: 'Sorteo eliminado', id };
  }

  private async generarCodigo(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SRT-${year}${month}-${random}`;
  }
}
