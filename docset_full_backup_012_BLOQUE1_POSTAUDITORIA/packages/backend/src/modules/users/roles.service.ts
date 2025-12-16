// DOCUMENTO 03 - ACTORES Y ROLES
// Servicio de roles

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permisos: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rol no encontrado');
    }

    return role;
  }

  async findByName(nombre: string) {
    return this.prisma.role.findUnique({
      where: { nombre },
    });
  }

  async create(data: { nombre: string; descripcion?: string }) {
    const existing = await this.findByName(data.nombre);
    if (existing) {
      throw new ConflictException('Ya existe un rol con ese nombre');
    }

    return this.prisma.role.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
      },
    });
  }

  async update(id: string, data: { nombre?: string; descripcion?: string }) {
    await this.findById(id);

    if (data.nombre) {
      const existing = await this.findByName(data.nombre);
      if (existing && existing.id !== id) {
        throw new ConflictException('Ya existe un rol con ese nombre');
      }
    }

    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    const role = await this.findById(id);

    if (role.isDefault) {
      throw new ConflictException('No se puede eliminar el rol por defecto');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: 'Rol eliminado', id };
  }

  async assignPermissions(roleId: string, permissionIds: string[]) {
    await this.findById(roleId);

    // Eliminar permisos anteriores
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Asignar nuevos permisos
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    }

    return this.findById(roleId);
  }
}
