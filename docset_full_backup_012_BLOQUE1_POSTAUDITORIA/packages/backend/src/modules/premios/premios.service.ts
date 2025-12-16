// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Servicio de premios (estructura y tipos, SIN liberacion de dinero)

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { TipoPremio, EstadoPremio, EstadoSorteo } from '@prisma/client';

@Injectable()
export class PremiosService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySorteo(sorteoId: string) {
    return this.prisma.premio.findMany({
      where: { sorteoId },
      orderBy: [
        { tipo: 'asc' },
        { posicion: 'asc' },
      ],
    });
  }

  async findById(id: string) {
    const premio = await this.prisma.premio.findUnique({
      where: { id },
      include: {
        sorteo: true,
      },
    });

    if (!premio) {
      throw new NotFoundException('Premio no encontrado');
    }

    return premio;
  }

  async create(data: {
    sorteoId: string;
    tipo?: string;
    nombre: string;
    descripcion?: string;
    imagenUrl?: string;
    posicion?: number;
  }) {
    // Verificar que el sorteo existe y esta en BORRADOR
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: data.sorteoId },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    if (sorteo.estado !== EstadoSorteo.BORRADOR) {
      throw new BadRequestException('Solo se pueden agregar premios a sorteos en BORRADOR');
    }

    // Obtener posicion si no se especifica
    let posicion = data.posicion;
    if (!posicion) {
      const ultimoPremio = await this.prisma.premio.findFirst({
        where: { sorteoId: data.sorteoId },
        orderBy: { posicion: 'desc' },
      });
      posicion = ultimoPremio ? ultimoPremio.posicion + 1 : 1;
    }

    return this.prisma.premio.create({
      data: {
        sorteoId: data.sorteoId,
        tipo: (data.tipo as TipoPremio) || TipoPremio.PRINCIPAL,
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl,
        posicion,
      },
    });
  }

  async update(id: string, data: Partial<{
    nombre: string;
    descripcion: string;
    imagenUrl: string;
    posicion: number;
  }>) {
    const premio = await this.findById(id);

    // Verificar que el sorteo esta en BORRADOR
    if (premio.sorteo.estado !== EstadoSorteo.BORRADOR) {
      throw new BadRequestException('Solo se pueden editar premios de sorteos en BORRADOR');
    }

    return this.prisma.premio.update({
      where: { id },
      data,
    });
  }

  async cambiarEstado(id: string, nuevoEstado: string) {
    const premio = await this.findById(id);
    const estadoActual = premio.estado;

    // Validar transiciones de estado
    const transicionesValidas: Record<string, string[]> = {
      PENDIENTE: ['ASIGNADO'],
      ASIGNADO: ['ENTREGADO', 'NO_RECLAMADO'],
      ENTREGADO: [],
      NO_RECLAMADO: [],
    };

    if (!transicionesValidas[estadoActual]?.includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${estadoActual} a ${nuevoEstado}`,
      );
    }

    return this.prisma.premio.update({
      where: { id },
      data: { estado: nuevoEstado as EstadoPremio },
    });
  }

  async asignarGanador(premioId: string, ganadorId: string) {
    return this.prisma.premio.update({
      where: { id: premioId },
      data: {
        ganadorId,
        estado: EstadoPremio.ASIGNADO,
      },
    });
  }

  async delete(id: string) {
    const premio = await this.findById(id);

    if (premio.sorteo.estado !== EstadoSorteo.BORRADOR) {
      throw new BadRequestException('Solo se pueden eliminar premios de sorteos en BORRADOR');
    }

    await this.prisma.premio.delete({
      where: { id },
    });

    return { message: 'Premio eliminado', id };
  }
}
