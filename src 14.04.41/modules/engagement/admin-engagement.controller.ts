/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Controlador Admin para gestión de templates y estadísticas
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
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
import {
  CreateMessageTemplateDto,
  UpdateMessageTemplateDto,
  MessageTemplateResponseDto,
  MessageTemplatesListDto,
  EngagementStatsResponseDto,
} from './dto/engagement.dto';
import { SupportedLanguage, EngagementEvent } from './engagement.constants';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Engagement')
@Controller('admin/engagement')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin', 'superadmin')
@ApiBearerAuth()
export class AdminEngagementController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly geolocationService: GeolocationService
  ) {}

  // ============================================
  // TEMPLATES DE MENSAJES
  // ============================================

  /**
   * Obtiene todos los templates
   */
  @Get('templates')
  @ApiOperation({ summary: 'Listar todos los templates de mensajes' })
  @ApiQuery({ name: 'templateKey', required: false })
  @ApiQuery({ name: 'languageCode', required: false, enum: SupportedLanguage })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de templates',
    type: MessageTemplatesListDto,
  })
  async getAllTemplates(
    @Query('templateKey') templateKey?: string,
    @Query('languageCode') languageCode?: SupportedLanguage
  ): Promise<MessageTemplatesListDto> {
    return this.messagingService.getAllTemplates(templateKey, languageCode);
  }

  /**
   * Crea un nuevo template
   */
  @Post('templates')
  @ApiOperation({ summary: 'Crear template de mensaje' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template creado',
    type: MessageTemplateResponseDto,
  })
  async createTemplate(
    @Body() dto: CreateMessageTemplateDto
  ): Promise<MessageTemplateResponseDto> {
    return this.messagingService.createTemplate(dto);
  }

  /**
   * Actualiza un template
   */
  @Put('templates/:id')
  @ApiOperation({ summary: 'Actualizar template' })
  @ApiParam({ name: 'id' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: MessageTemplateResponseDto,
  })
  async updateTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMessageTemplateDto
  ): Promise<MessageTemplateResponseDto> {
    return this.messagingService.updateTemplate(id, dto);
  }

  /**
   * Obtiene los eventos disponibles para templates
   */
  @Get('events')
  @ApiOperation({ summary: 'Listar eventos disponibles para templates' })
  @ApiResponse({ status: HttpStatus.OK })
  async getAvailableEvents(): Promise<{ events: string[] }> {
    return { events: Object.values(EngagementEvent) };
  }

  /**
   * Obtiene los idiomas soportados
   */
  @Get('languages')
  @ApiOperation({ summary: 'Listar idiomas soportados' })
  @ApiResponse({ status: HttpStatus.OK })
  async getSupportedLanguages(): Promise<{ languages: string[] }> {
    return { languages: Object.values(SupportedLanguage) };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * Obtiene estadísticas de mensajería
   */
  @Get('stats/messaging')
  @ApiOperation({ summary: 'Estadísticas de mensajería' })
  @ApiResponse({
    status: HttpStatus.OK,
    type: EngagementStatsResponseDto,
  })
  async getMessagingStats(): Promise<EngagementStatsResponseDto> {
    return this.messagingService.getMessagingStats();
  }

  /**
   * Obtiene estadísticas globales de geolocalización
   */
  @Get('stats/geo')
  @ApiOperation({ summary: 'Estadísticas globales de geolocalización' })
  @ApiResponse({ status: HttpStatus.OK })
  async getGlobalGeoStats(): Promise<{
    totalCountries: number;
    topCountries: any[];
    totalDonationsTracked: number;
  }> {
    return this.geolocationService.getGlobalGeoStats();
  }

  /**
   * Dashboard de engagement
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de engagement' })
  @ApiResponse({ status: HttpStatus.OK })
  async getEngagementDashboard(): Promise<{
    messaging: EngagementStatsResponseDto;
    geo: any;
    templates: { total: number };
  }> {
    const [messaging, geo, templates] = await Promise.all([
      this.messagingService.getMessagingStats(),
      this.geolocationService.getGlobalGeoStats(),
      this.messagingService.getAllTemplates(),
    ]);

    return {
      messaging,
      geo,
      templates: { total: templates.total },
    };
  }

  // ============================================
  // HERRAMIENTAS DE PRUEBA
  // ============================================

  /**
   * Envía mensaje de prueba (solo desarrollo)
   */
  @Post('test/send-message')
  @ApiOperation({ summary: 'Enviar mensaje de prueba' })
  @ApiResponse({ status: HttpStatus.OK })
  async sendTestMessage(
    @Body() body: { userId: string; event: EngagementEvent; variables: Record<string, string> }
  ): Promise<{ success: boolean; message: string }> {
    return this.messagingService.sendMessage({
      userId: body.userId,
      templateKey: body.event,
      variables: body.variables,
    });
  }

  /**
   * Previsualiza un template renderizado
   */
  @Post('templates/preview')
  @ApiOperation({ summary: 'Previsualizar template renderizado' })
  @ApiResponse({ status: HttpStatus.OK })
  async previewTemplate(
    @Body() body: {
      templateKey: string;
      languageCode: SupportedLanguage;
      channel: string;
      variables: Record<string, string>;
    }
  ): Promise<{
    subject?: string;
    body: string;
    ctaText?: string;
    ctaUrl?: string;
  }> {
    const template = await this.messagingService.getTemplate(
      body.templateKey,
      body.languageCode,
      body.channel as any
    );

    if (!template) {
      return {
        body: `[No template found for ${body.templateKey}/${body.languageCode}/${body.channel}]`,
      };
    }

    // Renderizar con variables
    let renderedBody = template.body;
    let renderedSubject = template.subject;
    let renderedCtaText = template.ctaText;
    let renderedCtaUrl = template.ctaUrl;

    Object.entries(body.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      renderedBody = renderedBody.replace(regex, value);
      if (renderedSubject) renderedSubject = renderedSubject.replace(regex, value);
      if (renderedCtaText) renderedCtaText = renderedCtaText.replace(regex, value);
      if (renderedCtaUrl) renderedCtaUrl = renderedCtaUrl.replace(regex, value);
    });

    return {
      subject: renderedSubject,
      body: renderedBody,
      ctaText: renderedCtaText,
      ctaUrl: renderedCtaUrl,
    };
  }
}
