// WhatsApp Contacts Controller
// Endpoints para gestión de contactos y envío de mensajes

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
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WhatsappContactsService } from './whatsapp-contacts.service';
import {
  ImportContactsDto,
  AddContactDto,
  UpdateContactDto,
  SendMessageToContactDto,
  SendBulkMessageDto,
  ShareSweepstakeDto,
  ContactsFilterDto,
  MessageHistoryFilterDto,
  RecordImportConsentDto,
  ContactOptOutDto,
  ValidatePhoneDto,
} from './dto/whatsapp-contacts.dto';
import { CONSENT_LEGAL_TEXT } from './whatsapp-contacts.constants';

// Guard simulado - en producción usar AuthGuard real
const JwtAuthGuard = () => UseGuards();

@Controller('whatsapp-contacts')
export class WhatsappContactsController {
  constructor(private readonly whatsappContactsService: WhatsappContactsService) {}

  // ============================================
  // GESTIÓN DE CONTACTOS
  // ============================================

  /**
   * GET /whatsapp-contacts
   * Obtener lista de contactos del usuario con filtros
   */
  @Get()
  @JwtAuthGuard()
  async getContacts(
    @Request() req: any,
    @Query() filters: ContactsFilterDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getContacts(userId, filters);
  }

  /**
   * GET /whatsapp-contacts/:id
   * Obtener un contacto específico
   */
  @Get(':id')
  @JwtAuthGuard()
  async getContact(
    @Request() req: any,
    @Param('id') contactId: string,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getContact(userId, contactId);
  }

  /**
   * POST /whatsapp-contacts/import
   * Importar múltiples contactos desde dispositivo o archivo
   */
  @Post('import')
  @JwtAuthGuard()
  async importContacts(
    @Request() req: any,
    @Body() dto: ImportContactsDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.importContacts(userId, dto);
  }

  /**
   * POST /whatsapp-contacts
   * Agregar un contacto individual manualmente
   */
  @Post()
  @JwtAuthGuard()
  async addContact(
    @Request() req: any,
    @Body() dto: AddContactDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.addContact(userId, dto);
  }

  /**
   * PUT /whatsapp-contacts/:id
   * Actualizar un contacto existente
   */
  @Put(':id')
  @JwtAuthGuard()
  async updateContact(
    @Request() req: any,
    @Param('id') contactId: string,
    @Body() dto: UpdateContactDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.updateContact(userId, contactId, dto);
  }

  /**
   * DELETE /whatsapp-contacts/:id
   * Eliminar un contacto
   */
  @Delete(':id')
  @JwtAuthGuard()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContact(
    @Request() req: any,
    @Param('id') contactId: string,
  ) {
    const userId = req.user?.id || 'test-user';
    await this.whatsappContactsService.deleteContact(userId, contactId);
  }

  /**
   * POST /whatsapp-contacts/delete-bulk
   * Eliminar múltiples contactos
   */
  @Post('delete-bulk')
  @JwtAuthGuard()
  async deleteContacts(
    @Request() req: any,
    @Body() body: { contactIds: string[] },
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.deleteContacts(userId, body.contactIds);
  }

  // ============================================
  // ENVÍO DE MENSAJES
  // ============================================

  /**
   * POST /whatsapp-contacts/messages/send
   * Enviar mensaje a un contacto individual
   */
  @Post('messages/send')
  @JwtAuthGuard()
  async sendMessage(
    @Request() req: any,
    @Body() dto: SendMessageToContactDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.sendMessage(userId, dto);
  }

  /**
   * POST /whatsapp-contacts/messages/send-bulk
   * Enviar mensaje a múltiples contactos
   */
  @Post('messages/send-bulk')
  @JwtAuthGuard()
  async sendBulkMessage(
    @Request() req: any,
    @Body() dto: SendBulkMessageDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.sendBulkMessage(userId, dto);
  }

  /**
   * POST /whatsapp-contacts/messages/share-sweepstake
   * Compartir un sorteo específico con contactos
   */
  @Post('messages/share-sweepstake')
  @JwtAuthGuard()
  async shareSweepstake(
    @Request() req: any,
    @Body() dto: ShareSweepstakeDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.shareSweepstake(userId, dto);
  }

  /**
   * GET /whatsapp-contacts/messages/history
   * Obtener historial de mensajes enviados
   */
  @Get('messages/history')
  @JwtAuthGuard()
  async getMessageHistory(
    @Request() req: any,
    @Query() filters: MessageHistoryFilterDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getMessageHistory(userId, filters);
  }

  // ============================================
  // CONSENTIMIENTO Y OPT-OUT
  // ============================================

  /**
   * GET /whatsapp-contacts/consent/legal-text
   * Obtener texto legal de consentimiento
   */
  @Get('consent/legal-text')
  getConsentLegalText(@Query('language') language: string = 'es') {
    const lang = language === 'en' ? 'en' : 'es';
    return {
      importConsent: CONSENT_LEGAL_TEXT.importConsent[lang],
      sendConsent: CONSENT_LEGAL_TEXT.sendConsent[lang],
      language: lang,
    };
  }

  /**
   * POST /whatsapp-contacts/consent/import
   * Registrar consentimiento de importación
   */
  @Post('consent/import')
  @JwtAuthGuard()
  async recordImportConsent(
    @Request() req: any,
    @Body() dto: RecordImportConsentDto,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.recordImportConsent(userId, dto);
  }

  /**
   * POST /whatsapp-contacts/opt-out
   * Registrar opt-out de un contacto (webhook público)
   * Este endpoint puede ser llamado por el sistema de WhatsApp
   */
  @Post('opt-out')
  @HttpCode(HttpStatus.OK)
  async registerOptOut(@Body() dto: ContactOptOutDto) {
    await this.whatsappContactsService.registerOptOut(dto);
    return { success: true, message: 'Opt-out registrado correctamente' };
  }

  // ============================================
  // ESTADÍSTICAS
  // ============================================

  /**
   * GET /whatsapp-contacts/stats/contacts
   * Obtener estadísticas de contactos
   */
  @Get('stats/contacts')
  @JwtAuthGuard()
  async getContactsStats(@Request() req: any) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getContactsStats(userId);
  }

  /**
   * GET /whatsapp-contacts/stats/messages
   * Obtener estadísticas de mensajes
   */
  @Get('stats/messages')
  @JwtAuthGuard()
  async getMessagingStats(@Request() req: any) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getMessagingStats(userId);
  }

  // ============================================
  // VALIDACIÓN
  // ============================================

  /**
   * POST /whatsapp-contacts/validate-phone
   * Validar formato de número de teléfono
   */
  @Post('validate-phone')
  @JwtAuthGuard()
  async validatePhone(@Body() dto: ValidatePhoneDto) {
    return this.whatsappContactsService.validatePhone(dto);
  }

  // ============================================
  // CONTACTOS SELECCIONABLES
  // ============================================

  /**
   * GET /whatsapp-contacts/selectable
   * Obtener contactos que pueden recibir mensajes
   * (Filtro rápido para UI de selección)
   */
  @Get('selectable')
  @JwtAuthGuard()
  async getSelectableContacts(
    @Request() req: any,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user?.id || 'test-user';
    return this.whatsappContactsService.getContacts(userId, {
      canReceiveMessages: true,
      search,
      limit: limit || 50,
      sortBy: 'name',
      sortOrder: 'asc',
    });
  }

  /**
   * GET /whatsapp-contacts/by-tags
   * Obtener contactos agrupados por tags
   */
  @Get('by-tags')
  @JwtAuthGuard()
  async getContactsByTags(@Request() req: any) {
    const userId = req.user?.id || 'test-user';
    
    // Obtener todos los contactos activos
    const result = await this.whatsappContactsService.getContacts(userId, {
      canReceiveMessages: true,
      limit: 1000,
    });

    // Agrupar por tags
    const byTags: Record<string, any[]> = { 'Sin etiqueta': [] };
    
    for (const contact of result.contacts) {
      if (!contact.tags || contact.tags.length === 0) {
        byTags['Sin etiqueta'].push(contact);
      } else {
        for (const tag of contact.tags) {
          if (!byTags[tag]) {
            byTags[tag] = [];
          }
          byTags[tag].push(contact);
        }
      }
    }

    return {
      tags: Object.keys(byTags).sort(),
      contactsByTag: byTags,
      totalContacts: result.total,
    };
  }
}
