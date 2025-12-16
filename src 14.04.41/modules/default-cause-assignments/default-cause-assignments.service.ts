// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 7, 15.2
// BLOQUE 2 - SUB-BLOQUE 2.7
// Servicio de asignacion de causa por defecto
// Regla: Si el usuario no elige causa, la plataforma asigna una por defecto

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AssignmentReason } from '@prisma/client';
import { RazonAsignacion, DEFAULT_CAUSE_ENV_KEY } from './default-cause-assignments.constants';

@Injectable()
export class DefaultCauseAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtener la causa por defecto de la plataforma
   * Referencia: DOCUMENTO 32 seccion 7 - causa base por defecto
   */
  async getDefaultCause() {
    const defaultCauseId = process.env[DEFAULT_CAUSE_ENV_KEY];

    if (!defaultCauseId) {
      throw new BadRequestException(
        'No hay causa por defecto configurada en la plataforma'
      );
    }

    const causa = await this.prisma.causa.findUnique({
      where: { id: defaultCauseId },
    });

    if (!causa) {
      throw new NotFoundException('La causa por defecto configurada no existe');
    }

    if (causa.estado !== 'ACTIVA' || !causa.verificada) {
      throw new BadRequestException('La causa por defecto no esta activa o verificada');
    }

    return causa;
  }

  /**
   * Asegurar que un sorteo tenga causa asignada
   * Referencia: DOCUMENTO 32 seccion 7 y 15.2 - ensureCauseAssigned
   * 
   * REGLA: Si el usuario no elige causa, no crea una, o no sabe cual usar
   *        → La plataforma asigna una causa base por defecto
   */
  async ensureCauseAssigned(sorteoId: string): Promise<string> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: { causa: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Si tiene causa y esta activa/verificada, retornar
    if (sorteo.causaId && sorteo.causa) {
      if (sorteo.causa.estado === 'ACTIVA' && sorteo.causa.verificada) {
        return sorteo.causa.id;
      }
    }

    // Determinar razon de asignacion
    let reason: AssignmentReason;
    if (!sorteo.causaId) {
      reason = AssignmentReason.USER_DID_NOT_SELECT;
    } else if (sorteo.causa && !sorteo.causa.verificada) {
      reason = AssignmentReason.CAUSE_REJECTED;
    } else {
      reason = AssignmentReason.CAUSE_INACTIVE;
    }

    // Obtener causa por defecto
    const defaultCause = await this.getDefaultCause();

    // Crear registro de asignacion
    await this.prisma.defaultCauseAssignment.create({
      data: {
        sorteoId,
        originalCauseId: sorteo.causaId || null,
        assignedCauseId: defaultCause.id,
        assignmentReason: reason,
      },
    });

    // Actualizar sorteo con la causa por defecto
    await this.prisma.sorteo.update({
      where: { id: sorteoId },
      data: { causaId: defaultCause.id },
    });

    return defaultCause.id;
  }

  /**
   * Obtener historial de asignaciones de un sorteo
   */
  async getAssignmentHistory(sorteoId: string) {
    return this.prisma.defaultCauseAssignment.findMany({
      where: { sorteoId },
      orderBy: { assignedAt: 'desc' },
    });
  }

  /**
   * Verificar si un sorteo tiene asignacion por defecto
   */
  async hasDefaultAssignment(sorteoId: string): Promise<boolean> {
    const count = await this.prisma.defaultCauseAssignment.count({
      where: { sorteoId },
    });
    return count > 0;
  }

  /**
   * Obtener asignacion actual de un sorteo
   */
  async getCurrentAssignment(sorteoId: string) {
    const assignment = await this.prisma.defaultCauseAssignment.findFirst({
      where: { sorteoId },
      orderBy: { assignedAt: 'desc' },
    });

    if (!assignment) {
      return null;
    }

    return {
      id: assignment.id,
      sorteoId: assignment.sorteoId,
      originalCauseId: assignment.originalCauseId,
      assignedCauseId: assignment.assignedCauseId,
      reason: assignment.assignmentReason,
      assignedAt: assignment.assignedAt,
    };
  }
}
