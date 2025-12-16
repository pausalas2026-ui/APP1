// DOCUMENTO 03 - ACTORES Y ROLES
// Servicio de usuarios

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import * as bcrypt from 'bcrypt';

interface CreateUserData {
  email: string;
  passwordHash: string;
  nombre: string;
  apellidos?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        include: {
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users.map((user) => this.sanitizeUser(user)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permisos: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  async create(data: CreateUserData) {
    // Obtener rol por defecto (usuario)
    let defaultRole = await this.prisma.role.findFirst({
      where: { isDefault: true },
    });

    // Si no existe rol por defecto, crear uno
    if (!defaultRole) {
      defaultRole = await this.prisma.role.create({
        data: {
          nombre: 'usuario',
          descripcion: 'Usuario estandar',
          isDefault: true,
        },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        nombre: data.nombre,
        apellidos: data.apellidos,
        roleId: defaultRole.id,
      },
      include: {
        role: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async createWithRole(data: {
    email: string;
    password: string;
    nombre: string;
    apellidos?: string;
    roleId?: string;
  }) {
    const passwordHash = await bcrypt.hash(data.password, 10);

    let roleId = data.roleId;

    if (!roleId) {
      const defaultRole = await this.prisma.role.findFirst({
        where: { isDefault: true },
      });
      if (defaultRole) {
        roleId = defaultRole.id;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        nombre: data.nombre,
        apellidos: data.apellidos,
        roleId: roleId!,
      },
      include: {
        role: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async update(id: string, data: Partial<{
    nombre: string;
    apellidos: string;
    telefono: string;
    avatarUrl: string;
    roleId: string;
  }>) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Usuario desactivado', id: user.id };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
