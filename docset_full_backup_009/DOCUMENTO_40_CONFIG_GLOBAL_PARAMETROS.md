# DOCUMENTO 40 – MÓDULO 0.a.40

## CONFIGURACIÓN GLOBAL, UMBRALES, PARÁMETROS Y REGLAS DINÁMICAS DEL SISTEMA

**Documento operativo estratégico**
**Documento clave para flexibilidad, control y escalabilidad**
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento responde a una pregunta fundamental:

> **¿Qué cosas deben poder cambiarse sin volver a programar todo el sistema?**

Si no existe una capa de configuración:
- cada cambio requiere código,
- cada ajuste genera bugs,
- cada país exige un fork,
- el sistema se vuelve rígido.

👉 **Este documento define qué es configurable, quién lo configura y cómo impacta al sistema.**

---

## 2. Principio rector

> **Las reglas cambian, el código no debería hacerlo cada vez.**

Por tanto:
- los valores críticos son **parámetros**,
- no constantes fijas en código.

```
┌─────────────────────────────────────────────────────────────┐
│              PRINCIPIO DE CONFIGURACIÓN                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ❌ ANTES (mal)                                          │
│     const MIN_WITHDRAWAL = 50;  // Hardcodeado              │
│     const KYC_THRESHOLD = 1000; // Fijo en código           │
│                                                             │
│     ✅ AHORA (bien)                                         │
│     const MIN_WITHDRAWAL = config.get('money.minWithdrawal')│
│     const KYC_THRESHOLD = config.get('kyc.level2Threshold') │
│                                                             │
│     → Cambio de valor = Cambio en config, no en código      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tipos de CONFIGURACIÓN GLOBAL

La plataforma debe tener una **capa central de configuración**, accesible solo desde el panel administrativo.

Se divide en los siguientes bloques:

| Bloque | Descripción |
|--------|-------------|
| **Económicos** | Umbrales, fees, porcentajes |
| **Sorteos** | Límites, duraciones, reglas |
| **Premios** | Valores, tipos, evidencias |
| **Causas** | Requisitos, documentos, categorías |
| **KYC** | Niveles, proveedores, triggers |
| **Mensajería** | Frecuencias, canales, idiomas |
| **Fraude** | Flags, umbrales, bloqueos |
| **Geolocalización** | Precisión, países activos |
| **Legal** | Versiones, textos, idiomas |

---

## 4. Parámetros ECONÓMICOS

### 4.1 Umbrales de dinero

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Monto mínimo para solicitar liberación | `money.minWithdrawal` | Decimal | €10.00 |
| Monto que activa KYC Nivel 2 | `money.kycLevel2Threshold` | Decimal | €1,000.00 |
| Monto máximo sin revisión manual | `money.maxAutoRelease` | Decimal | €500.00 |
| Tiempo mínimo de retención (días) | `money.minRetentionDays` | Integer | 7 |
| Tiempo de retención por defecto (días) | `money.defaultRetentionDays` | Integer | 14 |

**Ejemplo conceptual:**
> "Si el monto ≥ X → revisión manual"

> 👉 **Nunca hardcodear montos.**

### 4.2 Porcentajes y fees

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Fee de la plataforma | `fees.platformFee` | Percentage | 5% |
| Porcentaje a causa | `fees.causeShare` | Percentage | 70% |
| Porcentaje a creador de sorteo | `fees.creatorShare` | Percentage | 25% |
| Fee por procesamiento de pago | `fees.paymentProcessing` | Percentage | 2.9% |

> 👉 **Los porcentajes no viven en el código, viven en configuración.**

### Implementación:

```typescript
// Uso en código
const platformFee = await configService.get('fees.platformFee');
const distribution = await economicEngine.calculateDistribution(amount, {
  platformFee,
  causeShare: await configService.get('fees.causeShare'),
  creatorShare: await configService.get('fees.creatorShare')
});
```

---

## 5. Parámetros de SORTEOS

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Máximo boletos por usuario | `raffle.maxTicketsPerUser` | Integer | 100 |
| Boletos por € donado | `raffle.ticketsPerEuro` | Integer | 1 |
| Boletos bonus por plan Pro | `raffle.bonusTicketsPro` | Integer | 2 |
| Boletos bonus por plan Premium | `raffle.bonusTicketsPremium` | Integer | 5 |
| Boletos bonus por plan Elite | `raffle.bonusTicketsElite` | Integer | 10 |
| Duración mínima (días) | `raffle.minDurationDays` | Integer | 1 |
| Duración máxima (días) | `raffle.maxDurationDays` | Integer | 90 |
| Sorteos activos máx por usuario | `raffle.maxActivePerUser` | Integer | 5 |
| Participantes mínimos | `raffle.minParticipants` | Integer | 10 |

> 👉 **Esto permite experimentar sin redeploy.**

---

## 6. Parámetros de PREMIOS

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Valor máximo sin revisión | `prize.maxValueNoReview` | Decimal | €500.00 |
| Días máx para entrega física | `prize.maxDeliveryDaysPhysical` | Integer | 30 |
| Días máx para entrega digital | `prize.maxDeliveryDaysDigital` | Integer | 7 |
| Tipos permitidos | `prize.allowedTypes` | Array | ["physical", "digital", "experience"] |
| Evidencia obligatoria física | `prize.evidenceRequiredPhysical` | Boolean | true |
| Evidencia obligatoria digital | `prize.evidenceRequiredDigital` | Boolean | false |

**Ejemplo:**
> "Premios > X valor → evidencia reforzada"

```typescript
// Lógica de evidencia
const prizeValue = prize.estimatedValue;
const threshold = await configService.get('prize.maxValueNoReview');

if (prizeValue > threshold) {
  prize.requiresEnhancedEvidence = true;
  prize.requiresManualReview = true;
}
```

---

## 7. Parámetros de CAUSAS

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Docs obligatorios causa propia | `cause.requiredDocsOwn` | Array | ["registration", "id", "bank"] |
| Docs obligatorios causa externa | `cause.requiredDocsExternal` | Array | ["authorization"] |
| Días para revisión | `cause.reviewDays` | Integer | 5 |
| Categorías activas | `cause.activeCategories` | Array | ["health", "education", "environment"] |
| Meta mínima (€) | `cause.minGoal` | Decimal | €100.00 |
| Meta máxima (€) | `cause.maxGoal` | Decimal | €1,000,000.00 |

> 👉 **Facilita cumplimiento legal local.**

### Configuración por país:

```typescript
// Categorías pueden variar por país
const categories = await configService.get('cause.activeCategories', { country: 'ES' });
```

---

## 8. Parámetros de KYC y VERIFICACIÓN

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Trigger KYC Nivel 1 | `kyc.level1Triggers` | Array | ["first_withdrawal", "money_received"] |
| Trigger KYC Nivel 2 | `kyc.level2Triggers` | Array | ["threshold_exceeded", "high_value_prize"] |
| Umbral KYC Nivel 2 (€) | `kyc.level2Threshold` | Decimal | €1,000.00 |
| Proveedor activo | `kyc.activeProvider` | String | "veriff" |
| Timeout verificación (min) | `kyc.verificationTimeout` | Integer | 30 |
| Reintentos permitidos | `kyc.maxRetries` | Integer | 3 |
| Días validez KYC | `kyc.validityDays` | Integer | 365 |

> 👉 **Permite cambiar proveedor sin rehacer sistema.**

```typescript
// Cambio de proveedor = cambio de config
const provider = await configService.get('kyc.activeProvider');
const kycService = this.kycProviderFactory.get(provider); // 'veriff', 'onfido', etc.
```

---

## 9. Parámetros de MENSAJERÍA y ENGAGEMENT

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Máx mensajes/día/usuario | `messaging.maxPerDay` | Integer | 5 |
| Tiempo mín entre mensajes (min) | `messaging.minGapMinutes` | Integer | 60 |
| Hora inicio permitida | `messaging.allowedHoursStart` | Integer | 9 |
| Hora fin permitida | `messaging.allowedHoursEnd` | Integer | 21 |
| Canales activos | `messaging.activeChannels` | Array | ["push", "email", "internal"] |
| Idiomas activos | `messaging.activeLanguages` | Array | ["ES", "EN", "FR", "DE"] |
| Idioma por defecto | `messaging.defaultLanguage` | String | "ES" |

> 👉 **Evita spam y errores de comunicación.**

### Eventos que disparan mensajes (configurable):

```typescript
const messageEvents = await configService.get('messaging.triggerEvents');
// ["PARTICIPATION_CONFIRMED", "DONATION_THANKS", "WINNER_NOTIFICATION", ...]
```

---

## 10. Parámetros de FRAUDE y SEGURIDAD

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Flags antes de suspensión auto | `fraud.flagsBeforeSuspension` | Integer | 3 |
| Flags antes de bloqueo | `fraud.flagsBeforeBlock` | Integer | 5 |
| Participaciones/hora sospechosas | `fraud.suspiciousParticipationsPerHour` | Integer | 50 |
| IPs máx por cuenta | `fraud.maxIpsPerAccount` | Integer | 10 |
| Cuentas máx por IP | `fraud.maxAccountsPerIp` | Integer | 3 |
| Días para análisis de patrones | `fraud.patternAnalysisDays` | Integer | 30 |

> 👉 **El fraude evoluciona, las reglas también.**

```typescript
// Detección configurable
const threshold = await configService.get('fraud.suspiciousParticipationsPerHour');
const participations = await this.getParticipationsLastHour(userId);

if (participations.length > threshold) {
  await this.flagService.addFlag('USER', userId, 'SUSPICIOUS_ACTIVITY');
}
```

---

## 11. Parámetros de GEOLOCALIZACIÓN

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Nivel de precisión | `geo.precisionLevel` | String | "city" |
| Mostrar en dashboard creador | `geo.showInCreatorDashboard` | Boolean | true |
| Países activos | `geo.activeCountries` | Array | ["ES", "MX", "AR", "CO"] |
| Países bloqueados | `geo.blockedCountries` | Array | ["XX", "YY"] |
| Requiere consentimiento explícito | `geo.requireExplicitConsent` | Boolean | true |

> 👉 **Cumplimiento legal por país.**

---

## 12. Parámetros LEGALES

| Parámetro | Clave | Tipo | Ejemplo |
|-----------|-------|------|---------|
| Versión activa TOS | `legal.activeTosVersion` | String | "2.1" |
| Versión activa Privacy | `legal.activePrivacyVersion` | String | "1.3" |
| Idiomas TOS disponibles | `legal.tosLanguages` | Array | ["ES", "EN"] |
| Edad mínima | `legal.minimumAge` | Integer | 18 |
| Requiere aceptación explícita | `legal.requireExplicitAcceptance` | Boolean | true |

> 👉 **Permite adaptar la app a nuevos mercados.**

### Configuración por país:

```typescript
// Textos legales pueden variar por jurisdicción
const tosVersion = await configService.get('legal.activeTosVersion', { country: 'ES' });
const privacyVersion = await configService.get('legal.activePrivacyVersion', { country: 'ES' });
```

---

## 13. Dónde viven estos parámetros (arquitectura)

### ❌ NO hacer:

- Variables sueltas en código
- Archivos hardcodeados
- `.env` con valores de negocio
- Constantes distribuidas

### ✅ SÍ hacer:

- **Entidad de configuración centralizada**
- Cacheable (Redis)
- Versionable (histórico)
- Auditable (logs de cambios)

> 👉 **Cada cambio debe generar log (ver Doc 37).**

### Tabla: `system_config`

```sql
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    config_key VARCHAR(100) NOT NULL,
    config_group VARCHAR(50) NOT NULL, -- money, raffle, prize, cause, kyc, etc.
    
    -- Valor
    value_type VARCHAR(20) NOT NULL, -- string, integer, decimal, boolean, json, array
    value_string VARCHAR(500),
    value_integer INTEGER,
    value_decimal DECIMAL(15, 4),
    value_boolean BOOLEAN,
    value_json JSONB,
    
    -- Contexto opcional
    country_code CHAR(2), -- NULL = global, 'ES' = solo España
    
    -- Metadata
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE, -- No mostrar en logs
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Versionado
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(config_key, country_code)
);

CREATE INDEX idx_config_key ON system_config(config_key);
CREATE INDEX idx_config_group ON system_config(config_group);
CREATE INDEX idx_config_country ON system_config(country_code);
```

### Tabla: `system_config_history`

```sql
CREATE TABLE system_config_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Config original
    config_id UUID NOT NULL REFERENCES system_config(id),
    config_key VARCHAR(100) NOT NULL,
    
    -- Valores anteriores
    old_value JSONB NOT NULL,
    new_value JSONB NOT NULL,
    
    -- Quién y cuándo
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Motivo
    change_reason TEXT
);

CREATE INDEX idx_config_history_config ON system_config_history(config_id);
CREATE INDEX idx_config_history_key ON system_config_history(config_key);
CREATE INDEX idx_config_history_date ON system_config_history(changed_at DESC);
```

---

## 14. Servicio de configuración (backend)

```typescript
// config.service.ts

@Injectable()
export class ConfigService {
  private cache: Map<string, CachedConfig> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  
  async get<T>(key: string, options?: { country?: string }): Promise<T> {
    const cacheKey = `${key}:${options?.country || 'global'}`;
    
    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.value as T;
    }
    
    // 2. Fetch from DB
    const config = await this.prisma.systemConfig.findFirst({
      where: {
        configKey: key,
        isActive: true,
        OR: [
          { countryCode: options?.country },
          { countryCode: null } // Fallback a global
        ]
      },
      orderBy: {
        countryCode: 'desc' // Prioriza específico sobre global
      }
    });
    
    if (!config) {
      throw new Error(`Config not found: ${key}`);
    }
    
    // 3. Extract value by type
    const value = this.extractValue(config);
    
    // 4. Cache result
    this.cache.set(cacheKey, { value, timestamp: Date.now() });
    
    return value as T;
  }
  
  async set(
    key: string, 
    value: any, 
    options: { 
      country?: string; 
      changedBy: string; 
      reason?: string 
    }
  ): Promise<void> {
    const existing = await this.prisma.systemConfig.findFirst({
      where: { configKey: key, countryCode: options.country || null }
    });
    
    if (existing) {
      // 1. Save history
      await this.prisma.systemConfigHistory.create({
        data: {
          configId: existing.id,
          configKey: key,
          oldValue: this.extractValue(existing),
          newValue: value,
          changedBy: options.changedBy,
          changeReason: options.reason
        }
      });
      
      // 2. Update config
      await this.prisma.systemConfig.update({
        where: { id: existing.id },
        data: {
          ...this.buildValueFields(value),
          version: existing.version + 1,
          updatedAt: new Date(),
          updatedBy: options.changedBy
        }
      });
    } else {
      // Create new config
      await this.prisma.systemConfig.create({
        data: {
          configKey: key,
          configGroup: this.extractGroup(key),
          countryCode: options.country,
          ...this.buildValueFields(value),
          createdBy: options.changedBy
        }
      });
    }
    
    // 3. Invalidate cache
    this.invalidateCache(key);
    
    // 4. Audit log
    await this.auditService.log({
      eventType: 'CONFIG_CHANGED',
      entityType: 'SYSTEM_CONFIG',
      entityId: key,
      actorId: options.changedBy,
      actorType: 'ADMIN',
      metadata: { 
        key, 
        newValue: value, 
        reason: options.reason,
        country: options.country 
      },
      category: 'OPERATIONAL'
    });
  }
  
  async getAll(group?: string): Promise<ConfigItem[]> {
    const configs = await this.prisma.systemConfig.findMany({
      where: {
        isActive: true,
        ...(group && { configGroup: group })
      },
      orderBy: [
        { configGroup: 'asc' },
        { configKey: 'asc' }
      ]
    });
    
    return configs.map(c => ({
      key: c.configKey,
      group: c.configGroup,
      value: this.extractValue(c),
      country: c.countryCode,
      description: c.description,
      version: c.version,
      updatedAt: c.updatedAt
    }));
  }
  
  async getHistory(key: string): Promise<ConfigHistory[]> {
    return this.prisma.systemConfigHistory.findMany({
      where: { configKey: key },
      orderBy: { changedAt: 'desc' },
      include: {
        changedByUser: { select: { id: true, name: true, email: true } }
      }
    });
  }
  
  private extractValue(config: SystemConfig): any {
    switch (config.valueType) {
      case 'string': return config.valueString;
      case 'integer': return config.valueInteger;
      case 'decimal': return Number(config.valueDecimal);
      case 'boolean': return config.valueBoolean;
      case 'json':
      case 'array': return config.valueJson;
      default: return config.valueString;
    }
  }
  
  private buildValueFields(value: any): Partial<SystemConfig> {
    const type = this.detectType(value);
    return {
      valueType: type,
      valueString: type === 'string' ? value : null,
      valueInteger: type === 'integer' ? value : null,
      valueDecimal: type === 'decimal' ? value : null,
      valueBoolean: type === 'boolean' ? value : null,
      valueJson: ['json', 'array'].includes(type) ? value : null
    };
  }
  
  private invalidateCache(key: string): void {
    for (const cacheKey of this.cache.keys()) {
      if (cacheKey.startsWith(key)) {
        this.cache.delete(cacheKey);
      }
    }
  }
}
```

---

## 15. Quién puede cambiar configuraciones

### Reglas de acceso:

| Acción | Rol requerido |
|--------|---------------|
| Ver configuración | Admin (cualquier nivel) |
| Cambiar parámetros operativos | Admin Operativo |
| Cambiar parámetros financieros | Admin Financiero + confirmación |
| Cambiar parámetros legales | Admin Legal + confirmación |
| Cambiar todo | Admin Global |

### Cambios sensibles requieren:

- ✅ Confirmación explícita
- ✅ Motivo obligatorio
- ✅ Log de auditoría
- ✅ Notificación a otros admins

> 👉 **Nunca permitir cambios anónimos o sin log.**

### API: Gestión de configuración

```typescript
// GET /api/admin/config
// GET /api/admin/config?group=money
// GET /api/admin/config/:key
// GET /api/admin/config/:key/history

// PUT /api/admin/config/:key
interface UpdateConfigRequest {
  value: any;
  country?: string;
  reason: string; // Obligatorio
  confirmationCode?: string; // Para cambios sensibles
}
```

---

## 16. Qué NO debe ser configurable

```
┌─────────────────────────────────────────────────────────────┐
│              DATOS INMUTABLES - NO CONFIGURABLES            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Ganadores de sorteos                                    │
│  ❌ Historial de dinero / transacciones                     │
│  ❌ Logs de auditoría                                       │
│  ❌ Backups                                                 │
│  ❌ Evidencias subidas                                      │
│  ❌ Consentimientos aceptados                               │
│  ❌ Timestamps de eventos                                   │
│  ❌ IDs de entidades                                        │
│                                                             │
│  Estas cosas son INMUTABLES por diseño.                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 17. Valores por defecto iniciales

### Configuración inicial recomendada:

```sql
-- Económicos
INSERT INTO system_config (config_key, config_group, value_type, value_decimal, description) VALUES
('money.minWithdrawal', 'money', 'decimal', 10.00, 'Monto mínimo para solicitar retiro'),
('money.kycLevel2Threshold', 'money', 'decimal', 1000.00, 'Monto que activa KYC Nivel 2'),
('money.maxAutoRelease', 'money', 'decimal', 500.00, 'Monto máximo sin revisión manual'),
('money.minRetentionDays', 'money', 'integer', 7, 'Días mínimos de retención');

-- Fees
INSERT INTO system_config (config_key, config_group, value_type, value_decimal, description) VALUES
('fees.platformFee', 'fees', 'decimal', 0.05, 'Fee de la plataforma (5%)'),
('fees.causeShare', 'fees', 'decimal', 0.70, 'Porcentaje para la causa (70%)'),
('fees.creatorShare', 'fees', 'decimal', 0.25, 'Porcentaje para el creador (25%)');

-- Sorteos
INSERT INTO system_config (config_key, config_group, value_type, value_integer, description) VALUES
('raffle.maxTicketsPerUser', 'raffle', 'integer', 100, 'Máximo boletos por usuario'),
('raffle.ticketsPerEuro', 'raffle', 'integer', 1, 'Boletos por euro donado'),
('raffle.maxDurationDays', 'raffle', 'integer', 90, 'Duración máxima en días'),
('raffle.minParticipants', 'raffle', 'integer', 10, 'Participantes mínimos');

-- KYC
INSERT INTO system_config (config_key, config_group, value_type, value_string, description) VALUES
('kyc.activeProvider', 'kyc', 'string', 'veriff', 'Proveedor KYC activo');
INSERT INTO system_config (config_key, config_group, value_type, value_integer, description) VALUES
('kyc.maxRetries', 'kyc', 'integer', 3, 'Reintentos permitidos'),
('kyc.validityDays', 'kyc', 'integer', 365, 'Días de validez del KYC');

-- Fraude
INSERT INTO system_config (config_key, config_group, value_type, value_integer, description) VALUES
('fraud.flagsBeforeSuspension', 'fraud', 'integer', 3, 'Flags antes de suspensión'),
('fraud.flagsBeforeBlock', 'fraud', 'integer', 5, 'Flags antes de bloqueo'),
('fraud.maxAccountsPerIp', 'fraud', 'integer', 3, 'Cuentas máximas por IP');

-- Mensajería
INSERT INTO system_config (config_key, config_group, value_type, value_integer, description) VALUES
('messaging.maxPerDay', 'messaging', 'integer', 5, 'Mensajes máx por día por usuario'),
('messaging.minGapMinutes', 'messaging', 'integer', 60, 'Minutos mín entre mensajes');
INSERT INTO system_config (config_key, config_group, value_type, value_json, description) VALUES
('messaging.activeChannels', 'messaging', 'array', '["push", "email", "internal"]', 'Canales activos'),
('messaging.activeLanguages', 'messaging', 'array', '["ES", "EN"]', 'Idiomas activos');
```

---

## 18. Checklist para el programador IA

### Antes de cerrar este módulo:

| ✅ | Requisito |
|----|-----------|
| ☐ | Configuración centralizada (tabla + servicio) |
| ☐ | Parámetros económicos externos al código |
| ☐ | Parámetros de sorteos configurables |
| ☐ | Parámetros de premios configurables |
| ☐ | Parámetros de causas configurables |
| ☐ | Parámetros de KYC configurables |
| ☐ | Parámetros de mensajería configurables |
| ☐ | Parámetros de fraude configurables |
| ☐ | Cache de configuración |
| ☐ | Versionado e histórico |
| ☐ | Logs de cambios (Doc 37) |
| ☐ | API admin para gestión |
| ☐ | Soporte multi-país |

---

## 19. CHECKPOINT DE RESPALDO (CONFIGURACIÓN)

### IA del programador:

**Antes de implementar este módulo:**

1. ✅ Realiza respaldo completo del proyecto.
2. ✅ No edites backups previos.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_40_CONFIG_GLOBAL
VERSION: docset_full_backup_009
```

---

## 20. Resumen ejecutivo

### Bloques de configuración:

| Bloque | Parámetros clave |
|--------|------------------|
| **Económicos** | minWithdrawal, fees, thresholds |
| **Sorteos** | maxTickets, durations, participants |
| **Premios** | maxValue, deliveryDays, evidenceRequired |
| **Causas** | requiredDocs, reviewDays, categories |
| **KYC** | triggers, provider, timeout |
| **Mensajería** | maxPerDay, channels, languages |
| **Fraude** | flagsThresholds, patterns |
| **Legal** | versions, minimumAge |

### Reglas de oro:

1. **Valores críticos = Parámetros, no constantes**
2. **Todo cambio genera log**
3. **Cache + versionado + auditoría**
4. **Soporte multi-país desde el diseño**
5. **Inmutables son inmutables (ganadores, logs, evidencias)**

---

## 21. Cierre

Este documento es lo que convierte la plataforma en:

- ✅ **Adaptable** (cambios sin código)
- ✅ **Gobernable** (control centralizado)
- ✅ **Escalable** (multi-país, multi-mercado)
- ✅ **Preparada para crecer sin caos**

---

```
=========================================================
FIN DEL DOCUMENTO 40
MÓDULO 0.a.40 — CONFIGURACIÓN GLOBAL Y PARÁMETROS
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
