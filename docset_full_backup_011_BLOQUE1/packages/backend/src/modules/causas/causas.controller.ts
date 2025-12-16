// DOCUMENTO 06 - MODULOS CLAVE
// Controller de causas/ONGs (SIN liberacion de dinero)

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
import { CausasService } from './causas.service';
import { CreateCausaDto } from './dto/create-causa.dto';
import { UpdateCausaDto } from './dto/update-causa.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('causas')
export class CausasController {
  constructor(private readonly causasService: CausasService) {}

  // GET /api/v1/causas (publico)
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('estado') estado?: string,
  ) {
    return this.causasService.findAll({ page, limit, estado });
  }

  // GET /api/v1/causas/activas (publico)
  @Get('activas')
  async findActivas() {
    return this.causasService.findActivas();
  }

  // GET /api/v1/causas/:id (publico)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.causasService.findById(id);
  }

  // POST /api/v1/causas (protegido)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCausaDto: CreateCausaDto) {
    return this.causasService.create(createCausaDto);
  }

  // PUT /api/v1/causas/:id (protegido)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateCausaDto: UpdateCausaDto) {
    return this.causasService.update(id, updateCausaDto);
  }

  // PUT /api/v1/causas/:id/estado (protegido)
  @Put(':id/estado')
  @UseGuards(JwtAuthGuard)
  async cambiarEstado(
    @Param('id') id: string,
    @Body('estado') estado: string,
  ) {
    return this.causasService.cambiarEstado(id, estado);
  }

  // PUT /api/v1/causas/:id/verificar (protegido)
  @Put(':id/verificar')
  @UseGuards(JwtAuthGuard)
  async verificar(@Param('id') id: string) {
    return this.causasService.verificar(id);
  }

  // DELETE /api/v1/causas/:id (protegido)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.causasService.delete(id);
  }
}
