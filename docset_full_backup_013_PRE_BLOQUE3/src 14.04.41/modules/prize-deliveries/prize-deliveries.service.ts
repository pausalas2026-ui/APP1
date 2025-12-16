// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 4, 5, 14, 15
// BLOQUE 2 - SUB-BLOQUE 2.3
// Servicio de entregas de premios
// SIN liberacion de dinero (solo estructura y validaciones)

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { DeliveryStatus } from '@prisma/client';

@Injectable()
export class PrizeDeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const delivery = await this.prisma.prizeDelivery.findUnique({
      where: { id },
      include: {
        premio: true,
      },
    });

    if (!delivery) {
      throw new NotFoundException('Entrega no encontrada');
    }

    return delivery;
  }

  async getStatus(id: string) {
    const delivery = await this.findById(id);

    return {
      id: delivery.id,
      deliveryStatus: delivery.deliveryStatus,
      hasEvidence: (delivery.evidenceImages as any[])?.length > 0,
      moneyReleased: delivery.moneyReleased,
      verifiedAt: delivery.verifiedAt,
    };
  }

  // Entregas donde soy dueno del premio
  async getByOwner(ownerId: string) {
    return this.prisma.prizeDelivery.findMany({
      where: { prizeOwnerId: ownerId },
      include: {
        premio: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Premios que he ganado
  async getByWinner(winnerId: string) {
    return this.prisma.prizeDelivery.findMany({
      where: { winnerId },
      include: {
        premio: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Crear registro de entrega (llamado internamente cuando hay ganador)
  async createDelivery(data: {
    sorteoId: string;
    premioId: string;
    winnerId: string;
    prizeOwnerId: string;
  }) {
    return this.prisma.prizeDelivery.create({
      data: {
        sorteoId: data.sorteoId,
        premioId: data.premioId,
        winnerId: data.winnerId,
        prizeOwnerId: data.prizeOwnerId,
        deliveryStatus: DeliveryStatus.PENDING,
      },
    });
  }

  // Subir evidencia de entrega
  // Referencia: DOCUMENTO 32 seccion 4 - Flujo Escenario B
  // REGLA: ANTES de recibir dinero, el usuario debe subir evidencia
  async submitEvidence(userId: string, deliveryId: string, data: {
    images: string[];
    winnerPhone?: string;
    winnerEmail?: string;
    deliveryDate: Date;
    deliveryNotes?: string;
  }) {
    const delivery = await this.findById(deliveryId);

    // Verificar que es el dueno del premio
    if (delivery.prizeOwnerId !== userId) {
      throw new ForbiddenException('Solo el dueno del premio puede subir evidencia');
    }

    // Verificar estado valido para subir evidencia
    // Referencia: DOCUMENTO 32 seccion 14 - pending -> evidence_submitted
    if (delivery.deliveryStatus !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        'Solo se puede subir evidencia cuando el estado es PENDING'
      );
    }

    // Validacion: Se requiere al menos un dato de contacto del ganador
    // Referencia: DOCUMENTO 32 seccion 16
    if (!data.winnerPhone && !data.winnerEmail) {
      throw new BadRequestException(
        'Se requiere al menos un dato de contacto del ganador (telefono o email)'
      );
    }

    // Validacion: Minimo 1 imagen de evidencia
    if (!data.images || data.images.length < 1) {
      throw new BadRequestException('Debe incluir al menos 1 imagen de evidencia');
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        evidenceImages: data.images,
        winnerContactInfo: {
          phone: data.winnerPhone,
          email: data.winnerEmail,
          deliveryDate: data.deliveryDate,
          notes: data.deliveryNotes,
        },
        deliveryStatus: DeliveryStatus.EVIDENCE_SUBMITTED,
      },
      include: {
        premio: true,
      },
    });
  }

  // NOTA: Los siguientes metodos son estructura para ADMIN (no implementado en BLOQUE 2)
  // Se dejan como placeholder para documentar el flujo completo

  // Marcar en revision (admin)
  async markUnderReview(deliveryId: string, reviewerId: string) {
    const delivery = await this.findById(deliveryId);

    if (delivery.deliveryStatus !== DeliveryStatus.EVIDENCE_SUBMITTED) {
      throw new BadRequestException('Solo se puede revisar entregas con evidencia');
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.UNDER_REVIEW,
        verifiedBy: reviewerId,
      },
    });
  }

  // Verificar entrega (admin)
  // Referencia: DOCUMENTO 32 seccion 14 - under_review -> verified
  async verifyDelivery(deliveryId: string, reviewerId: string, notes?: string) {
    const delivery = await this.findById(deliveryId);

    if (delivery.deliveryStatus !== DeliveryStatus.UNDER_REVIEW) {
      throw new BadRequestException('Solo se puede verificar entregas en revision');
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.VERIFIED,
        verifiedBy: reviewerId,
        verifiedAt: new Date(),
        verificationNotes: notes,
      },
    });
  }

  // Marcar disputa (admin)
  async markDisputed(deliveryId: string, reviewerId: string, notes: string) {
    const delivery = await this.findById(deliveryId);

    if (delivery.deliveryStatus !== DeliveryStatus.UNDER_REVIEW) {
      throw new BadRequestException('Solo se puede disputar entregas en revision');
    }

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        deliveryStatus: DeliveryStatus.DISPUTED,
        verifiedBy: reviewerId,
        verificationNotes: notes,
      },
    });
  }

  // Liberar dinero (admin) - ESTRUCTURA SOLO, NO SE EJECUTA EN BLOQUE 2
  // Referencia: DOCUMENTO 32 seccion 5 - REGLA DE ORO: SIN EVIDENCIA = SIN DINERO
  // Referencia: DOCUMENTO 32 seccion 15.1 - releasePrizeMoney
  async releaseMoney(deliveryId: string, reviewerId: string) {
    const delivery = await this.findById(deliveryId);

    // REGLA INQUEBRANTABLE: Nunca se libera dinero sin evidencia
    if (!delivery.evidenceImages || (delivery.evidenceImages as any[]).length === 0) {
      throw new BadRequestException('NO_EVIDENCE_SUBMITTED - No se puede liberar dinero sin evidencia');
    }

    // Solo se puede liberar si esta verificado
    if (delivery.deliveryStatus !== DeliveryStatus.VERIFIED) {
      throw new BadRequestException('DELIVERY_NOT_VERIFIED - Solo se puede liberar dinero de entregas verificadas');
    }

    // Si ya se libero, error
    if (delivery.moneyReleased) {
      throw new BadRequestException('MONEY_ALREADY_RELEASED - El dinero ya fue liberado');
    }

    // Verificar que el premio NO es donado (si es donado, no hay dinero)
    const premio = delivery.premio;
    if (premio.isDonated) {
      throw new BadRequestException('DONATED_PRIZE_NO_MONEY - Los premios donados no generan compensacion');
    }

    // NOTA: La transferencia real de dinero se implementara en bloque posterior
    // Aqui solo actualizamos el registro

    return this.prisma.prizeDelivery.update({
      where: { id: deliveryId },
      data: {
        moneyReleased: true,
        moneyReleasedAt: new Date(),
        moneyAmount: premio.valorEstimado,
        deliveryStatus: DeliveryStatus.COMPLETED,
      },
    });
  }
}
