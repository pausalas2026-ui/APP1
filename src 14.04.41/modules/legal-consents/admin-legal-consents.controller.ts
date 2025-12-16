/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Controlador Admin para gestión de documentos legales y consentimientos
 * 
 * FUNCIONES ADMIN:
 * - Crear/actualizar documentos legales
 * - Ver historial de versiones
 * - Consultar consentimientos de usuarios
 * - Ver estadísticas de aceptación
 * - Identificar usuarios que necesitan re-aceptar
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
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
import { LegalConsentsService } from './legal-consents.service';
import {
  CreateLegalDocumentDto,
  UpdateLegalDocumentDto,
  FilterConsentsDto,
  LegalDocumentResponseDto,
  LegalDocumentsListResponseDto,
  ConsentHistoryResponseDto,
  ConsentStatsResponseDto,
} from './dto/legal-consents.dto';
import { DocumentType } from './legal-consents.constants';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard';
// import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin - Legal Consents')
@Controller('admin/legal')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @Roles('admin', 'superadmin')
@ApiBearerAuth()
export class AdminLegalConsentsController {
  constructor(private readonly legalConsentsService: LegalConsentsService) {}

  // ============================================
  // GESTIÓN DE DOCUMENTOS LEGALES
  // ============================================

  /**
   * Obtiene todos los documentos legales (todas las versiones)
   */
  @Get('documents')
  @ApiOperation({ summary: 'Listar todos los documentos legales' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: DocumentType,
    description: 'Filtrar por tipo',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de documentos legales',
    type: LegalDocumentsListResponseDto,
  })
  async getAllDocuments(
    @Query('type') type?: DocumentType
  ): Promise<LegalDocumentsListResponseDto> {
    return this.legalConsentsService.getAllLegalDocuments(type);
  }

  /**
   * Obtiene un documento legal por ID
   */
  @Get('documents/:id')
  @ApiOperation({ summary: 'Obtener documento legal por ID' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento legal',
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documento no encontrado',
  })
  async getDocumentById(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<LegalDocumentResponseDto> {
    return this.legalConsentsService.getLegalDocumentById(id);
  }

  /**
   * Obtiene historial de versiones de un tipo de documento
   */
  @Get('documents/history/:type')
  @ApiOperation({ summary: 'Obtener historial de versiones de un documento' })
  @ApiParam({
    name: 'type',
    enum: DocumentType,
    description: 'Tipo de documento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de versiones',
    type: LegalDocumentsListResponseDto,
  })
  async getDocumentVersionHistory(
    @Param('type') type: DocumentType
  ): Promise<LegalDocumentsListResponseDto> {
    return this.legalConsentsService.getDocumentVersionHistory(type);
  }

  /**
   * Crea un nuevo documento legal
   * DOC35: Nunca borrar versiones anteriores, solo crear nuevas
   */
  @Post('documents')
  @ApiOperation({ summary: 'Crear nuevo documento legal' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Documento creado',
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos o versión duplicada',
  })
  async createDocument(
    @Body() dto: CreateLegalDocumentDto,
    @Req() req: any
  ): Promise<LegalDocumentResponseDto> {
    const adminId = req.user?.id || 'admin-user-id';
    return this.legalConsentsService.createLegalDocument(dto, adminId);
  }

  /**
   * Actualiza un documento legal existente
   * Solo se pueden actualizar campos no críticos
   */
  @Put('documents/:id')
  @ApiOperation({ summary: 'Actualizar documento legal' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento actualizado',
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documento no encontrado',
  })
  async updateDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLegalDocumentDto
  ): Promise<LegalDocumentResponseDto> {
    return this.legalConsentsService.updateLegalDocument(id, dto);
  }

  /**
   * Marca un documento como la versión actual
   */
  @Post('documents/:id/set-current')
  @ApiOperation({ summary: 'Establecer documento como versión actual' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento establecido como actual',
    type: LegalDocumentResponseDto,
  })
  async setDocumentAsCurrent(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<LegalDocumentResponseDto> {
    return this.legalConsentsService.updateLegalDocument(id, { isCurrent: true });
  }

  // ============================================
  // GESTIÓN DE CONSENTIMIENTOS
  // ============================================

  /**
   * Obtiene consentimientos con filtros
   */
  @Get('consents')
  @ApiOperation({ summary: 'Listar consentimientos con filtros' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de consentimientos',
    type: ConsentHistoryResponseDto,
  })
  async getConsents(
    @Query() filters: FilterConsentsDto
  ): Promise<ConsentHistoryResponseDto> {
    return this.legalConsentsService.getConsentsWithFilters(filters);
  }

  /**
   * Obtiene consentimientos de un usuario específico
   */
  @Get('consents/user/:userId')
  @ApiOperation({ summary: 'Obtener consentimientos de un usuario' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consentimientos del usuario',
    type: ConsentHistoryResponseDto,
  })
  async getUserConsents(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ): Promise<ConsentHistoryResponseDto> {
    return this.legalConsentsService.getConsentHistory(userId, page || 1, limit || 20);
  }

  /**
   * Obtiene estadísticas de consentimientos
   */
  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de consentimientos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de consentimientos',
    type: ConsentStatsResponseDto,
  })
  async getConsentStats(): Promise<ConsentStatsResponseDto> {
    return this.legalConsentsService.getConsentStats();
  }

  /**
   * Obtiene usuarios que necesitan re-aceptar por nueva versión
   * DOC35: Cuando hay nueva versión, usuarios con versión anterior necesitan re-aceptar
   */
  @Get('needs-reconsent/:type')
  @ApiOperation({ summary: 'Usuarios que necesitan re-aceptar consentimiento' })
  @ApiParam({
    name: 'type',
    enum: DocumentType,
    description: 'Tipo de documento',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuarios que necesitan re-aceptar',
  })
  async getUsersNeedingReconsent(
    @Param('type') type: DocumentType
  ): Promise<{ users: { userId: string; acceptedVersion: string; currentVersion: string }[] }> {
    const users = await this.legalConsentsService.getUsersNeedingReConsent(type);
    return { users };
  }

  // ============================================
  // REPORTES Y EXPORTS
  // ============================================

  /**
   * Exporta consentimientos de un usuario (para solicitudes RGPD)
   * DOC35: RGPD requiere que usuarios puedan obtener sus datos
   */
  @Get('export/user/:userId')
  @ApiOperation({ summary: 'Exportar consentimientos de usuario (RGPD)' })
  @ApiParam({ name: 'userId', description: 'ID del usuario' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Datos exportados del usuario',
  })
  async exportUserConsents(
    @Param('userId', ParseUUIDPipe) userId: string
  ): Promise<{
    userId: string;
    exportDate: Date;
    consents: any[];
    totalConsents: number;
  }> {
    const history = await this.legalConsentsService.getConsentHistory(userId, 1, 1000);
    
    return {
      userId,
      exportDate: new Date(),
      consents: history.consents,
      totalConsents: history.total,
    };
  }

  /**
   * Resumen de cumplimiento por tipo de documento
   */
  @Get('compliance-summary')
  @ApiOperation({ summary: 'Resumen de cumplimiento de consentimientos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resumen de cumplimiento',
  })
  async getComplianceSummary(): Promise<{
    documentTypes: Array<{
      type: DocumentType;
      currentVersion: string;
      totalAcceptances: number;
      currentVersionAcceptances: number;
      complianceRate: number;
    }>;
  }> {
    const stats = await this.legalConsentsService.getConsentStats();
    const allDocs = await this.legalConsentsService.getAllCurrentLegalDocuments();

    const summary = await Promise.all(
      allDocs.documents.map(async (doc) => {
        const usersNeedingReconsent = await this.legalConsentsService.getUsersNeedingReConsent(
          doc.documentType
        );

        // Calcular tasa de cumplimiento
        const totalAcceptances = stats.totalConsents;
        const currentVersionAcceptances = stats.byVersion[doc.version] || 0;
        const complianceRate =
          totalAcceptances > 0
            ? (currentVersionAcceptances / totalAcceptances) * 100
            : 100;

        return {
          type: doc.documentType,
          currentVersion: doc.version,
          totalAcceptances,
          currentVersionAcceptances,
          complianceRate: Math.round(complianceRate * 100) / 100,
        };
      })
    );

    return { documentTypes: summary };
  }
}
