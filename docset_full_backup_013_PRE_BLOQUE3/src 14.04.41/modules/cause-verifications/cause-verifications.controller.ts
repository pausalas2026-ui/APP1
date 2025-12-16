// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6, 13
// BLOQUE 2 - SUB-BLOQUE 2.4
// Controller de verificacion de causas
// Alcance cerrado: Validacion de causas (estado, flags, motivos)
// SIN: flujos de dinero, KYC, automatizaciones, panel admin

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CauseVerificationsService } from './cause-verifications.service';
import { ProponerCausaDto, SubirDocumentosDto } from './dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('causes')
@UseGuards(JwtAuthGuard)
export class CauseVerificationsController {
  constructor(private readonly causeVerificationsService: CauseVerificationsService) {}

  /**
   * POST /api/v1/causes/propose
   * Proponer una causa propia
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post('propose')
  async proponerCausa(
    @Request() req: any,
    @Body() dto: ProponerCausaDto,
  ) {
    return this.causeVerificationsService.proponerCausa(req.user.id, dto);
  }

  /**
   * POST /api/v1/causes/:causaId/verification-docs
   * Subir documentos adicionales de verificacion
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Post(':causaId/verification-docs')
  async subirDocumentos(
    @Request() req: any,
    @Param('causaId') causaId: string,
    @Body() dto: SubirDocumentosDto,
  ) {
    return this.causeVerificationsService.subirDocumentos(req.user.id, causaId, dto);
  }

  /**
   * GET /api/v1/causes/:causaId/verification-status
   * Obtener estado de verificacion de una causa
   * Referencia: DOCUMENTO 32 seccion 13
   */
  @Get(':causaId/verification-status')
  async obtenerEstadoVerificacion(@Param('causaId') causaId: string) {
    return this.causeVerificationsService.obtenerEstadoVerificacion(causaId);
  }

  /**
   * GET /api/v1/causes/my-proposals
   * Obtener causas propuestas por el usuario autenticado
   */
  @Get('my-proposals')
  async obtenerMisCausasPropuestas(@Request() req: any) {
    return this.causeVerificationsService.obtenerMisCausasPropuestas(req.user.id);
  }

  /**
   * GET /api/v1/causes/rejection-reasons
   * Obtener lista de motivos de rechazo disponibles
   * Utilidad para UI
   */
  @Get('rejection-reasons')
  obtenerMotivosRechazo() {
    return this.causeVerificationsService.obtenerMotivosRechazo();
  }
}
