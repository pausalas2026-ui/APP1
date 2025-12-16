// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 4, 5, 13, 14, 15
// BLOQUE ADMIN - Servicio de verificacion de entregas de premios
// REGLA DE ORO: SIN EVIDENCIA = SIN DINERO
// SIN liberacion real de dinero - solo cambios de estado

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class AdminPrizeDeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /admin/prize-deliveries/pending-review
   * Obtener entregas con evidencia pendiente de revision
   */
  async getPendingReview(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [entregas, total] = await Promise.all([
      this.prisma.prizeDelivery.findMany({
        where: {
          deliveryStatus: {
            in: [DeliveryStatus.EVIDENCE_SUBMITTED, DeliveryStatus.UNDER_REVIEW],
          },
        },
        skip,
        take: limit,
        include: {
          premio: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.prizeDelivery.count({
        where: {
          deliveryStatus: {
            in: [DeliveryStatus.EVIDENCE_SUBMITTED, DeliveryStatus.UNDER_REVIEW],
          },
        },
      }),
    ]);

    return {
      data: entregas.map((e) => ({
        id: e.id,
        sorteoId: e.sorteoId,
        premioId: e.premioId,
        premioNombre: e.premio.nombre,
        winnerId: e.winnerId,
        prizeOwnerId: e.prizeOwnerId,
        deliveryStatus: e.deliveryStatus,
        evidenceImagesCount: (e.evidenceImages as any[])?.length || 0,
        hasContactInfo: !!e.winnerContactInfo,
        createdAt: e.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /admin/prize-deliveries/:id/details
   * Obtener detalles completos de entrega
   */
  async getDeliveryDetails(deliveryId: string) {
    const entrega = await this.prisma.prizeDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        premio: true,
      },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    return {
      id: entrega.id,
      sorteoId: entrega.sorteoId,
      premio: {
        id: entrega.premio.id,
        nombre: entrega.premio.nombre,
        descripcion: entrega.premio.descripcion,
        valorEstimado: entrega.premio.valorEstimado,
        isDonated: entrega.premio.isDonated,
      },
      winnerId: entrega.winnerId,
      prizeOwnerId: entrega.prizeOwnerId,
      deliveryStatus: entrega.deliveryStatus,
      evidenceImages: entrega.evidenceImages,
      winnerContactInfo: entrega.winnerContactInfo,
      verificationNotes: entrega.verificationNotes,
      verifiedBy: entrega.verifiedBy,
      verifiedAt: entrega.verifiedAt,
      moneyReleased: entrega.moneyReleased,
      moneyReleasedAt: entrega.moneyReleasedAt,
      moneyAmount: entrega.moneyAmount,
      createdAt: entrega.createdAt,
      updatedAt: entrega.updatedAt,
    };
  }

  /**
   * POST /admin/prize-deliveries/:id/start-review
   * Marcar entrega como EN_REVISION
   * Referencia: DOCUMENTO 32 seccion 14 - evidence_submitted -> under_review
   */
  async startReview(deliveryId: string, reviewerId: string) {
    const entrega = await this.prisma.prizeDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (entrega.deliveryStatus !== DeliveryStatus.EVIDENCE_SUBMITTED) {
      throw new BadRequestException(
        'Solo se puede iniciar revision de entregas con estado EVIDENCE_SUBMITTED'
      );
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        verifiedBy: reviewerId,
      },
      include: {
        premio: true,
      },
    });
  }

  /**
   * POST /admin/prize-deliveries/:id/verify
   * Verificar entrega (aprobar)
   * Referencia: DOCUMENTO 32 seccion 14 - under_review -> verified
   * NOTA: NO libera dinero automaticamente
   */
  async verifyDelivery(deliveryId: string, reviewerId: string, notes?: string) {
    const entrega = await this.prisma.prizeDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (entrega.deliveryStatus !== DeliveryStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Solo se puede verificar entregas en estado UNDER_REVIEW'
      );
    }

    // REGLA DOC32: Verificar que tenga evidencia
    if (!entrega.evidenceImages || (entrega.evidenceImages as any[]).length === 0) {
      throw new BadRequestException(
        'NO_EVIDENCE_SUBMITTED - No se puede verificar sin evidencia'
      );
    }

    const entregaActualizada = await this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.VERIFIED,
        verifiedBy: reviewerId,
        verifiedAt: new Date(),
        verificationNotes: notes,
      },
      include: {
        premio: true,
      },
    });

    return {
      id: entregaActualizada.id,
      deliveryStatus: entregaActualizada.deliveryStatus,
      mensaje: 'Entrega verificada exitosamente',
      verifiedAt: entregaActualizada.verifiedAt,
      // NOTA: La liberacion de dinero requiere accion separada
      siguientePaso: entregaActualizada.premio.isDonated
        ? 'Premio donado - no requiere liberacion de dinero'
        : 'Pendiente liberacion de dinero (requiere accion admin/release-money)',
    };
  }

  /**
   * POST /admin/prize-deliveries/:id/dispute
   * Marcar entrega como disputada
   * Referencia: DOCUMENTO 32 seccion 14 - under_review -> disputed
   */
  async markDisputed(deliveryId: string, reviewerId: string, reason: string) {
    const entrega = await this.prisma.prizeDelivery.findUnique({
      where: { id: deliveryId },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (entrega.deliveryStatus !== DeliveryStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Solo se puede disputar entregas en estado UNDER_REVIEW'
      );
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException(
        'Debe proporcionar un motivo de disputa (minimo 10 caracteres)'
      );
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.DISPUTED,
        verifiedBy: reviewerId,
        verificationNotes: reason,
      },
      include: {
        premio: true,
      },
    });
  }

  /**
   * POST /admin/prize-deliveries/:id/release-money
   * Marcar dinero como liberado (estructura, NO transfiere dinero real)
   * Referencia: DOCUMENTO 32 seccion 5, 15.1
   * REGLA DE ORO: SIN EVIDENCIA = SIN DINERO
   */
  async markMoneyReleased(deliveryId: string, reviewerId: string) {
    const entrega = await this.prisma.prizeDelivery.findUnique({
      where: { id: deliveryId },
      include: { premio: true },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    // REGLA DOC32 15.1: Verificaciones obligatorias
    if (!entrega.evidenceImages || (entrega.evidenceImages as any[]).length === 0) {
      throw new BadRequestException('NO_EVIDENCE_SUBMITTED');
    }

    if (entrega.deliveryStatus !== DeliveryStatus.VERIFIED) {
      throw new BadRequestException('DELIVERY_NOT_VERIFIED');
    }

    if (entrega.moneyReleased) {
      throw new BadRequestException('MONEY_ALREADY_RELEASED');
    }

    if (entrega.premio.isDonated) {
      throw new BadRequestException('DONATED_PRIZE_NO_MONEY');
    }

    // NOTA: Solo marca como liberado, NO transfiere dinero real
    // La transferencia real se implementara en modulo financiero
    const entregaActualizada = await this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        moneyReleased: true,
        moneyReleasedAt: new Date(),
        moneyAmount: entrega.premio.valorEstimado,
        deliveryStatus: DeliveryStatus.COMPLETED,
      },
    });

    return {
      id: entregaActualizada.id,
      deliveryStatus: entregaActualizada.deliveryStatus,
      moneyReleased: entregaActualizada.moneyReleased,
      moneyReleasedAt: entregaActualizada.moneyReleasedAt,
      moneyAmount: entregaActualizada.moneyAmount,
      mensaje: 'Dinero marcado como liberado (pendiente transferencia real)',
      // NOTA: Implementacion real de transferencia en modulo financiero
    };
  }

  /**
   * GET /admin/prize-deliveries/stats
   * Estadisticas de entregas
   */
  async getStats() {
    const [pending, evidenceSubmitted, underReview, verified, disputed, completed] =
      await Promise.all([
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.PENDING },
        }),
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED },
        }),
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.UNDER_REVIEW },
        }),
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.VERIFIED },
        }),
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.DISPUTED },
        }),
        this.prisma.prizeDelivery.count({
          where: { deliveryStatus: DeliveryStatus.COMPLETED },
        }),
      ]);

    return {
      pending,
      evidenceSubmitted,
      underReview,
      verified,
      disputed,
      completed,
      total: pending + evidenceSubmitted + underReview + verified + disputed + completed,
      pendingReview: evidenceSubmitted + underReview,
    };
  }
}
