// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Controller de premios (SIN liberacion de dinero)

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PremiosService } from './premios.service';
import { CreatePremioDto } from './dto/create-premio.dto';
import { UpdatePremioDto } from './dto/update-premio.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('premios')
export class PremiosController {
  constructor(private readonly premiosService: PremiosService) {}

  // GET /api/v1/premios/sorteo/:sorteoId (publico)
  @Get('sorteo/:sorteoId')
  async findBySorteo(@Param('sorteoId') sorteoId: string) {
    return this.premiosService.findBySorteo(sorteoId);
  }

  // GET /api/v1/premios/:id (publico)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.premiosService.findById(id);
  }

  // POST /api/v1/premios (protegido)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPremioDto: CreatePremioDto) {
    return this.premiosService.create(createPremioDto);
  }

  // PUT /api/v1/premios/:id (protegido)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updatePremioDto: UpdatePremioDto) {
    return this.premiosService.update(id, updatePremioDto);
  }

  // PUT /api/v1/premios/:id/estado (protegido)
  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
  ) {
    return this.premiosService.cambiarEstado(id, estado);
  }

  // DELETE /api/v1/premios/:id (protegido)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.premiosService.delete(id);
  }
}
