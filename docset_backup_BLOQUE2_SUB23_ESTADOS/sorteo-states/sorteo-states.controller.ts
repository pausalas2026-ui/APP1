// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: Estados y Transiciones
// Controller para operaciones de estado

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SorteoStatesService } from './sorteo-states.service';
import { TransicionarDto } from './dto/transicionar.dto';
import { ValidarAccionDto } from './dto/validar-accion.dto';

@Controller('sorteo-states')
export class SorteoStatesController {
  constructor(private readonly sorteoStatesService: SorteoStatesService) {}

  /**
   * GET /sorteo-states/estados
   * Obtiene todos los estados disponibles con su configuracion
   */
  @Get('estados')
  obtenerTodosLosEstados() {
    return this.sorteoStatesService.obtenerTodosLosEstados();
  }

  /**
   * GET /sorteo-states/:id
   * Obtiene el estado actual de un sorteo
   */
  @Get(':id')
  async obtenerEstado(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.obtenerEstado(id);
  }

  /**
   * POST /sorteo-states/:id/validar-transicion
   * Valida si una transicion es posible (sin ejecutarla)
   */
  @Post(':id/validar-transicion')
  @HttpCode(HttpStatus.OK)
  async validarTransicion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransicionarDto,
  ) {
    return this.sorteoStatesService.validarTransicion(id, dto.estadoDestino);
  }

  /**
   * POST /sorteo-states/:id/transicionar
   * Ejecuta una transicion de estado
   */
  @Post(':id/transicionar')
  async transicionar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransicionarDto,
  ) {
    return this.sorteoStatesService.transicionar(id, dto.estadoDestino);
  }

  /**
   * POST /sorteo-states/:id/validar-accion
   * Valida si una accion esta permitida en el estado actual
   */
  @Post(':id/validar-accion')
  @HttpCode(HttpStatus.OK)
  async validarAccion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ValidarAccionDto,
  ) {
    return this.sorteoStatesService.validarAccion(id, dto.accion);
  }

  /**
   * POST /sorteo-states/:id/programar
   * BORRADOR -> PROGRAMADO
   */
  @Post(':id/programar')
  async programar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.programar(id);
  }

  /**
   * POST /sorteo-states/:id/activar
   * PROGRAMADO -> ACTIVO
   */
  @Post(':id/activar')
  async activar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.activar(id);
  }

  /**
   * POST /sorteo-states/:id/cerrar
   * ACTIVO -> CERRADO
   */
  @Post(':id/cerrar')
  async cerrar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.cerrar(id);
  }

  /**
   * POST /sorteo-states/:id/iniciar-sorteo
   * CERRADO -> SORTEANDO
   */
  @Post(':id/iniciar-sorteo')
  async iniciarSorteo(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.iniciarSorteo(id);
  }

  /**
   * POST /sorteo-states/:id/finalizar
   * SORTEANDO -> FINALIZADO
   */
  @Post(':id/finalizar')
  async finalizar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sorteoStatesService.finalizar(id);
  }

  /**
   * POST /sorteo-states/:id/cancelar
   * Disponible desde: BORRADOR, PROGRAMADO, ACTIVO, CERRADO
   */
  @Post(':id/cancelar')
  async cancelar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motivo?: string },
  ) {
    return this.sorteoStatesService.cancelar(id, body.motivo);
  }
}
