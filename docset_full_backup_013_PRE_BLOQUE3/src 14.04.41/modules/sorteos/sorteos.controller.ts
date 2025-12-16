// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// DOCUMENTO 15 - ENDPOINTS
// Controller de sorteos

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SorteosService } from './sorteos.service';
import { CreateSorteoDto } from './dto/create-sorteo.dto';
import { UpdateSorteoDto } from './dto/update-sorteo.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('sorteos')
export class SorteosController {
  constructor(private readonly sorteosService: SorteosService) {}

  // GET /api/v1/sorteos (publico)
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
  ) {
    return this.sorteosService.findAll({ page, limit, estado, tipo });
  }

  // GET /api/v1/sorteos/activos (publico)
  @Get('activos')
  async findActivos() {
    return this.sorteosService.findActivos();
  }

  // GET /api/v1/sorteos/:id (publico)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.sorteosService.findById(id);
  }

  // GET /api/v1/sorteos/codigo/:codigo (publico)
  @Get('codigo/:codigo')
  async findByCodigo(@Param('codigo') codigo: string) {
    return this.sorteosService.findByCodigo(codigo);
  }

  // POST /api/v1/sorteos (protegido)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createSorteoDto: CreateSorteoDto) {
    return this.sorteosService.create(createSorteoDto);
  }

  // PUT /api/v1/sorteos/:id (protegido)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateSorteoDto: UpdateSorteoDto) {
    return this.sorteosService.update(id, updateSorteoDto);
  }

  // PUT /api/v1/sorteos/:id/estado (protegido)
  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
  ) {
    return this.sorteosService.cambiarEstado(id, estado);
  }

  // DELETE /api/v1/sorteos/:id (protegido)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.sorteosService.delete(id);
  }
}
