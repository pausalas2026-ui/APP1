// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6, 13, 14
// BLOQUE ADMIN - Servicio de verificacion de causas
// SIN liberacion de dinero - solo cambios de estado

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { VerificationStatus, EstadoCausa } from '@prisma/client';

@Injectable()
export class AdminCauseVerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /admin/causes/pending-verification
   * Obtener causas pendientes de verificacion
   */
  async getPendingVerifications(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [verificaciones, total] = await Promise.all([
      this.prisma.causeVerification.findMany({
        where: {
          verificationStatus: {
            in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
          },
        },
        skip,
        take: limit,
        include: {
          causa: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.causeVerification.count({
        where: {
          verificationStatus: {
            in: [VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW],
          },
        },
      }),
    ]);

    return {
      data: verificaciones.map((v) => ({
        id: v.id,
        causaId: v.causaId,
        causaNombre: v.causa.nombre,
        causaDescripcion: v.causa.descripcion,
        submittedBy: v.submittedBy,
        verificationStatus: v.verificationStatus,
        foundationName: v.foundationName,
        foundationId: v.foundationId,
        documentsCount: (v.documents as any[])?.length || 0,
        externalLinksCount: (v.externalLinks as any[])?.length || 0,
        createdAt: v.createdAt,
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
   * GET /admin/causes/:causaId/verification-details
   * Obtener detalles completos de verificacion
   */
  async getVerificationDetails(causaId: string) {
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: { causaId },
      include: {
        causa: true,
      },
    });

    if (!verificacion) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    return {
      id: verificacion.id,
      causa: {
        id: verificacion.causa.id,
        nombre: verificacion.causa.nombre,
        descripcion: verificacion.causa.descripcion,
        imagenUrl: verificacion.causa.imagenUrl,
        sitioWeb: verificacion.causa.sitioWeb,
        estado: verificacion.causa.estado,
        verificada: verificacion.causa.verificada,
      },
      submittedBy: verificacion.submittedBy,
      verificationStatus: verificacion.verificationStatus,
      foundationName: verificacion.foundationName,
      foundationId: verificacion.foundationId,
      documents: verificacion.documents,
      externalLinks: verificacion.externalLinks,
      reviewerId: verificacion.reviewerId,
      reviewerNotes: verificacion.reviewerNotes,
      reviewedAt: verificacion.reviewedAt,
      rejectionReason: verificacion.rejectionReason,
      createdAt: verificacion.createdAt,
      updatedAt: verificacion.updatedAt,
    };
  }

  /**
   * POST /admin/causes/:causaId/start-review
   * Marcar causa como EN_REVISION
   * Referencia: DOCUMENTO 32 seccion 14 - pending -> under_review
   */
  async startReview(causaId: string, reviewerId: string) {
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: { causaId },
    });

    if (!verificacion) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    if (verificacion.verificationStatus !== VerificationStatus.PENDING) {
      throw new BadRequestException(
        'Solo se puede iniciar revision de causas en estado PENDING'
      );
    }

    return this.prisma.causeVerification.update({
      where: { id: verificacion.id },
      data: {
        verificationStatus: VerificationStatus.UNDER_REVIEW,
        reviewerId,
      },
      include: {
        causa: true,
      },
    });
  }

  /**
   * POST /admin/causes/:causaId/verify
   * Aprobar causa
   * Referencia: DOCUMENTO 32 seccion 14 - under_review -> approved
   * REGLA: Solo despues de aprobar, la causa puede recibir donaciones
   */
  async verifyCause(causaId: string, reviewerId: string, notes?: string) {
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: { causaId },
    });

    if (!verificacion) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    if (verificacion.verificationStatus !== VerificationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Solo se puede verificar causas en estado UNDER_REVIEW'
      );
    }

    // Actualizar verificacion y causa en transaccion
    const [verificacionActualizada] = await this.prisma.$transaction([
      this.prisma.causeVerification.update({
        where: { id: verificacion.id },
        data: {
          verificationStatus: VerificationStatus.APPROVED,
          reviewerId,
          reviewerNotes: notes,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.causa.update({
        where: { id: causaId },
        data: {
          estado: EstadoCausa.ACTIVA,
          verificada: true,
        },
      }),
    ]);

    return {
      verificacionId: verificacionActualizada.id,
      causaId,
      nuevoEstado: VerificationStatus.APPROVED,
      mensaje: 'Causa verificada y activada exitosamente',
      reviewedAt: verificacionActualizada.reviewedAt,
    };
  }

  /**
   * POST /admin/causes/:causaId/reject
   * Rechazar causa
   * Referencia: DOCUMENTO 32 seccion 14 - under_review -> rejected
   * REGLA: No se libera dinero a causas rechazadas
   */
  async rejectCause(
    causaId: string,
    reviewerId: string,
    rejectionReason: string,
    notes?: string,
  ) {
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: { causaId },
    });

    if (!verificacion) {
      throw new NotFoundException('Verificacion no encontrada');
    }

    if (verificacion.verificationStatus !== VerificationStatus.UNDER_REVIEW) {
      throw new BadRequestException(
        'Solo se puede rechazar causas en estado UNDER_REVIEW'
      );
    }

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new BadRequestException(
        'Debe proporcionar un motivo de rechazo (minimo 10 caracteres)'
      );
    }

    // Actualizar verificacion y causa en transaccion
    const [verificacionActualizada] = await this.prisma.$transaction([
      this.prisma.causeVerification.update({
        where: { id: verificacion.id },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          reviewerId,
          reviewerNotes: notes,
          rejectionReason,
          reviewedAt: new Date(),
        },
      }),
      this.prisma.causa.update({
        where: { id: causaId },
        data: {
          estado: EstadoCausa.CANCELADA,
          verificada: false,
        },
      }),
    ]);

    return {
      verificacionId: verificacionActualizada.id,
      causaId,
      nuevoEstado: VerificationStatus.REJECTED,
      motivoRechazo: rejectionReason,
      mensaje: 'Causa rechazada',
      reviewedAt: verificacionActualizada.reviewedAt,
    };
  }

  /**
   * GET /admin/causes/stats
   * Estadisticas de verificacion
   */
  async getStats() {
    const [pending, underReview, approved, rejected] = await Promise.all([
      this.prisma.causeVerification.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      this.prisma.causeVerification.count({
        where: { verificationStatus: VerificationStatus.UNDER_REVIEW },
      }),
      this.prisma.causeVerification.count({
        where: { verificationStatus: VerificationStatus.APPROVED },
      }),
      this.prisma.causeVerification.count({
        where: { verificationStatus: VerificationStatus.REJECTED },
      }),
    ]);

    return {
      pending,
      underReview,
      approved,
      rejected,
      total: pending + underReview + approved + rejected,
    };
  }
}
