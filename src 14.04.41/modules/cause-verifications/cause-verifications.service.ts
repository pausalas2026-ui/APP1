// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6, 14
// BLOQUE 2 - SUB-BLOQUE 2.4
// Servicio de verificacion de causas
// Alcance cerrado: Validacion de causas (estado, flags, motivos)
// SIN: flujos de dinero, KYC, automatizaciones, panel admin

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';

import {
  EstadoVerificacion,
  obtenerFlagsVerificacion,
  FlagsVerificacion,
  MotivoRechazo,
  DESCRIPCION_MOTIVOS_RECHAZO,
} from './cause-verifications.constants';

import {
  validarPropuestaCausa,
  validarDocumentosVerificacion,
  validarPuedeAgregarDocumentos,
} from './cause-verifications.validations';

import { ProponerCausaDto } from './dto/proponer-causa.dto';
import { SubirDocumentosDto } from './dto/subir-documentos.dto';

@Injectable()
export class CauseVerificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Proponer causa propia
   * Referencia: DOCUMENTO 32 seccion 6.2
   * Crea la causa en estado PENDIENTE y el registro de verificacion
   */
  async proponerCausa(submitterId: string, data: ProponerCausaDto) {
    // Validar datos de entrada
    const validacion = validarPropuestaCausa({
      nombre: data.nombre,
      descripcion: data.descripcion,
      imagenUrl: data.imagenUrl,
      sitioWeb: data.sitioWeb,
    });

    if (!validacion.valido) {
      throw new BadRequestException(validacion.errores.join('. '));
    }

    // Crear la causa en estado PENDIENTE
    const causa = await this.prisma.causa.create({
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion,
        imagenUrl: data.imagenUrl,
        sitioWeb: data.sitioWeb,
        estado: 'PENDIENTE',
        verificada: false,
      },
    });

    // Crear registro de verificacion
    const verificacion = await this.prisma.causeVerification.create({
      data: {
        causaId: causa.id,
        submittedBy: submitterId,
        verificationStatus: 'PENDING',
        foundationName: data.foundationName,
        foundationId: data.foundationId,
        documents: data.documents || [],
        externalLinks: data.externalLinks || [],
      },
    });

    // Obtener flags de verificacion
    const flags = obtenerFlagsVerificacion({
      documents: data.documents,
      externalLinks: data.externalLinks,
      foundationName: data.foundationName,
      foundationId: data.foundationId,
      imagenUrl: data.imagenUrl,
    });

    return {
      causa: {
        id: causa.id,
        nombre: causa.nombre,
        descripcion: causa.descripcion,
        estado: causa.estado,
        verificada: causa.verificada,
      },
      verificacion: {
        id: verificacion.id,
        estado: EstadoVerificacion.PENDIENTE,
        flags,
      },
      mensaje: 'Causa propuesta exitosamente. Estado: PENDIENTE de verificacion.',
    };
  }

  /**
   * Subir documentos adicionales de verificacion
   * Solo permitido cuando el estado es PENDIENTE
   */
  async subirDocumentos(submitterId: string, causaId: string, data: SubirDocumentosDto) {
    // Buscar verificacion existente
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: {
        causaId,
        submittedBy: submitterId,
      },
    });

    if (!verificacion) {
      throw new NotFoundException('No se encontro verificacion para esta causa');
    }

    // Validar que puede agregar documentos
    const estadoActual = this.mapearEstadoPrisma(verificacion.verificationStatus);
    const validacionEstado = validarPuedeAgregarDocumentos(estadoActual);

    if (!validacionEstado.valido) {
      throw new BadRequestException(validacionEstado.errores.join('. '));
    }

    // Validar URLs de documentos
    const validacionDocs = validarDocumentosVerificacion({
      documents: data.documents,
      externalLinks: data.externalLinks,
    });

    if (!validacionDocs.valido) {
      throw new BadRequestException(validacionDocs.errores.join('. '));
    }

    // Agregar documentos a los existentes
    const existingDocs = (verificacion.documents as string[]) || [];
    const existingLinks = (verificacion.externalLinks as string[]) || [];

    const verificacionActualizada = await this.prisma.causeVerification.update({
      where: { id: verificacion.id },
      data: {
        documents: [...existingDocs, ...data.documents],
        externalLinks: data.externalLinks
          ? [...existingLinks, ...data.externalLinks]
          : existingLinks,
        foundationName: data.foundationName || verificacion.foundationName,
        foundationId: data.foundationId || verificacion.foundationId,
      },
    });

    // Obtener flags actualizados
    const flags = obtenerFlagsVerificacion({
      documents: verificacionActualizada.documents as string[],
      externalLinks: verificacionActualizada.externalLinks as string[],
      foundationName: verificacionActualizada.foundationName,
      foundationId: verificacionActualizada.foundationId,
    });

    return {
      verificacionId: verificacionActualizada.id,
      causaId: verificacionActualizada.causaId,
      documentosAgregados: data.documents.length,
      totalDocumentos: (verificacionActualizada.documents as string[]).length,
      flags,
      mensaje: 'Documentos agregados exitosamente.',
    };
  }

  /**
   * Obtener estado de verificacion de una causa
   */
  async obtenerEstadoVerificacion(causaId: string) {
    const verificacion = await this.prisma.causeVerification.findFirst({
      where: { causaId },
      include: {
        causa: true,
      },
    });

    if (!verificacion) {
      throw new NotFoundException('No se encontro verificacion para esta causa');
    }

    const estadoInterno = this.mapearEstadoPrisma(verificacion.verificationStatus);
    const flags = obtenerFlagsVerificacion({
      documents: verificacion.documents as string[],
      externalLinks: verificacion.externalLinks as string[],
      foundationName: verificacion.foundationName,
      foundationId: verificacion.foundationId,
      imagenUrl: verificacion.causa.imagenUrl,
    });

    return {
      causaId: verificacion.causaId,
      causaNombre: verificacion.causa.nombre,
      causaEstado: verificacion.causa.estado,
      verificacionEstado: estadoInterno,
      verificada: verificacion.causa.verificada,
      flags,
      motivoRechazo: verificacion.rejectionReason
        ? {
            codigo: verificacion.rejectionReason,
            descripcion: DESCRIPCION_MOTIVOS_RECHAZO[verificacion.rejectionReason as MotivoRechazo] || verificacion.rejectionReason,
          }
        : null,
      fechaRevision: verificacion.reviewedAt,
      creadoEn: verificacion.createdAt,
    };
  }

  /**
   * Obtener causas propuestas por un usuario
   */
  async obtenerMisCausasPropuestas(submitterId: string) {
    const verificaciones = await this.prisma.causeVerification.findMany({
      where: { submittedBy: submitterId },
      include: {
        causa: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return verificaciones.map((v) => {
      const flags = obtenerFlagsVerificacion({
        documents: v.documents as string[],
        externalLinks: v.externalLinks as string[],
        foundationName: v.foundationName,
        foundationId: v.foundationId,
        imagenUrl: v.causa.imagenUrl,
      });

      return {
        causaId: v.causaId,
        causaNombre: v.causa.nombre,
        causaEstado: v.causa.estado,
        verificacionEstado: this.mapearEstadoPrisma(v.verificationStatus),
        verificada: v.causa.verificada,
        flags,
        motivoRechazo: v.rejectionReason,
        creadoEn: v.createdAt,
      };
    });
  }

  /**
   * Obtener motivos de rechazo disponibles
   * Utilidad para mostrar opciones en UI
   */
  obtenerMotivosRechazo() {
    return Object.entries(DESCRIPCION_MOTIVOS_RECHAZO).map(([codigo, descripcion]) => ({
      codigo,
      descripcion,
    }));
  }

  /**
   * Mapear estado de Prisma a estado interno
   */
  private mapearEstadoPrisma(estadoPrisma: string): EstadoVerificacion {
    const mapeo: Record<string, EstadoVerificacion> = {
      PENDING: EstadoVerificacion.PENDIENTE,
      UNDER_REVIEW: EstadoVerificacion.EN_REVISION,
      APPROVED: EstadoVerificacion.APROBADA,
      REJECTED: EstadoVerificacion.RECHAZADA,
    };
    return mapeo[estadoPrisma] || EstadoVerificacion.PENDIENTE;
  }
}
