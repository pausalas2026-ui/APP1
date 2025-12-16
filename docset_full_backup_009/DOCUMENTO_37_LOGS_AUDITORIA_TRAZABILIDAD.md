# DOCUMENTO 37 – MÓDULO 0.a.36

## LOGS, AUDITORÍA, TRAZABILIDAD Y REGISTRO INMUTABLE DE EVENTOS

**Documento operativo crítico**
**Documento de protección legal y técnica**
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento responde a una pregunta clave:

> **Si mañana alguien reclama "yo no acepté", "yo no gané", "yo entregué el premio", "yo no recibí el dinero"… ¿cómo lo demostramos?**

Sin logs y trazabilidad:
- no hay defensa,
- no hay auditoría,
- no hay confianza,
- no hay escalabilidad.

👉 **Este documento define QUÉ se registra, CUÁNDO se registra y CÓMO se consulta.**

---

## 2. Principio rector

> **Todo evento importante debe dejar huella permanente.**

Si algo:
- mueve dinero,
- asigna un premio,
- acepta un consentimiento,
- envía un mensaje,
- cambia un estado,

👉 **DEBE registrarse.**

```
┌─────────────────────────────────────────────────────────────┐
│                  PRINCIPIO DE TRAZABILIDAD                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     EVENTO IMPORTANTE  ──────▶  LOG INMUTABLE               │
│                                                             │
│     ✅ Mueve dinero          → LOG                          │
│     ✅ Asigna premio         → LOG                          │
│     ✅ Acepta términos       → LOG                          │
│     ✅ Envía mensaje         → LOG                          │
│     ✅ Cambia estado         → LOG                          │
│     ✅ KYC procesado         → LOG                          │
│     ✅ Sorteo ejecutado      → LOG                          │
│                                                             │
│     ❌ Sin log = Sin evidencia = Vulnerabilidad legal       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Qué es un EVENTO (definición simple)

Un evento es **cualquier acción relevante dentro del sistema**.

### Ejemplos de eventos:

| Categoría | Eventos |
|-----------|---------|
| Usuario | Registro, login, cambio de perfil, aceptación de términos |
| Sorteo | Creación, ejecución, selección de ganador |
| Premio | Entrega declarada, evidencia subida, confirmación |
| Dinero | Creación, cambio de estado, liberación, bloqueo |
| KYC | Inicio, resultado, aprobación, rechazo |
| Mensajería | Envío, entrega, fallo |

---

## 4. Tipos de logs que DEBEN existir

### 4.1 Logs de usuario

**Registrar:**
- creación de cuenta,
- login,
- cambios de perfil,
- aceptación de documentos legales,
- intentos fallidos relevantes.

```sql
-- Eventos de usuario
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('USER_REGISTERED', 'USER', user_id, user_id, '{"method": "email"}'),
  ('USER_LOGIN', 'USER', user_id, user_id, '{"ip": "1.2.3.4"}'),
  ('USER_PROFILE_UPDATED', 'USER', user_id, user_id, '{"fields": ["name", "phone"]}'),
  ('USER_TOS_ACCEPTED', 'USER', user_id, user_id, '{"version": "1.0"}'),
  ('USER_LOGIN_FAILED', 'USER', null, null, '{"email": "xxx", "reason": "invalid_password"}');
```

---

### 4.2 Logs de sorteos

**Registrar:**
- creación del sorteo,
- reglas,
- fecha y hora de ejecución,
- algoritmo usado,
- ganador seleccionado,
- evidencias.

```sql
-- Eventos de sorteo
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('RAFFLE_CREATED', 'RAFFLE', raffle_id, creator_id, '{"prize": "iPhone", "cause_id": "..."}'),
  ('RAFFLE_PUBLISHED', 'RAFFLE', raffle_id, creator_id, '{}'),
  ('RAFFLE_EXECUTED', 'RAFFLE', raffle_id, 'SYSTEM', '{"algorithm": "random_weighted", "seed": "...", "total_tickets": 1500}'),
  ('RAFFLE_WINNER_SELECTED', 'RAFFLE', raffle_id, 'SYSTEM', '{"winner_id": "...", "ticket_number": 847}'),
  ('RAFFLE_CANCELLED', 'RAFFLE', raffle_id, admin_id, '{"reason": "fraud_detected"}');
```

---

### 4.3 Logs de premios

**Registrar:**
- tipo de premio,
- origen (plataforma / usuario),
- entrega declarada,
- evidencias subidas,
- confirmación del ganador.

```sql
-- Eventos de premio
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('PRIZE_CREATED', 'PRIZE', prize_id, creator_id, '{"type": "physical", "origin": "user"}'),
  ('PRIZE_DELIVERY_DECLARED', 'PRIZE', prize_id, creator_id, '{"tracking": "ABC123"}'),
  ('PRIZE_EVIDENCE_UPLOADED', 'PRIZE', prize_id, creator_id, '{"file_id": "...", "type": "photo"}'),
  ('PRIZE_CONFIRMED_BY_WINNER', 'PRIZE', prize_id, winner_id, '{}'),
  ('PRIZE_DISPUTE_OPENED', 'PRIZE', prize_id, winner_id, '{"reason": "not_received"}');
```

---

### 4.4 Logs de dinero (CRÍTICOS)

**Registrar:**
- creación del dinero,
- cada cambio de estado,
- motivo del cambio,
- usuario o sistema que lo ejecuta,
- timestamps.

> 👉 **Nunca modificar logs financieros.**

```sql
-- Eventos de dinero (CRÍTICOS - INMUTABLES)
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('MONEY_GENERATED', 'MONEY', money_id, 'SYSTEM', '{"amount": 100.00, "currency": "EUR", "source": "donation"}'),
  ('MONEY_STATE_CHANGED', 'MONEY', money_id, 'SYSTEM', '{"from": "GENERADO", "to": "RETENIDO", "reason": "automatic"}'),
  ('MONEY_STATE_CHANGED', 'MONEY', money_id, admin_id, '{"from": "RETENIDO", "to": "APROBADO", "reason": "manual_approval"}'),
  ('MONEY_STATE_CHANGED', 'MONEY', money_id, 'SYSTEM', '{"from": "APROBADO", "to": "LIBERADO", "reason": "checklist_complete"}'),
  ('MONEY_BLOCKED', 'MONEY', money_id, admin_id, '{"reason": "fraud_investigation"}'),
  ('MONEY_WITHDRAWAL_REQUESTED', 'MONEY', money_id, user_id, '{"amount": 50.00, "method": "bank_transfer"}'),
  ('MONEY_WITHDRAWAL_COMPLETED', 'MONEY', money_id, 'SYSTEM', '{"transaction_id": "TXN123"}');
```

---

### 4.5 Logs de KYC

**Registrar:**
- inicio de verificación,
- proveedor usado,
- resultado,
- fecha,
- estado final.

```sql
-- Eventos de KYC
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('KYC_STARTED', 'USER', user_id, user_id, '{"provider": "veriff", "trigger": "withdrawal_request"}'),
  ('KYC_DOCUMENT_UPLOADED', 'USER', user_id, user_id, '{"doc_type": "passport"}'),
  ('KYC_PROVIDER_RESPONSE', 'USER', user_id, 'SYSTEM', '{"provider": "veriff", "status": "approved", "ref": "VRF123"}'),
  ('KYC_APPROVED', 'USER', user_id, 'SYSTEM', '{"level": "full"}'),
  ('KYC_REJECTED', 'USER', user_id, 'SYSTEM', '{"reason": "document_expired"}');
```

---

### 4.6 Logs de mensajería

**Registrar:**
- mensaje enviado,
- tipo,
- idioma,
- canal,
- fecha,
- estado (entregado / fallido).

```sql
-- Eventos de mensajería
INSERT INTO audit_logs (event_type, entity_type, entity_id, actor_id, metadata)
VALUES 
  ('MESSAGE_SENT', 'MESSAGE', message_id, 'SYSTEM', '{"template": "DONATION_THANKS", "channel": "push", "language": "ES"}'),
  ('MESSAGE_DELIVERED', 'MESSAGE', message_id, 'SYSTEM', '{"channel": "push"}'),
  ('MESSAGE_FAILED', 'MESSAGE', message_id, 'SYSTEM', '{"channel": "email", "error": "invalid_email"}'),
  ('MESSAGE_READ', 'MESSAGE', message_id, user_id, '{}');
```

---

## 5. Estructura mínima de un log (modelo simple)

### Todo log debe tener:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `event_id` | UUID | Identificador único del evento |
| `event_type` | VARCHAR | Tipo de evento (ver catálogo) |
| `entity_type` | VARCHAR | Tipo de entidad afectada |
| `entity_id` | UUID | ID de la entidad afectada |
| `actor_id` | UUID/VARCHAR | Usuario o 'SYSTEM' |
| `actor_type` | VARCHAR | 'USER', 'ADMIN', 'SYSTEM' |
| `timestamp` | TIMESTAMPTZ | Momento exacto |
| `metadata` | JSONB | Datos adicionales estructurados |

> 👉 **No guardar texto libre sin estructura.**

### Tabla: `audit_logs`

```sql
CREATE TABLE audit_logs (
    -- Identificación
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tipo de evento
    event_type VARCHAR(100) NOT NULL,
    
    -- Entidad afectada
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    
    -- Actor (quién ejecutó)
    actor_id VARCHAR(50), -- UUID o 'SYSTEM'
    actor_type VARCHAR(20) NOT NULL DEFAULT 'SYSTEM', -- USER, ADMIN, SYSTEM
    
    -- Timestamp (inmutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Datos adicionales
    metadata JSONB DEFAULT '{}',
    
    -- Contexto técnico
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100), -- Para correlación
    
    -- Categoría para filtrado rápido
    category VARCHAR(50) -- FINANCIAL, LEGAL, OPERATIONAL, SECURITY
);

-- IMPORTANTE: Sin columnas de updated_at ni deleted_at
-- Los logs son INMUTABLES

-- Índices para consultas frecuentes
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_category ON audit_logs(category);

-- Índice parcial para logs financieros (consultas frecuentes)
CREATE INDEX idx_audit_financial ON audit_logs(created_at DESC) 
    WHERE category = 'FINANCIAL';

-- Índice parcial para logs legales
CREATE INDEX idx_audit_legal ON audit_logs(created_at DESC) 
    WHERE category = 'LEGAL';
```

---

## 6. Regla de INMUTABILIDAD

```
┌─────────────────────────────────────────────────────────────┐
│                  REGLA DE INMUTABILIDAD                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Un log:                                                 │
│                                                             │
│     ❌ NO se edita                                          │
│     ❌ NO se borra                                          │
│     ❌ NO se sobrescribe                                    │
│                                                             │
│     Si algo cambia → SE CREA UN NUEVO LOG                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementación técnica:

```sql
-- Política de seguridad: Solo INSERT permitido
REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
GRANT INSERT, SELECT ON audit_logs TO app_user;

-- Trigger para prevenir actualizaciones (seguridad adicional)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Los logs de auditoría son inmutables. No se permite UPDATE ni DELETE.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutability
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();
```

---

## 7. Catálogo de tipos de eventos

### Eventos de Usuario (`entity_type: USER`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `USER_REGISTERED` | Usuario creó cuenta | OPERATIONAL |
| `USER_LOGIN` | Inicio de sesión | SECURITY |
| `USER_LOGIN_FAILED` | Intento fallido | SECURITY |
| `USER_LOGOUT` | Cierre de sesión | SECURITY |
| `USER_PROFILE_UPDATED` | Cambio de perfil | OPERATIONAL |
| `USER_PASSWORD_CHANGED` | Cambio de contraseña | SECURITY |
| `USER_TOS_ACCEPTED` | Aceptó términos | LEGAL |
| `USER_PRIVACY_ACCEPTED` | Aceptó privacidad | LEGAL |
| `USER_DEACTIVATED` | Cuenta desactivada | OPERATIONAL |
| `USER_SUSPENDED` | Cuenta suspendida | SECURITY |

### Eventos de Sorteo (`entity_type: RAFFLE`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `RAFFLE_CREATED` | Sorteo creado | OPERATIONAL |
| `RAFFLE_PUBLISHED` | Sorteo publicado | OPERATIONAL |
| `RAFFLE_EXECUTED` | Sorteo ejecutado | OPERATIONAL |
| `RAFFLE_WINNER_SELECTED` | Ganador seleccionado | LEGAL |
| `RAFFLE_CANCELLED` | Sorteo cancelado | OPERATIONAL |
| `RAFFLE_EXTENDED` | Fecha extendida | OPERATIONAL |

### Eventos de Participación (`entity_type: PARTICIPATION`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `PARTICIPATION_CREATED` | Usuario participó | LEGAL |
| `PARTICIPATION_TICKETS_ADDED` | Boletos añadidos | OPERATIONAL |
| `PARTICIPATION_BASES_ACCEPTED` | Bases aceptadas | LEGAL |

### Eventos de Premio (`entity_type: PRIZE`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `PRIZE_CREATED` | Premio creado | OPERATIONAL |
| `PRIZE_ASSIGNED` | Premio asignado a ganador | LEGAL |
| `PRIZE_DELIVERY_DECLARED` | Entrega declarada | LEGAL |
| `PRIZE_EVIDENCE_UPLOADED` | Evidencia subida | LEGAL |
| `PRIZE_CONFIRMED_BY_WINNER` | Ganador confirmó | LEGAL |
| `PRIZE_DISPUTE_OPENED` | Disputa abierta | LEGAL |
| `PRIZE_DISPUTE_RESOLVED` | Disputa resuelta | LEGAL |

### Eventos de Dinero (`entity_type: MONEY`) - CRÍTICOS

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `MONEY_GENERATED` | Dinero generado | FINANCIAL |
| `MONEY_STATE_CHANGED` | Cambio de estado | FINANCIAL |
| `MONEY_BLOCKED` | Dinero bloqueado | FINANCIAL |
| `MONEY_UNBLOCKED` | Dinero desbloqueado | FINANCIAL |
| `MONEY_WITHDRAWAL_REQUESTED` | Retiro solicitado | FINANCIAL |
| `MONEY_WITHDRAWAL_APPROVED` | Retiro aprobado | FINANCIAL |
| `MONEY_WITHDRAWAL_COMPLETED` | Retiro completado | FINANCIAL |
| `MONEY_WITHDRAWAL_FAILED` | Retiro fallido | FINANCIAL |

### Eventos de KYC (`entity_type: USER`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `KYC_STARTED` | Verificación iniciada | LEGAL |
| `KYC_DOCUMENT_UPLOADED` | Documento subido | LEGAL |
| `KYC_PROVIDER_RESPONSE` | Respuesta del proveedor | LEGAL |
| `KYC_APPROVED` | KYC aprobado | LEGAL |
| `KYC_REJECTED` | KYC rechazado | LEGAL |
| `KYC_EXPIRED` | KYC expirado | LEGAL |

### Eventos de Causa (`entity_type: CAUSE`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `CAUSE_CREATED` | Causa creada | OPERATIONAL |
| `CAUSE_APPROVED` | Causa aprobada | OPERATIONAL |
| `CAUSE_REJECTED` | Causa rechazada | OPERATIONAL |
| `CAUSE_COMPLETED` | Causa completada | OPERATIONAL |
| `CAUSE_UPDATE_POSTED` | Actualización publicada | OPERATIONAL |

### Eventos de Donación (`entity_type: DONATION`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `DONATION_CREATED` | Donación recibida | FINANCIAL |
| `DONATION_CONSENT_GIVEN` | Consentimiento dado | LEGAL |
| `DONATION_RECEIPT_ISSUED` | Recibo emitido | FINANCIAL |

### Eventos de Mensajería (`entity_type: MESSAGE`)

| event_type | Descripción | Categoría |
|------------|-------------|-----------|
| `MESSAGE_SENT` | Mensaje enviado | OPERATIONAL |
| `MESSAGE_DELIVERED` | Mensaje entregado | OPERATIONAL |
| `MESSAGE_FAILED` | Envío fallido | OPERATIONAL |
| `MESSAGE_READ` | Mensaje leído | OPERATIONAL |

---

## 8. Relación con auditoría legal

Gracias a estos logs, la plataforma puede demostrar:

| Reclamación | Log que lo demuestra |
|-------------|---------------------|
| "Yo no acepté los términos" | `USER_TOS_ACCEPTED` con IP, fecha, versión |
| "Yo no participé en el sorteo" | `PARTICIPATION_CREATED` con timestamp |
| "El sorteo fue manipulado" | `RAFFLE_EXECUTED` con algoritmo, seed, participantes |
| "Yo entregué el premio" | `PRIZE_DELIVERY_DECLARED` + `PRIZE_EVIDENCE_UPLOADED` |
| "Nunca confirmé recibir el premio" | `PRIZE_CONFIRMED_BY_WINNER` (si existe) |
| "No me pagaron" | `MONEY_WITHDRAWAL_COMPLETED` con transaction_id |
| "Mi KYC fue aprobado" | `KYC_APPROVED` con fecha y proveedor |

---

## 9. Acceso a logs (seguridad)

```
┌─────────────────────────────────────────────────────────────┐
│                   NIVELES DE ACCESO                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USUARIO FINAL                                              │
│  ├─ Ve: Resumen de su actividad                             │
│  ├─ Ve: Historial de participaciones                        │
│  ├─ Ve: Estado de sus transacciones                         │
│  └─ NO ve: Logs técnicos crudos                             │
│                                                             │
│  CREADOR DE CAUSA                                           │
│  ├─ Ve: Métricas agregadas                                  │
│  ├─ Ve: Estadísticas de su causa                            │
│  └─ NO ve: Datos personales de donantes                     │
│                                                             │
│  ADMINISTRADOR                                              │
│  ├─ Ve: Acceso completo a logs                              │
│  ├─ Ve: Búsqueda por usuario/entidad                        │
│  ├─ Ve: Exportación para auditoría                          │
│  └─ NO puede: Modificar ni borrar                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 👉 **Nunca exponer logs técnicos al usuario final.**

### API de acceso:

```typescript
// Usuario: su propia actividad (resumen)
// GET /api/users/me/activity
interface UserActivitySummary {
  recentParticipations: ParticipationSummary[];
  recentDonations: DonationSummary[];
  accountEvents: AccountEventSummary[]; // Solo eventos relevantes
}

// Admin: logs completos
// GET /api/admin/audit-logs
interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  actorId?: string;
  category?: 'FINANCIAL' | 'LEGAL' | 'OPERATIONAL' | 'SECURITY';
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}
```

---

## 10. Retención de logs

| Categoría | Retención | Justificación |
|-----------|-----------|---------------|
| **FINANCIAL** | 10 años | Obligación fiscal y legal |
| **LEGAL** | 10 años | Protección ante reclamaciones |
| **SECURITY** | 2 años | Análisis de seguridad |
| **OPERATIONAL** | 1 año | Debugging y métricas |

### Configuración:

```typescript
const LOG_RETENTION_POLICY = {
  FINANCIAL: { years: 10, archiveAfter: { years: 2 } },
  LEGAL: { years: 10, archiveAfter: { years: 2 } },
  SECURITY: { years: 2, archiveAfter: { months: 6 } },
  OPERATIONAL: { years: 1, archiveAfter: { months: 3 } }
};
```

> 👉 **Definir esto como configuración, no hardcodeado.**

---

## 11. Servicio de auditoría (backend)

```typescript
// audit.service.ts

interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: 'USER' | 'ADMIN' | 'SYSTEM';
  metadata?: Record<string, any>;
  category?: 'FINANCIAL' | 'LEGAL' | 'OPERATIONAL' | 'SECURITY';
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  
  async log(event: AuditEvent): Promise<void> {
    // Determinar categoría automáticamente si no se especifica
    const category = event.category || this.inferCategory(event.eventType);
    
    // Crear log inmutable
    await this.prisma.auditLog.create({
      data: {
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        actorId: event.actorId || 'SYSTEM',
        actorType: event.actorType || 'SYSTEM',
        metadata: event.metadata || {},
        category,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        requestId: event.requestId,
        createdAt: new Date()
      }
    });
  }
  
  // Helper para logs financieros (críticos)
  async logFinancial(
    eventType: string,
    entityId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      entityType: 'MONEY',
      entityId,
      actorId,
      actorType: actorId === 'SYSTEM' ? 'SYSTEM' : 'USER',
      metadata,
      category: 'FINANCIAL'
    });
  }
  
  // Helper para logs legales
  async logLegal(
    eventType: string,
    entityType: string,
    entityId: string,
    actorId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      entityType,
      entityId,
      actorId,
      metadata,
      category: 'LEGAL'
    });
  }
  
  // Consulta de logs (solo admin)
  async query(params: AuditLogQuery): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        ...(params.entityType && { entityType: params.entityType }),
        ...(params.entityId && { entityId: params.entityId }),
        ...(params.eventType && { eventType: params.eventType }),
        ...(params.actorId && { actorId: params.actorId }),
        ...(params.category && { category: params.category }),
        ...(params.dateFrom && { createdAt: { gte: params.dateFrom } }),
        ...(params.dateTo && { createdAt: { lte: params.dateTo } })
      },
      orderBy: { createdAt: 'desc' },
      take: params.limit || 100,
      skip: params.offset || 0
    });
  }
  
  // Exportación para auditoría externa
  async exportForAudit(
    entityType: string,
    entityId: string
  ): Promise<AuditExport> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'asc' }
    });
    
    return {
      entityType,
      entityId,
      exportedAt: new Date(),
      totalEvents: logs.length,
      events: logs
    };
  }
  
  private inferCategory(eventType: string): string {
    if (eventType.startsWith('MONEY_') || eventType.startsWith('DONATION_')) {
      return 'FINANCIAL';
    }
    if (eventType.includes('ACCEPTED') || eventType.includes('KYC_') || 
        eventType.includes('WINNER') || eventType.includes('CONSENT')) {
      return 'LEGAL';
    }
    if (eventType.includes('LOGIN') || eventType.includes('PASSWORD') ||
        eventType.includes('SUSPENDED')) {
      return 'SECURITY';
    }
    return 'OPERATIONAL';
  }
}
```

---

## 12. Qué NO hacer (errores graves)

| ❌ Error | Consecuencia |
|----------|--------------|
| Guardar solo "estado actual" | Sin historia, sin evidencia |
| Borrar logs antiguos | Pérdida de defensa legal |
| Editar logs | Integridad comprometida |
| Confiar en memoria o estados volátiles | Pérdida de datos en reinicio |
| Logs sin estructura | Imposible consultar |
| Logs sin timestamp | Imposible ordenar |
| Logs sin actor | Imposible atribuir |
| Exponer logs técnicos a usuarios | Riesgo de seguridad |

---

## 13. Checklist para el programador IA

### Antes de avanzar:

| ✅ | Requisito |
|----|-----------|
| ☐ | Logs por evento crítico |
| ☐ | Logs inmutables (sin UPDATE/DELETE) |
| ☐ | Logs estructurados (no texto libre) |
| ☐ | Logs financieros completos |
| ☐ | Logs de consentimiento |
| ☐ | Logs de mensajería |
| ☐ | Categorización automática |
| ☐ | Política de retención definida |
| ☐ | API de consulta para admin |
| ☐ | Exportación para auditoría |

> **Si algo falta → implementación incompleta.**

---

## 14. RECORDATORIO DE RESPALDO (CHECKPOINT DE AUDITORÍA)

### IA del programador:

**Antes de implementar este módulo:**

1. ✅ Realiza respaldo completo del proyecto.
2. ✅ Guarda estado actual.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_37_LOGS_AUDITORIA
VERSION: docset_full_backup_009
```

---

## 15. Resumen ejecutivo

### Pilares del sistema de auditoría:

| # | Pilar | Descripción |
|---|-------|-------------|
| 1 | **Inmutabilidad** | Logs nunca se editan ni borran |
| 2 | **Estructura** | Campos definidos, no texto libre |
| 3 | **Categorización** | FINANCIAL, LEGAL, SECURITY, OPERATIONAL |
| 4 | **Completitud** | Todo evento importante = log |
| 5 | **Retención** | Según categoría (hasta 10 años) |

### Reglas de oro:

1. **Todo evento importante → LOG**
2. **LOG = Inmutable** (sin edición ni borrado)
3. **Sin log = Sin evidencia**
4. **Logs financieros = Sagrados**
5. **Usuario ve resumen, no logs crudos**

---

## 16. Cierre

Este módulo es **el seguro del proyecto**.

Si algo falla:
> **Los logs cuentan la historia, no las opiniones.**

---

```
=========================================================
FIN DEL DOCUMENTO 37
MÓDULO 0.a.36 — LOGS, AUDITORÍA Y TRAZABILIDAD
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
