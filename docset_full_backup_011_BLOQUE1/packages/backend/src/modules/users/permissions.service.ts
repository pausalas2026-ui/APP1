// DOCUMENTO 03 - ACTORES Y ROLES
// Servicio de permisos

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [
        { modulo: 'asc' },
        { nombre: 'asc' },
      ],
    });
  }

  async findById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permiso no encontrado');
    }

    return permission;
  }

  async findByCode(codigo: string) {
    return this.prisma.permission.findUnique({
      where: { codigo },
    });
  }

  async findByModule(modulo: string) {
    return this.prisma.permission.findMany({
      where: { modulo },
      orderBy: { nombre: 'asc' },
    });
  }

  async create(data: {
    codigo: string;
    nombre: string;
    descripcion?: string;
    modulo: string;
  }) {
    const existing = await this.findByCode(data.codigo);
    if (existing) {
      throw new ConflictException('Ya existe un permiso con ese codigo');
    }

    return this.prisma.permission.create({
      data,
    });
  }

  async createMany(permissions: Array<{
    codigo: string;
    nombre: string;
    descripcion?: string;
    modulo: string;
  }>) {
    return this.prisma.permission.createMany({
      data: permissions,
      skipDuplicates: true,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    await this.prisma.permission.delete({
      where: { id },
    });

    return { message: 'Permiso eliminado', id };
  }
}
