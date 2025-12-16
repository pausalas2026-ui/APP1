// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 3.2, 14, 16
// BLOQUE 2 - SUB-BLOQUE 2.2
// Servicio de premios de usuario

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoPremioExtendido, PrizeSource } from '@prisma/client';

@Injectable()
export class UserPrizesService {
  constructor(private readonly prisma: PrismaService) {}

  // Catalogo de premios aprobados (plataforma + usuarios)
  async getCatalog(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [premios, total] = await Promise.all([
      this.prisma.premioExtendido.findMany({
        where: {
          status: EstadoPremioExtendido.APPROVED,
        },
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.premioExtendido.count({
        where: { status: EstadoPremioExtendido.APPROVED },
      }),
    ]);

    return {
      data: premios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Catalogo por categoria
  async getCatalogByCategory(categorySlug: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const category = await this.prisma.prizeCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    const [premios, total] = await Promise.all([
      this.prisma.premioExtendido.findMany({
        where: {
          status: EstadoPremioExtendido.APPROVED,
          categoryId: category.id,
        },
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.premioExtendido.count({
        where: {
          status: EstadoPremioExtendido.APPROVED,
          categoryId: category.id,
        },
      }),
    ]);

    return {
      data: premios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        category: {
          id: category.id,
          nombre: category.nombre,
          slug: category.slug,
        },
      },
    };
  }

  // Premios del usuario
  async getByCreator(creatorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [premios, total] = await Promise.all([
      this.prisma.premioExtendido.findMany({
        where: { creatorId },
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.premioExtendido.count({
        where: { creatorId },
      }),
    ]);

    return {
      data: premios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const premio = await this.prisma.premioExtendido.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!premio) {
      throw new NotFoundException('Premio no encontrado');
    }

    return premio;
  }

  // Crear premio de usuario
  // Referencia: DOCUMENTO 32 seccion 3.2 - Campos obligatorios
  async createUserPrize(creatorId: string, data: {
    nombre: string;
    descripcion: string;
    valorEstimado: number;
    condition: string;
    deliveredBy: string;
    deliveryConditions: string;
    isDonated: boolean;
    images: string[];
    categoryId?: string;
  }) {
    // Validacion segun DOCUMENTO 32 seccion 16
    this.validateUserPrizeData(data);

    return this.prisma.premioExtendido.create({
      data: {
        creatorId,
        source: PrizeSource.USER,
        nombre: data.nombre,
        descripcion: data.descripcion,
        valorEstimado: data.valorEstimado,
        condition: data.condition as any,
        deliveredBy: data.deliveredBy as any,
        deliveryConditions: data.deliveryConditions,
        isDonated: data.isDonated,
        images: data.images,
        categoryId: data.categoryId,
        status: EstadoPremioExtendido.DRAFT,
      },
      include: {
        category: true,
      },
    });
  }

  // Actualizar premio de usuario
  async updateUserPrize(userId: string, prizeId: string, data: Partial<{
    nombre: string;
    descripcion: string;
    valorEstimado: number;
    condition: string;
    deliveredBy: string;
    deliveryConditions: string;
    isDonated: boolean;
    images: string[];
    categoryId: string;
  }>) {
    const premio = await this.findById(prizeId);

    // Verificar propiedad
    if (premio.creatorId !== userId) {
      throw new ForbiddenException('No tienes permiso para editar este premio');
    }

    // Solo se puede editar en DRAFT o REJECTED
    // Referencia: DOCUMENTO 32 seccion 14 - Estados
    if (premio.status !== EstadoPremioExtendido.DRAFT && 
        premio.status !== EstadoPremioExtendido.REJECTED) {
      throw new BadRequestException(
        'Solo se pueden editar premios en estado DRAFT o REJECTED'
      );
    }

    return this.prisma.premioExtendido.update({
      where: { id: prizeId },
      data: {
        ...data,
        condition: data.condition as any,
        deliveredBy: data.deliveredBy as any,
        // Si fue rechazado y se edita, volver a DRAFT
        status: EstadoPremioExtendido.DRAFT,
      },
      include: {
        category: true,
      },
    });
  }

  // Enviar premio para revision
  // Referencia: DOCUMENTO 32 seccion 14 - draft -> pending_review
  async submitForReview(userId: string, prizeId: string) {
    const premio = await this.findById(prizeId);

    // Verificar propiedad
    if (premio.creatorId !== userId) {
      throw new ForbiddenException('No tienes permiso para enviar este premio');
    }

    // Solo se puede enviar desde DRAFT
    if (premio.status !== EstadoPremioExtendido.DRAFT) {
      throw new BadRequestException(
        'Solo se pueden enviar premios en estado DRAFT'
      );
    }

    // Validar campos obligatorios antes de enviar
    this.validateUserPrizeData({
      nombre: premio.nombre,
      descripcion: premio.descripcion,
      valorEstimado: Number(premio.valorEstimado),
      condition: premio.condition,
      deliveredBy: premio.deliveredBy,
      deliveryConditions: premio.deliveryConditions || '',
      isDonated: premio.isDonated,
      images: premio.images as string[],
    });

    return this.prisma.premioExtendido.update({
      where: { id: prizeId },
      data: {
        status: EstadoPremioExtendido.PENDING_REVIEW,
      },
      include: {
        category: true,
      },
    });
  }

  // Validacion segun DOCUMENTO 32 seccion 16
  private validateUserPrizeData(data: {
    nombre: string;
    descripcion: string;
    valorEstimado: number;
    condition: string;
    deliveredBy: string;
    deliveryConditions: string;
    isDonated: boolean;
    images: string[];
  }) {
    const errors: string[] = [];

    // nombre: min 3, max 200
    if (!data.nombre || data.nombre.length < 3 || data.nombre.length > 200) {
      errors.push('El nombre debe tener entre 3 y 200 caracteres');
    }

    // descripcion: min 10, max 2000
    if (!data.descripcion || data.descripcion.length < 10 || data.descripcion.length > 2000) {
      errors.push('La descripcion debe tener entre 10 y 2000 caracteres');
    }

    // valorEstimado: positive, max 100000
    if (!data.valorEstimado || data.valorEstimado <= 0 || data.valorEstimado > 100000) {
      errors.push('El valor estimado debe ser positivo y menor a 100000');
    }

    // condition: new o used
    if (!['NEW', 'USED'].includes(data.condition)) {
      errors.push('La condicion debe ser NEW o USED');
    }

    // deliveredBy: user o platform
    if (!['USER', 'PLATFORM'].includes(data.deliveredBy)) {
      errors.push('deliveredBy debe ser USER o PLATFORM');
    }

    // deliveryConditions: min 10, max 1000
    if (!data.deliveryConditions || data.deliveryConditions.length < 10 || data.deliveryConditions.length > 1000) {
      errors.push('Las condiciones de entrega deben tener entre 10 y 1000 caracteres');
    }

    // images: min 1, max 10
    if (!data.images || !Array.isArray(data.images) || data.images.length < 1 || data.images.length > 10) {
      errors.push('Debe incluir entre 1 y 10 imagenes');
    }

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }
  }
}
