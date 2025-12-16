// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Controller de participaciones (SIN dinero)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ParticipacionesService } from './participaciones.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('participaciones')
@UseGuards(JwtAuthGuard)
export class ParticipacionesController {
  constructor(private readonly participacionesService: ParticipacionesService) {}

  // GET /api/v1/participaciones/mis-participaciones
  @Get('mis-participaciones')
  async getMisParticipaciones(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.participacionesService.findByUser(req.user.id, page, limit);
  }

  // GET /api/v1/participaciones/sorteo/:sorteoId
  @Get('sorteo/:sorteoId')
  async getBySorteo(
    @Param('sorteoId') sorteoId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.participacionesService.findBySorteo(sorteoId, page, limit);
  }

  // POST /api/v1/participaciones
  // Registra participacion SIN pago (solo estructura)
  @Post()
  async registrarParticipacion(
    @Request() req: any,
    @Body('sorteoId') sorteoId: string,
  ) {
    return this.participacionesService.registrar(req.user.id, sorteoId);
  }

  // GET /api/v1/participaciones/:id
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.participacionesService.findById(id);
  }
}
