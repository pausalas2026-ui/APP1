// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: Controller Core de Sorteos

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SorteosCoreService } from './sorteos-core.service';
import { CrearSorteoDto } from './dto/crear-sorteo.dto';
import { ActualizarSorteoDto } from './dto/actualizar-sorteo.dto';
import { ListarSorteosDto } from './dto/listar-sorteos.dto';

@Controller('sorteos-core')
export class SorteosCoreController {
  constructor(private readonly sorteosCoreService: SorteosCoreService) {}

  /**
   * POST /sorteos-core
   * Crear nuevo sorteo (inicia en BORRADOR)
   */
  @Post()
  async crear(@Body() dto: CrearSorteoDto) {
    return this.sorteosCoreService.crear(dto);
  }

  /**
   * GET /sorteos-core
   * Listar sorteos con filtros
   */
  @Get()
  async listar(@Query() query: ListarSorteosDto) {
    return this.sorteosCoreService.listar({
      page: query.page,
      limit: query.limit,
      estado: query.estado as any,
      tipo: query.tipo as any,
      causaId: query.causaId,
      soloEditables: query.soloEditables,
    });
  }

  /**
   * GET /sorteos-core/borradores
   * Listar sorteos en estado BORRADOR
   */
  @Get('borradores')
  async listarBorradores() {
    return this.sorteosCoreService.listarBorradores();
  }

  /**
   * GET /sorteos-core/programados
   * Listar sorteos en estado PROGRAMADO
   */
  @Get('programados')
  async listarProgramados() {
    return this.sorteosCoreService.listarProgramados();
  }

  /**
   * GET /sorteos-core/:id
   * Obtener sorteo por ID con meta de editabilidad
   */
  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteosCoreService.obtenerPorId(id);
  }

  /**
   * GET /sorteos-core/codigo/:codigo
   * Obtener sorteo por codigo
   */
  @Get('codigo/:codigo')
  async obtenerPorCodigo(@Param('codigo') codigo: string) {
    return this.sorteosCoreService.obtenerPorCodigo(codigo);
  }

  /**
   * PUT /sorteos-core/:id
   * Actualizar sorteo (solo en estados editables)
   */
  @Put(':id')
  async actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarSorteoDto,
  ) {
    return this.sorteosCoreService.actualizar(id, dto);
  }

  /**
   * POST /sorteos-core/:id/validar-programar
   * Validar si un sorteo esta listo para programarse
   */
  @Post(':id/validar-programar')
  @HttpCode(HttpStatus.OK)
  async validarParaProgramar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteosCoreService.validarParaProgramar(id);
  }
}
