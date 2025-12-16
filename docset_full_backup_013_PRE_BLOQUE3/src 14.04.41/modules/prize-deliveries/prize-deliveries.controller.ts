// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 4, 5, 13
// BLOQUE 2 - SUB-BLOQUE 2.3
// Controller de entregas de premios
// SIN liberacion de dinero (estructura para futuro)

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrizeDeliveriesService } from './prize-deliveries.service';
import { SubmitEvidenceDto } from './dto/submit-evidence.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('prize-deliveries')
@UseGuards(JwtAuthGuard)
export class PrizeDeliveriesController {
  constructor(private readonly prizeDeliveriesService: PrizeDeliveriesService) {}

  // GET /api/v1/prize-deliveries/:id/status (protegido)
  // Referencia: DOCUMENTO 32 seccion 13
  @Get(':id/status')
  async getStatus(@Param('id') id: string) {
    return this.prizeDeliveriesService.getStatus(id);
  }

  // GET /api/v1/prize-deliveries/my-deliveries (protegido)
  // Entregas donde soy el dueno del premio
  @Get('my-deliveries')
  async getMyDeliveries(@Request() req: any) {
    return this.prizeDeliveriesService.getByOwner(req.user.id);
  }

  // GET /api/v1/prize-deliveries/my-winnings (protegido)
  // Premios que he ganado
  @Get('my-winnings')
  async getMyWinnings(@Request() req: any) {
    return this.prizeDeliveriesService.getByWinner(req.user.id);
  }

  // POST /api/v1/prize-deliveries/:id/evidence (protegido)
  // Referencia: DOCUMENTO 32 seccion 13 - Subir evidencia de entrega
  // REGLA: El dueno del premio sube evidencia ANTES de recibir dinero
  @Post(':id/evidence')
  async submitEvidence(
    @Request() req: any,
    @Param('id') id: string,
    @Body() submitDto: SubmitEvidenceDto,
  ) {
    return this.prizeDeliveriesService.submitEvidence(req.user.id, id, submitDto);
  }

  // GET /api/v1/prize-deliveries/:id (protegido)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prizeDeliveriesService.findById(id);
  }
}
