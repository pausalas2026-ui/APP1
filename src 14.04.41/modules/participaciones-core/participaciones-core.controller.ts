// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.2: Controller de Participaciones

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ParticipacionesCoreService } from './participaciones-core.service';
import { RegistrarParticipacionDto } from './dto/registrar-participacion.dto';
import { ListarParticipacionesDto } from './dto/listar-participaciones.dto';

@Controller('participaciones-core')
export class ParticipacionesCoreController {
  constructor(
    private readonly participacionesCoreService: ParticipacionesCoreService,
  ) {}

  /**
   * POST /participaciones-core
   * Registrar nueva participacion en sorteo ACTIVO
   */
  @Post()
  async registrarParticipacion(@Body() dto: RegistrarParticipacionDto) {
    return this.participacionesCoreService.registrarParticipacion(dto);
  }

  /**
   * GET /participaciones-core/:id
   * Obtener participacion por ID
   */
  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.participacionesCoreService.obtenerPorId(id);
  }

  /**
   * GET /participaciones-core/sorteo/:sorteoId
   * Listar participaciones de un sorteo
   */
  @Get('sorteo/:sorteoId')
  async listarPorSorteo(
    @Param('sorteoId', ParseUUIDPipe) sorteoId: string,
    @Query() query: ListarParticipacionesDto,
  ) {
    return this.participacionesCoreService.listarPorSorteo(sorteoId, {
      page: query.page,
      limit: query.limit,
    });
  }

  /**
   * GET /participaciones-core/usuario/:userId
   * Listar participaciones de un usuario
   */
  @Get('usuario/:userId')
  async listarPorUsuario(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: ListarParticipacionesDto,
  ) {
    return this.participacionesCoreService.listarPorUsuario(userId, {
      page: query.page,
      limit: query.limit,
      soloActivos: query.soloActivos,
    });
  }

  /**
   * GET /participaciones-core/sorteo/:sorteoId/estadisticas
   * Obtener estadisticas de participacion de un sorteo
   */
  @Get('sorteo/:sorteoId/estadisticas')
  async obtenerEstadisticas(@Param('sorteoId', ParseUUIDPipe) sorteoId: string) {
    return this.participacionesCoreService.obtenerEstadisticas(sorteoId);
  }

  /**
   * GET /participaciones-core/sorteo/:sorteoId/disponibles
   * Obtener boletos disponibles de un sorteo
   */
  @Get('sorteo/:sorteoId/disponibles')
  async obtenerBoletosDisponibles(
    @Param('sorteoId', ParseUUIDPipe) sorteoId: string,
  ) {
    return this.participacionesCoreService.obtenerBoletosDisponibles(sorteoId);
  }

  /**
   * POST /participaciones-core/verificar
   * Verificar si un usuario ya participa en un sorteo
   */
  @Post('verificar')
  @HttpCode(HttpStatus.OK)
  async verificarParticipacion(
    @Body() body: { userId: string; sorteoId: string },
  ) {
    return this.participacionesCoreService.verificarParticipacion(
      body.userId,
      body.sorteoId,
    );
  }

  /**
   * POST /participaciones-core/validar
   * Validar si se puede participar (sin crear participacion)
   */
  @Post('validar')
  @HttpCode(HttpStatus.OK)
  async validarParticipacion(
    @Body() body: { userId: string; sorteoId: string },
  ) {
    return this.participacionesCoreService.validarParticipacion(
      body.userId,
      body.sorteoId,
    );
  }
}
