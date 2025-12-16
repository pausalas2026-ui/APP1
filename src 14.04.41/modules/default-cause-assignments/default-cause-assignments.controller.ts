// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 7
// BLOQUE 2 - SUB-BLOQUE 2.7
// Controller de asignacion de causa por defecto
// Endpoints de consulta (la asignacion es interna, no expuesta)

import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { DefaultCauseAssignmentsService } from './default-cause-assignments.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('default-cause-assignments')
@UseGuards(JwtAuthGuard)
export class DefaultCauseAssignmentsController {
  constructor(
    private readonly defaultCauseAssignmentsService: DefaultCauseAssignmentsService,
  ) {}

  /**
   * GET /api/v1/default-cause-assignments/default-cause
   * Obtener la causa por defecto de la plataforma
   */
  @Get('default-cause')
  async getDefaultCause() {
    return this.defaultCauseAssignmentsService.getDefaultCause();
  }

  /**
   * GET /api/v1/default-cause-assignments/sorteo/:sorteoId
   * Obtener asignacion actual de un sorteo
   */
  @Get('sorteo/:sorteoId')
  async getAssignment(@Param('sorteoId') sorteoId: string) {
    return this.defaultCauseAssignmentsService.getCurrentAssignment(sorteoId);
  }

  /**
   * GET /api/v1/default-cause-assignments/sorteo/:sorteoId/history
   * Obtener historial de asignaciones de un sorteo
   */
  @Get('sorteo/:sorteoId/history')
  async getAssignmentHistory(@Param('sorteoId') sorteoId: string) {
    return this.defaultCauseAssignmentsService.getAssignmentHistory(sorteoId);
  }
}
