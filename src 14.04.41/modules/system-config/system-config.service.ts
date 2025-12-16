// DOCUMENTO 40 - CONFIGURACIÓN GLOBAL Y PARÁMETROS
// Servicio centralizado de configuración
// Referencia: DOC 40 seccion 14

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import {
  ConfigGroup,
  ConfigValueType,
  ConfigItem,
  ConfigHistory,
  ConfigGetOptions,
  DEFAULT_CONFIGS,
  SENSITIVE_CONFIG_KEYS,
} from './system-config.types';

interface CachedConfig {
  value: any;
  timestamp: number;
}

@Injectable()
export class SystemConfigService {
  private cache: Map<string, CachedConfig> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos (DOC 40 seccion 14)

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  // ==========================================================================
  // OBTENER CONFIGURACIÓN (DOC 40 seccion 14)
  // ==========================================================================

  /**
   * Obtiene un valor de configuración por clave
   * Soporta multi-país con fallback a global
   */
  async get<T>(key: string, options?: ConfigGetOptions): Promise<T> {
    const cacheKey = `${key}:${options?.country || 'global'}`;

    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value as T;
    }

    // 2. Fetch from DB con fallback a global
    const config = await this.prisma.systemConfig.findFirst({
      where: {
        configKey: key,
        isActive: true,
        OR: [
          { countryCode: options?.country || null },
          { countryCode: null },
        ],
      },
      orderBy: {
        countryCode: 'desc', // Prioriza específico sobre global
      },
    });

    if (!config) {
      throw new NotFoundException(`Configuración no encontrada: ${key}`);
    }

    // 3. Extract value by type
    const value = this.extractValue(config);

    // 4. Cache result
    this.cache.set(cacheKey, { value, timestamp: Date.now() });

    return value as T;
  }

  /**
   * Obtiene valor con fallback a default si no existe
   */
  async getOrDefault<T>(key: string, defaultValue: T, options?: ConfigGetOptions): Promise<T> {
    try {
      return await this.get<T>(key, options);
    } catch {
      return defaultValue;
    }
  }

  /**
   * Obtiene múltiples configuraciones de un grupo
   */
  async getByGroup(group: ConfigGroup, options?: ConfigGetOptions): Promise<ConfigItem[]> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        configGroup: group,
        isActive: true,
        OR: [
          { countryCode: options?.country || null },
          { countryCode: null },
        ],
      },
      orderBy: [
        { configKey: 'asc' },
        { countryCode: 'desc' },
      ],
    });

    // Deduplicar por key (priorizar país específico)
    const uniqueConfigs = new Map<string, any>();
    for (const config of configs) {
      if (!uniqueConfigs.has(config.configKey)) {
        uniqueConfigs.set(config.configKey, config);
      }
    }

    return Array.from(uniqueConfigs.values()).map((c) => ({
      key: c.configKey,
      group: c.configGroup,
      value: this.extractValue(c),
      valueType: c.valueType,
      country: c.countryCode,
      description: c.description,
      version: c.version,
      updatedAt: c.updatedAt,
    }));
  }

  /**
   * Obtiene todas las configuraciones
   */
  async getAll(group?: ConfigGroup): Promise<ConfigItem[]> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        isActive: true,
        ...(group && { configGroup: group }),
      },
      orderBy: [
        { configGroup: 'asc' },
        { configKey: 'asc' },
      ],
    });

    return configs.map((c) => ({
      key: c.configKey,
      group: c.configGroup as ConfigGroup,
      value: this.extractValue(c),
      valueType: c.valueType as ConfigValueType,
      country: c.countryCode || undefined,
      description: c.description || undefined,
      version: c.version,
      updatedAt: c.updatedAt,
    }));
  }

  // ==========================================================================
  // ESTABLECER CONFIGURACIÓN (DOC 40 seccion 14)
  // ==========================================================================

  /**
   * Establece un valor de configuración
   * Guarda historial y genera log de auditoría
   */
  async set(
    key: string,
    value: any,
    options: {
      country?: string;
      changedBy: string;
      reason?: string;
    },
  ): Promise<void> {
    const existing = await this.prisma.systemConfig.findFirst({
      where: {
        configKey: key,
        countryCode: options.country || null,
      },
    });

    if (existing) {
      // 1. Save history (DOC 40 seccion 13)
      await this.prisma.systemConfigHistory.create({
        data: {
          configId: existing.id,
          configKey: key,
          oldValue: this.extractValue(existing),
          newValue: value,
          changedBy: options.changedBy,
          changeReason: options.reason,
        },
      });

      // 2. Update config
      await this.prisma.systemConfig.update({
        where: { id: existing.id },
        data: {
          ...this.buildValueFields(value),
          version: existing.version + 1,
          updatedBy: options.changedBy,
        },
      });
    } else {
      // Create new config
      await this.prisma.systemConfig.create({
        data: {
          configKey: key,
          configGroup: this.extractGroup(key),
          countryCode: options.country,
          ...this.buildValueFields(value),
          createdBy: options.changedBy,
        },
      });
    }

    // 3. Invalidate cache
    this.invalidateCache(key);

    // 4. Audit log (DOC 37 + DOC 40)
    const isSensitive = SENSITIVE_CONFIG_KEYS.includes(key as any);
    await this.auditLog.log({
      eventType: 'CONFIG_CHANGED',
      entityType: 'SystemConfig',
      entityId: key,
      actorId: options.changedBy,
      actorType: 'ADMIN',
      metadata: {
        key,
        newValue: isSensitive ? '[SENSITIVE]' : value,
        reason: options.reason,
        country: options.country,
      },
      category: 'OPERATIONAL',
    });
  }

  // ==========================================================================
  // HISTORIAL (DOC 40 seccion 13)
  // ==========================================================================

  /**
   * Obtiene el historial de cambios de una configuración
   */
  async getHistory(key: string): Promise<ConfigHistory[]> {
    const history = await this.prisma.systemConfigHistory.findMany({
      where: { configKey: key },
      orderBy: { changedAt: 'desc' },
    });

    return history.map((h) => ({
      id: h.id,
      configKey: h.configKey,
      oldValue: h.oldValue,
      newValue: h.newValue,
      changedBy: h.changedBy,
      changedAt: h.changedAt,
      changeReason: h.changeReason || undefined,
    }));
  }

  // ==========================================================================
  // SEED DE VALORES POR DEFECTO (DOC 40 seccion 17)
  // ==========================================================================

  /**
   * Carga los valores por defecto iniciales
   */
  async seedDefaults(createdBy: string): Promise<{ created: number; existing: number }> {
    let created = 0;
    let existing = 0;

    for (const config of DEFAULT_CONFIGS) {
      const exists = await this.prisma.systemConfig.findFirst({
        where: {
          configKey: config.key,
          countryCode: null,
        },
      });

      if (!exists) {
        await this.prisma.systemConfig.create({
          data: {
            configKey: config.key,
            configGroup: config.group,
            ...this.buildValueFields(config.value),
            description: config.description,
            isSensitive: config.isSensitive || false,
            createdBy,
          },
        });
        created++;
      } else {
        existing++;
      }
    }

    await this.auditLog.log({
      eventType: 'CONFIG_SEED_EXECUTED',
      entityType: 'SystemConfig',
      entityId: 'SEED',
      actorId: createdBy,
      actorType: 'ADMIN',
      metadata: { created, existing },
      category: 'OPERATIONAL',
    });

    return { created, existing };
  }

  // ==========================================================================
  // HELPERS PRIVADOS
  // ==========================================================================

  private extractValue(config: any): any {
    switch (config.valueType) {
      case 'STRING':
        return config.valueString;
      case 'INTEGER':
        return config.valueInteger;
      case 'DECIMAL':
        return config.valueDecimal ? Number(config.valueDecimal) : null;
      case 'BOOLEAN':
        return config.valueBoolean;
      case 'JSON':
      case 'ARRAY':
        return config.valueJson;
      default:
        return config.valueString;
    }
  }

  private buildValueFields(value: any): Record<string, any> {
    const type = this.detectType(value);
    return {
      valueType: type,
      valueString: type === 'STRING' ? value : null,
      valueInteger: type === 'INTEGER' ? value : null,
      valueDecimal: type === 'DECIMAL' ? value : null,
      valueBoolean: type === 'BOOLEAN' ? value : null,
      valueJson: ['JSON', 'ARRAY'].includes(type) ? value : null,
    };
  }

  private detectType(value: any): ConfigValueType {
    if (typeof value === 'string') return 'STRING';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
    }
    if (Array.isArray(value)) return 'ARRAY';
    if (typeof value === 'object') return 'JSON';
    return 'STRING';
  }

  private extractGroup(key: string): ConfigGroup {
    const prefix = key.split('.')[0].toUpperCase();
    const validGroups: ConfigGroup[] = [
      'MONEY', 'FEES', 'RAFFLE', 'PRIZE', 'CAUSE',
      'KYC', 'MESSAGING', 'FRAUD', 'GEO', 'LEGAL', 'SYSTEM',
    ];
    return validGroups.includes(prefix as ConfigGroup)
      ? (prefix as ConfigGroup)
      : 'SYSTEM';
  }

  private invalidateCache(key: string): void {
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(key)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  /**
   * Limpia toda la cache (útil para testing)
   */
  clearCache(): void {
    this.cache.clear();
  }
}
