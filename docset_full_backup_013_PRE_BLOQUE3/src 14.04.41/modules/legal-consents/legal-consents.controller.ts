/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Controlador de usuario para consentimientos legales
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
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
  RecordConsentDto,
  RecordBulkConsentsDto,
  ConsentSuccessResponseDto,
  ConsentCheckResponseDto,
  ConsentHistoryResponseDto,
  LegalDocumentResponseDto,
  LegalDocumentsListResponseDto,
  RequiredConsentsResponseDto,
} from './dto/legal-consents.dto';
import { ConsentType, ConsentContext, DocumentType } from './legal-consents.constants';
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { OptionalAuthGuard } from '../../auth/guards/optional-auth.guard';

@ApiTags('Legal Consents')
@Controller('consents')
export class LegalConsentsController {
  constructor(private readonly legalConsentsService: LegalConsentsService) {}

  // ============================================
  // ENDPOINTS PÚBLICOS (sin autenticación)
  // ============================================

  /**
   * Obtiene todos los documentos legales actuales
   * Público para que usuarios no autenticados puedan ver términos
   */
  @Get('documents')
  @ApiOperation({ summary: 'Obtener todos los documentos legales actuales' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de documentos legales actuales',
    type: LegalDocumentsListResponseDto,
  })
  async getAllCurrentDocuments(): Promise<LegalDocumentsListResponseDto> {
    return this.legalConsentsService.getAllCurrentLegalDocuments();
  }

  /**
   * Obtiene un documento legal específico por tipo
   */
  @Get('documents/:type')
  @ApiOperation({ summary: 'Obtener documento legal por tipo' })
  @ApiParam({
    name: 'type',
    enum: DocumentType,
    description: 'Tipo de documento legal',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documento legal',
    type: LegalDocumentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Documento no encontrado',
  })
  async getDocumentByType(
    @Param('type') type: DocumentType
  ): Promise<LegalDocumentResponseDto> {
    return this.legalConsentsService.getCurrentLegalDocument(type);
  }

  /**
   * Obtiene los consentimientos requeridos para un contexto
   * Útil para que el frontend sepa qué mostrar
   */
  @Get('required/:context')
  @ApiOperation({ summary: 'Obtener consentimientos requeridos por contexto' })
  @ApiParam({
    name: 'context',
    enum: ConsentContext,
    description: 'Contexto de la acción',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    description: 'ID de referencia (ej: ID del sorteo)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Consentimientos requeridos y textos UX',
    type: RequiredConsentsResponseDto,
  })
  async getRequiredConsents(
    @Param('context') context: ConsentContext,
    @Query('referenceId') referenceId?: string
  ): Promise<RequiredConsentsResponseDto> {
    return this.legalConsentsService.getRequiredConsentsForContext(context, referenceId);
  }

  /**
   * Registra un consentimiento individual
   * Puede ser usado sin autenticación (con sessionId)
   */
  @Post('record')
  @ApiOperation({ summary: 'Registrar un consentimiento' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consentimiento registrado',
    type: ConsentSuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async recordConsent(
    @Body() dto: RecordConsentDto
  ): Promise<ConsentSuccessResponseDto> {
    return this.legalConsentsService.recordConsent(dto);
  }

  /**
   * Registra múltiples consentimientos según contexto
   */
  @Post('record-bulk')
  @ApiOperation({ summary: 'Registrar múltiples consentimientos por contexto' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consentimientos registrados',
    type: ConsentSuccessResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Datos inválidos',
  })
  async recordBulkConsents(
    @Body() dto: RecordBulkConsentsDto
  ): Promise<ConsentSuccessResponseDto> {
    return this.legalConsentsService.recordBulkConsents(dto);
  }

  // ============================================
  // ENDPOINTS AUTENTICADOS (requieren login)
  // ============================================

  /**
   * Verifica si el usuario actual tiene un consentimiento específico
   */
  @Get('check/:consentType')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar si el usuario tiene un consentimiento' })
  @ApiParam({
    name: 'consentType',
    enum: ConsentType,
    description: 'Tipo de consentimiento',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    description: 'ID de referencia (para sorteos)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estado del consentimiento',
    type: ConsentCheckResponseDto,
  })
  async checkMyConsent(
    @Param('consentType') consentType: ConsentType,
    @Query('referenceId') referenceId: string,
    @Req() req: any
  ): Promise<ConsentCheckResponseDto> {
    // TODO: Obtener userId del JWT cuando auth esté implementado
    const userId = req.user?.id || 'mock-user-id';
    return this.legalConsentsService.checkConsent({
      userId,
      consentType,
      referenceId,
    });
  }

  /**
   * Verifica si el usuario tiene todos los consentimientos para un contexto
   */
  @Get('check-context/:context')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar todos los consentimientos para un contexto' })
  @ApiParam({
    name: 'context',
    enum: ConsentContext,
    description: 'Contexto de la acción',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    description: 'ID de referencia',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Si tiene todos los consentimientos',
  })
  async checkAllConsentsForContext(
    @Param('context') context: ConsentContext,
    @Query('referenceId') referenceId: string,
    @Req() req: any
  ): Promise<{ hasAllConsents: boolean; context: ConsentContext }> {
    const userId = req.user?.id || 'mock-user-id';
    const hasAllConsents = await this.legalConsentsService.hasAllConsentsForContext(
      userId,
      context,
      referenceId
    );
    return { hasAllConsents, context };
  }

  /**
   * Obtiene el historial de consentimientos del usuario actual
   */
  @Get('history')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener historial de consentimientos del usuario' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historial de consentimientos',
    type: ConsentHistoryResponseDto,
  })
  async getMyConsentHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Req() req: any
  ): Promise<ConsentHistoryResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    return this.legalConsentsService.getConsentHistory(userId, page, limit);
  }

  /**
   * Registra consentimiento para el usuario actual
   * Simplificado: solo requiere tipo y referencia, IP y userAgent se obtienen del request
   */
  @Post('accept/:consentType')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar un consentimiento (usuario autenticado)' })
  @ApiParam({
    name: 'consentType',
    enum: ConsentType,
    description: 'Tipo de consentimiento',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    description: 'ID de referencia (para sorteos)',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consentimiento registrado',
    type: ConsentSuccessResponseDto,
  })
  async acceptConsent(
    @Param('consentType') consentType: ConsentType,
    @Query('referenceId') referenceId: string,
    @Req() req: any
  ): Promise<ConsentSuccessResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Obtener versión actual del documento
    const documentType = this.getDocumentTypeForConsent(consentType);
    const currentDoc = await this.legalConsentsService.getCurrentLegalDocument(documentType);

    return this.legalConsentsService.recordConsent({
      userId,
      consentType,
      documentVersion: currentDoc.version,
      referenceId: consentType === ConsentType.SORTEO ? referenceId : undefined,
      referenceType:
        consentType === ConsentType.SORTEO ? 'RAFFLE' : undefined,
      ipAddress,
      userAgent,
    } as any);
  }

  /**
   * Acepta todos los consentimientos para un contexto
   */
  @Post('accept-context/:context')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Aceptar todos los consentimientos para un contexto' })
  @ApiParam({
    name: 'context',
    enum: ConsentContext,
    description: 'Contexto de la acción',
  })
  @ApiQuery({
    name: 'referenceId',
    required: false,
    description: 'ID de referencia',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Consentimientos registrados',
    type: ConsentSuccessResponseDto,
  })
  async acceptAllConsentsForContext(
    @Param('context') context: ConsentContext,
    @Query('referenceId') referenceId: string,
    @Req() req: any
  ): Promise<ConsentSuccessResponseDto> {
    const userId = req.user?.id || 'mock-user-id';
    const ipAddress = req.ip || req.connection?.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.legalConsentsService.recordBulkConsents({
      userId,
      context,
      referenceId,
      ipAddress,
      userAgent,
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  private getDocumentTypeForConsent(consentType: ConsentType): DocumentType {
    const mapping: Record<ConsentType, DocumentType> = {
      [ConsentType.TOS]: DocumentType.TERMS_OF_SERVICE,
      [ConsentType.PRIVACY]: DocumentType.PRIVACY_POLICY,
      [ConsentType.SORTEO]: DocumentType.RAFFLE_TERMS,
      [ConsentType.DONACION]: DocumentType.DONATION_POLICY,
    };
    return mapping[consentType];
  }
}
