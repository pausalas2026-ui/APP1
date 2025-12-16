/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Controlador de usuario para engagement
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { MessagingService } from './messaging.service';
import { GeolocationService } from './geolocation.service';
import { CauseUpdatesService } from './cause-updates.service';
import {
  InternalMessagesListDto,
  MarkMessagesReadDto,
  CreateCauseUpdateDto,
  CauseUpdateResponseDto,
  CauseUpdatesListDto,
  CauseGeoStatsResponseDto,
} from './dto/engagement.dto';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Engagement')
@Controller('engagement')
// @UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EngagementController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly geolocationService: GeolocationService,
    private readonly causeUpdatesService: CauseUpdatesService
  ) {}

  // ============================================
  // MENSAJES INTERNOS
  // ============================================

  /**
   * Obtiene mensajes internos del usuario
   */
  @Get('messages')
  @ApiOperation({ summary: 'Obtener mensajes internos del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de mensajes',
    type: InternalMessagesListDto,
  })
  async getMyMessages(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('unreadOnly', new DefaultValuePipe(false), ParseBoolPipe) unreadOnly: boolean,
    @Req() req: any
  ): Promise<InternalMessagesListDto> {
    const userId = req.user?.id || 'mock-user-id';
    return this.messagingService.getInternalMessages(userId, page, limit, unreadOnly);
  }

  /**
   * Cuenta mensajes no leídos
   */
  @Get('messages/unread-count')
  @ApiOperation({ summary: 'Contar mensajes no leídos' })
  @ApiResponse({ status: HttpStatus.OK })
  async getUnreadCount(@Req() req: any): Promise<{ count: number }> {
    const userId = req.user?.id || 'mock-user-id';
    const result = await this.messagingService.getInternalMessages(userId, 1, 1, true);
    return { count: result.unreadCount };
  }

  /**
   * Marca mensajes como leídos
   */
  @Post('messages/mark-read')
  @ApiOperation({ summary: 'Marcar mensajes como leídos' })
  @ApiResponse({ status: HttpStatus.OK })
  async markMessagesAsRead(
    @Body() dto: MarkMessagesReadDto,
    @Req() req: any
  ): Promise<{ markedCount: number }> {
    const userId = req.user?.id || 'mock-user-id';
    const count = await this.messagingService.markMessagesAsRead(userId, dto.messageIds);
    return { markedCount: count };
  }

  /**
   * Marca todos los mensajes como leídos
   */
  @Post('messages/mark-all-read')
  @ApiOperation({ summary: 'Marcar todos los mensajes como leídos' })
  @ApiResponse({ status: HttpStatus.OK })
  async markAllAsRead(@Req() req: any): Promise<{ markedCount: number }> {
    const userId = req.user?.id || 'mock-user-id';
    const count = await this.messagingService.markAllMessagesAsRead(userId);
    return { markedCount: count };
  }

  /**
   * Elimina un mensaje
   */
  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Eliminar un mensaje' })
  @ApiParam({ name: 'messageId' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Req() req: any
  ): Promise<void> {
    const userId = req.user?.id || 'mock-user-id';
    await this.messagingService.deleteMessage(userId, messageId);
  }

  // ============================================
  // ACTUALIZACIONES DE CAUSA
  // ============================================

  /**
   * Obtiene actualizaciones de una causa
   */
  @Get('causes/:causeId/updates')
  @ApiOperation({ summary: 'Obtener actualizaciones de una causa' })
  @ApiParam({ name: 'causeId' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de actualizaciones',
    type: CauseUpdatesListDto,
  })
  async getCauseUpdates(
    @Param('causeId', ParseUUIDPipe) causeId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number
  ): Promise<CauseUpdatesListDto> {
    return this.causeUpdatesService.getCauseUpdates(causeId, page, limit, true);
  }

  /**
   * Crea una actualización de causa (solo creador)
   */
  @Post('causes/:causeId/updates')
  @ApiOperation({ summary: 'Crear actualización de causa' })
  @ApiParam({ name: 'causeId' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Actualización creada',
    type: CauseUpdateResponseDto,
  })
  async createCauseUpdate(
    @Param('causeId', ParseUUIDPipe) causeId: string,
    @Body() dto: CreateCauseUpdateDto,
    @Req() req: any
  ): Promise<CauseUpdateResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    return this.causeUpdatesService.createUpdate(causeId, userId, dto);
  }

  /**
   * Actualiza una publicación
   */
  @Put('updates/:updateId')
  @ApiOperation({ summary: 'Actualizar una publicación' })
  @ApiParam({ name: 'updateId' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CauseUpdateResponseDto,
  })
  async updateCauseUpdate(
    @Param('updateId', ParseUUIDPipe) updateId: string,
    @Body() dto: Partial<CreateCauseUpdateDto>,
    @Req() req: any
  ): Promise<CauseUpdateResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    return this.causeUpdatesService.updateUpdate(updateId, userId, dto);
  }

  /**
   * Elimina una actualización
   */
  @Delete('updates/:updateId')
  @ApiOperation({ summary: 'Eliminar actualización' })
  @ApiParam({ name: 'updateId' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteCauseUpdate(
    @Param('updateId', ParseUUIDPipe) updateId: string,
    @Req() req: any
  ): Promise<void> {
    const userId = req.user?.id || 'mock-user-id';
    await this.causeUpdatesService.deleteUpdate(updateId, userId);
  }

  /**
   * Fija/desfija una actualización
   */
  @Post('updates/:updateId/toggle-pin')
  @ApiOperation({ summary: 'Fijar/desfijar actualización' })
  @ApiParam({ name: 'updateId' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: CauseUpdateResponseDto,
  })
  async togglePinUpdate(
    @Param('updateId', ParseUUIDPipe) updateId: string,
    @Req() req: any
  ): Promise<CauseUpdateResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    return this.causeUpdatesService.togglePin(updateId, userId);
  }

  // ============================================
  // GEOLOCALIZACIÓN
  // ============================================

  /**
   * Obtiene estadísticas geográficas de una causa
   * DOC36: Mapa del mundo con países iluminados
   */
  @Get('causes/:causeId/geo-stats')
  @ApiOperation({ summary: 'Obtener estadísticas geográficas de una causa' })
  @ApiParam({ name: 'causeId' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas geográficas',
    type: CauseGeoStatsResponseDto,
  })
  async getCauseGeoStats(
    @Param('causeId', ParseUUIDPipe) causeId: string
  ): Promise<CauseGeoStatsResponseDto> {
    return this.geolocationService.getCauseGeoStats(causeId);
  }

  /**
   * Obtiene resumen rápido de países
   * DOC36: "Tu causa ha recibido apoyo desde 7 países"
   */
  @Get('causes/:causeId/geo-summary')
  @ApiOperation({ summary: 'Resumen rápido de países' })
  @ApiParam({ name: 'causeId' })
  @ApiResponse({ status: HttpStatus.OK })
  async getCauseGeoSummary(
    @Param('causeId', ParseUUIDPipe) causeId: string
  ): Promise<{ countries: number; message: string }> {
    return this.geolocationService.getQuickGeoSummary(causeId);
  }
}
