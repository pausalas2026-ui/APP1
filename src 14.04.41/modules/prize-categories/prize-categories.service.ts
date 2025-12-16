// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// BLOQUE 2 - SUB-BLOQUE 2.1
// Servicio de categorias de premios

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class PrizeCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.prizeCategory.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { nombre: 'asc' },
      ],
      include: {
        _count: {
          select: { premios: true },
        },
      },
    });
  }

  async findActive() {
    return this.prisma.prizeCategory.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { nombre: 'asc' },
      ],
      include: {
        _count: {
          select: { premios: true },
        },
      },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.prizeCategory.findUnique({
      where: { id },
      include: {
        premios: {
          where: {
            status: 'APPROVED',
          },
          take: 10,
        },
        _count: {
          select: { premios: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    return category;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.prizeCategory.findUnique({
      where: { slug },
      include: {
        premios: {
          where: {
            status: 'APPROVED',
          },
          take: 10,
        },
        _count: {
          select: { premios: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    return category;
  }

  async create(data: {
    nombre: string;
    slug: string;
    targetAudience?: string;
    icono?: string;
    sortOrder?: number;
  }) {
    // Verificar slug unico
    const existing = await this.prisma.prizeCategory.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException('Ya existe una categoria con ese slug');
    }

    return this.prisma.prizeCategory.create({
      data: {
        nombre: data.nombre,
        slug: data.slug,
        targetAudience: (data.targetAudience as any) || 'GENERAL',
        icono: data.icono,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  async update(id: string, data: Partial<{
    nombre: string;
    slug: string;
    targetAudience: string;
    icono: string;
    isActive: boolean;
    sortOrder: number;
  }>) {
    await this.findById(id);

    if (data.slug) {
      const existing = await this.prisma.prizeCategory.findUnique({
        where: { slug: data.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe una categoria con ese slug');
      }
    }

    return this.prisma.prizeCategory.update({
      where: { id },
      data: {
        ...data,
        targetAudience: data.targetAudience as any,
      },
    });
  }
}
