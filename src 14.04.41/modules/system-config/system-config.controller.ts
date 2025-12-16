// DOCUMENTO 40 - CONFIGURACIÓN GLOBAL Y PARÁMETROS
// Controlador admin para gestión de configuración
// Referencia: DOC 40 seccion 15

import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { ConfigGroup, UpdateConfigRequest, SENSITIVE_CONFIG_KEYS } from './system-config.types';

@Controller('admin/config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  // ==========================================================================
  // LECTURA (DOC 40 seccion 15)
  // ==========================================================================

  /**
   * GET /admin/config
   * Lista todas las configuraciones, opcionalmente filtradas por grupo
   */
  @Get()
  async getAll(@Query('group') group?: ConfigGroup) {
    return this.configService.getAll(group);
  }

  /**
   * GET /admin/config/group/:group
   * Obtiene configuraciones de un grupo específico
   */
  @Get('group/:group')
  async getByGroup(
    @Param('group') group: ConfigGroup,
    @Query('country') country?: string,
  ) {
    return this.configService.getByGroup(group, { country });
  }

  /**
   * GET /admin/config/key/:key
   * Obtiene una configuración específica
   */
  @Get('key/:key')
  async getByKey(
    @Param('key') key: string,
    @Query('country') country?: string,
  ) {
    const value = await this.configService.get(key, { country });
    return {
      key,
      value,
      country: country || 'global',
    };
  }

  /**
   * GET /admin/config/key/:key/history
   * Obtiene el historial de cambios de una configuración
   */
  @Get('key/:key/history')
  async getHistory(@Param('key') key: string) {
    return this.configService.getHistory(key);
  }

  // ==========================================================================
  // ESCRITURA (DOC 40 seccion 15)
  // ==========================================================================

  /**
   * PUT /admin/config/key/:key
   * Actualiza una configuración
   * DOC 40: Cambios sensibles requieren confirmación y motivo obligatorio
   */
  @Put('key/:key')
  async updateConfig(
    @Param('key') key: string,
    @Body() body: UpdateConfigRequest,
    @Request() req: any,
  ) {
    // Verificar si es sensible y requiere confirmación
    const isSensitive = SENSITIVE_CONFIG_KEYS.includes(key as any);
    if (isSensitive && !body.confirmationCode) {
      return {
        requiresConfirmation: true,
        message: 'Esta configuración es sensible y requiere código de confirmación',
        key,
      };
    }

    await this.configService.set(key, body.value, {
      country: body.country,
      changedBy: req.user?.id || 'SYSTEM',
      reason: body.reason,
    });

    return {
      success: true,
      key,
      value: body.value,
      country: body.country || 'global',
    };
  }

  /**
   * POST /admin/config/seed
   * Carga los valores por defecto (DOC 40 seccion 17)
   */
  @Post('seed')
  async seedDefaults(@Request() req: any) {
    const result = await this.configService.seedDefaults(
      req.user?.id || 'SYSTEM',
    );
    return {
      success: true,
      ...result,
    };
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * GET /admin/config/sensitive-keys
   * Lista las claves que requieren confirmación adicional
   */
  @Get('sensitive-keys')
  getSensitiveKeys() {
    return {
      keys: SENSITIVE_CONFIG_KEYS,
      message: 'Estas claves requieren confirmación adicional para modificarse',
    };
  }

  /**
   * POST /admin/config/clear-cache
   * Limpia la cache de configuración
   */
  @Post('clear-cache')
  clearCache() {
    this.configService.clearCache();
    return { success: true, message: 'Cache limpiada' };
  }
}
