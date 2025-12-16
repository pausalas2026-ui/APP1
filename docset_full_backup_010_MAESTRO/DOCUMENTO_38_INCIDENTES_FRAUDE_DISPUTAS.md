# DOCUMENTO 38 – MÓDULO 0.a.37

## GESTIÓN DE INCIDENTES, FRAUDE, DISPUTAS Y PROTOCOLOS DE BLOQUEO / REVISIÓN MANUAL

**Documento operativo crítico**
**Aplica a:** dinero, premios, causas, usuarios, sorteos, mensajería
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento responde a esta pregunta:

> **¿Qué hacemos cuando algo huele mal o cuando hay un conflicto?**

### Ejemplos reales:

- el ganador dice "no recibí el premio",
- el organizador dice "sí lo entregué",
- una causa creada por usuario resulta ser falsa,
- un usuario intenta cobrar sin KYC,
- hay múltiples cuentas con el mismo patrón,
- hay reclamos de "me robaron mis datos",
- hay spam o abuso.

Si no definimos esto:
- el programador inventa soluciones,
- se libera dinero por error,
- se pierde control,
- la plataforma queda expuesta legalmente.

👉 **Este documento define cómo se detecta, qué se bloquea y cómo se resuelve.**

---

## 2. Principio rector

```
┌─────────────────────────────────────────────────────────────┐
│              PRINCIPIO DE GESTIÓN DE INCIDENTES             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     1. Si hay duda    →  SE BLOQUEA                         │
│     2. Si se bloquea  →  SE REGISTRA                        │
│     3. Si se resuelve →  SE DOCUMENTA                       │
│                                                             │
│     ❌ NUNCA: Liberar con duda                              │
│     ❌ NUNCA: Bloquear sin log                              │
│     ❌ NUNCA: Resolver sin evidencia                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tipos de incidentes que el sistema debe contemplar

### 3.1 Incidentes de PREMIO

| Código | Incidente |
|--------|-----------|
| `PRIZE_NOT_DELIVERED` | Premio no entregado |
| `PRIZE_INSUFFICIENT_EVIDENCE` | Evidencia insuficiente |
| `PRIZE_EVIDENCE_MANIPULATED` | Evidencia manipulada |
| `PRIZE_WINNER_UNREACHABLE` | Ganador no localizable |
| `PRIZE_DIFFERENT_FROM_PROMISED` | Premio distinto al prometido |

### 3.2 Incidentes de DINERO

| Código | Incidente |
|--------|-----------|
| `MONEY_WITHDRAWAL_NO_KYC` | Intento de retiro sin KYC |
| `MONEY_AMOUNT_DISCREPANCY` | Discrepancias en montos |
| `MONEY_DOUBLE_WITHDRAWAL` | Intento de doble retiro |
| `MONEY_REFUND_REQUEST` | Solicitud de reembolso |
| `MONEY_ANOMALOUS_ACTIVITY` | Actividad anómala |

### 3.3 Incidentes de CAUSA

| Código | Incidente |
|--------|-----------|
| `CAUSE_NONEXISTENT` | Causa inexistente |
| `CAUSE_FAKE_DOCUMENTS` | Documentos falsos |
| `CAUSE_FUND_DIVERSION` | Desvío de fondos |
| `CAUSE_DUPLICATE_SPAM` | Causa duplicada o spam |

### 3.4 Incidentes de USUARIO

| Código | Incidente |
|--------|-----------|
| `USER_MULTIPLE_ACCOUNTS` | Múltiples cuentas |
| `USER_IDENTITY_FRAUD` | Fraude de identidad |
| `USER_FAKE_DATA` | Uso de datos falsos |
| `USER_BOT_DETECTED` | Bot detectado |

### 3.5 Incidentes de PARTICIPACIÓN

| Código | Incidente |
|--------|-----------|
| `PARTICIPATION_MASS_SUSPICIOUS` | Participación masiva sospechosa |
| `PARTICIPATION_TICKET_ABUSE` | Abuso de boletos |
| `PARTICIPATION_RAFFLE_MANIPULATION` | Manipulación del sorteo |

### 3.6 Incidentes de MENSAJERÍA

| Código | Incidente |
|--------|-----------|
| `MESSAGE_SPAM_COMPLAINT` | Queja por spam |
| `MESSAGE_WRONG_LANGUAGE` | Idioma incorrecto |
| `MESSAGE_UNAUTHORIZED_CONTACT` | Contacto no autorizado |

---

## 4. Estados de "riesgo" (banderas antifraude)

El sistema debe manejar **flags (banderas)** por entidad.

### Entidades con flags:

- Usuario
- Sorteo
- Premio
- Causa
- Transacción/Dinero

### Catálogo de flags:

| Flag | Descripción | Entidades |
|------|-------------|-----------|
| `KYC_REQUIRED` | Requiere verificación KYC | Usuario |
| `KYC_REJECTED` | KYC fue rechazado | Usuario |
| `KYC_EXPIRED` | KYC expirado | Usuario |
| `PRIZE_DELIVERY_DISPUTE` | Disputa de entrega activa | Premio |
| `CAUSE_NOT_VERIFIED` | Causa no verificada | Causa |
| `SUSPICIOUS_ACTIVITY` | Actividad sospechosa detectada | Usuario, Sorteo |
| `MANUAL_REVIEW_REQUIRED` | Requiere revisión manual | Cualquiera |
| `FUNDS_HOLD` | Fondos retenidos | Transacción |
| `ACCOUNT_SUSPENDED` | Cuenta suspendida temporalmente | Usuario |
| `ACCOUNT_BLOCKED` | Cuenta bloqueada permanentemente | Usuario |
| `HIGH_RISK` | Alto riesgo detectado | Usuario, Causa |
| `MULTIPLE_ACCOUNTS` | Posibles cuentas duplicadas | Usuario |

> 👉 **Estas banderas no son "decorativas"; afectan el flujo.**

### Tabla: `entity_flags`

```sql
CREATE TABLE entity_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entidad afectada
    entity_type VARCHAR(50) NOT NULL, -- USER, RAFFLE, PRIZE, CAUSE, MONEY
    entity_id UUID NOT NULL,
    
    -- Flag
    flag_code VARCHAR(50) NOT NULL,
    
    -- Contexto
    reason TEXT,
    evidence_ids UUID[], -- Referencias a evidencias
    
    -- Estado del flag
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Quién lo puso
    created_by VARCHAR(50) NOT NULL, -- USER_ID o 'SYSTEM'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Resolución (si aplica)
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Índices implícitos
    UNIQUE(entity_type, entity_id, flag_code, is_active)
);

CREATE INDEX idx_flags_entity ON entity_flags(entity_type, entity_id);
CREATE INDEX idx_flags_active ON entity_flags(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_flags_code ON entity_flags(flag_code);
```

---

## 5. Qué bloquea el sistema automáticamente (sin intervención humana)

### 5.1 Bloqueo automático de liberación de dinero

**Si ocurre cualquiera de estos:**

| Condición | Flag activado | Bloqueo |
|-----------|---------------|---------|
| Falta KYC | `KYC_REQUIRED` | ✅ Dinero no se libera |
| KYC rechazado | `KYC_REJECTED` | ✅ Dinero no se libera |
| Evidencia de entrega incompleta | `PRIZE_DELIVERY_DISPUTE` | ✅ Dinero no se libera |
| Causa no verificada | `CAUSE_NOT_VERIFIED` | ✅ Dinero no se libera |
| Flag de fraude activo | `SUSPICIOUS_ACTIVITY` | ✅ Dinero no se libera |
| Revisión manual pendiente | `MANUAL_REVIEW_REQUIRED` | ✅ Dinero no se libera |

> 👉 **No se libera dinero.**

```typescript
// money-release.guard.ts

async function canReleaseMoney(moneyId: string): Promise<ReleaseCheck> {
  const money = await getMoney(moneyId);
  const user = await getUser(money.userId);
  const cause = await getCause(money.causeId);
  
  const blockers: string[] = [];
  
  // Check user flags
  const userFlags = await getActiveFlags('USER', user.id);
  if (userFlags.includes('KYC_REQUIRED')) blockers.push('KYC pendiente');
  if (userFlags.includes('KYC_REJECTED')) blockers.push('KYC rechazado');
  if (userFlags.includes('SUSPICIOUS_ACTIVITY')) blockers.push('Actividad sospechosa');
  if (userFlags.includes('ACCOUNT_SUSPENDED')) blockers.push('Cuenta suspendida');
  
  // Check cause flags
  const causeFlags = await getActiveFlags('CAUSE', cause.id);
  if (causeFlags.includes('CAUSE_NOT_VERIFIED')) blockers.push('Causa no verificada');
  
  // Check money flags
  const moneyFlags = await getActiveFlags('MONEY', money.id);
  if (moneyFlags.includes('FUNDS_HOLD')) blockers.push('Fondos en retención');
  if (moneyFlags.includes('MANUAL_REVIEW_REQUIRED')) blockers.push('Revisión manual pendiente');
  
  // Check prize delivery if applicable
  if (money.prizeId) {
    const prizeFlags = await getActiveFlags('PRIZE', money.prizeId);
    if (prizeFlags.includes('PRIZE_DELIVERY_DISPUTE')) blockers.push('Disputa de entrega activa');
  }
  
  return {
    canRelease: blockers.length === 0,
    blockers
  };
}
```

### 5.2 Bloqueo automático del sorteo

**Si:**
- el premio no cumple requisitos mínimos,
- el usuario tiene flags graves,
- hay manipulación detectada.

> 👉 **El sorteo entra en estado `SUSPENDED`.**

```typescript
// raffle-execution.guard.ts

async function canExecuteRaffle(raffleId: string): Promise<ExecutionCheck> {
  const raffle = await getRaffle(raffleId);
  const creator = await getUser(raffle.creatorId);
  
  const blockers: string[] = [];
  
  // Check creator flags
  const creatorFlags = await getActiveFlags('USER', creator.id);
  if (creatorFlags.includes('ACCOUNT_SUSPENDED')) blockers.push('Creador suspendido');
  if (creatorFlags.includes('ACCOUNT_BLOCKED')) blockers.push('Creador bloqueado');
  if (creatorFlags.includes('HIGH_RISK')) blockers.push('Creador alto riesgo');
  
  // Check raffle flags
  const raffleFlags = await getActiveFlags('RAFFLE', raffleId);
  if (raffleFlags.includes('SUSPICIOUS_ACTIVITY')) blockers.push('Actividad sospechosa');
  if (raffleFlags.includes('MANUAL_REVIEW_REQUIRED')) blockers.push('Revisión manual pendiente');
  
  // Check prize requirements
  if (!raffle.prize || !raffle.prize.isValid) {
    blockers.push('Premio no cumple requisitos');
  }
  
  if (blockers.length > 0) {
    await suspendRaffle(raffleId, blockers);
  }
  
  return {
    canExecute: blockers.length === 0,
    blockers
  };
}
```

---

## 6. Estados de resolución de incidentes

Cada incidente debe tener estados claros:

```
┌─────────────────────────────────────────────────────────────┐
│                FLUJO DE ESTADOS DE INCIDENTE                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   REPORTED ──▶ TRIAGED ──▶ UNDER_REVIEW ──▶ ACTION_TAKEN   │
│                                │                 │          │
│                                │                 ▼          │
│                                │            RESOLVED        │
│                                │                            │
│                                └────────▶ REJECTED          │
│                                    (falta de pruebas)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| Estado | Descripción |
|--------|-------------|
| `REPORTED` | Incidente reportado, pendiente de clasificar |
| `TRIAGED` | Clasificado por tipo y prioridad |
| `UNDER_REVIEW` | En revisión activa |
| `ACTION_TAKEN` | Se tomó acción (bloqueo, retención, etc.) |
| `RESOLVED` | Resuelto definitivamente |
| `REJECTED` | Rechazado por falta de pruebas |

> 👉 **Igual que el dinero: estados, no caos.**

### Tabla: `incidents`

```sql
CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    incident_code VARCHAR(100) NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- PRIZE, MONEY, CAUSE, USER, PARTICIPATION, MESSAGE
    
    -- Entidad afectada
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Reportante
    reported_by UUID REFERENCES users(id),
    reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Descripción
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Estado
    status VARCHAR(50) NOT NULL DEFAULT 'REPORTED',
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    
    -- Asignación
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    
    -- Resolución
    resolution_type VARCHAR(50), -- CONFIRMED_FRAUD, FALSE_POSITIVE, PARTIAL_RESOLUTION, etc.
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    
    -- Acciones tomadas (JSON array)
    actions_taken JSONB DEFAULT '[]',
    
    -- Evidencias
    evidence_ids UUID[],
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type ON incidents(incident_type);
CREATE INDEX idx_incidents_entity ON incidents(entity_type, entity_id);
CREATE INDEX idx_incidents_priority ON incidents(priority);
CREATE INDEX idx_incidents_assigned ON incidents(assigned_to) WHERE assigned_to IS NOT NULL;
```

---

## 7. Cómo se reporta un incidente (UX + backend)

### Canales:

- Botón "Reportar problema" en:
  - sorteo,
  - premio,
  - causa,
  - transacción.
- Contacto soporte (si existe).

### Datos mínimos del reporte:

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `reporter_id` | ✅ | Quién reporta |
| `entity_type` | ✅ | Tipo de entidad afectada |
| `entity_id` | ✅ | ID de la entidad |
| `incident_code` | ✅ | Tipo de incidente (del catálogo) |
| `description` | ✅ | Descripción del problema |
| `evidence_files` | ❌ | Evidencias (si aplican) |

### API: Crear reporte

```typescript
// POST /api/incidents/report
interface CreateIncidentReport {
  entityType: 'RAFFLE' | 'PRIZE' | 'CAUSE' | 'MONEY' | 'USER' | 'MESSAGE';
  entityId: string;
  incidentCode: string;
  title: string;
  description: string;
  evidenceFiles?: File[];
}

// Response
interface IncidentReportResponse {
  incidentId: string;
  status: 'REPORTED';
  message: string;
  trackingCode: string; // Para seguimiento
}
```

### Componente UX:

```tsx
// ReportProblemButton.tsx

const incidentOptions = {
  PRIZE: [
    { code: 'PRIZE_NOT_DELIVERED', label: 'No recibí el premio' },
    { code: 'PRIZE_DIFFERENT_FROM_PROMISED', label: 'El premio es diferente' },
    { code: 'PRIZE_EVIDENCE_MANIPULATED', label: 'La evidencia parece falsa' }
  ],
  RAFFLE: [
    { code: 'PARTICIPATION_RAFFLE_MANIPULATION', label: 'Creo que hubo manipulación' },
    { code: 'PARTICIPATION_MASS_SUSPICIOUS', label: 'Vi participación sospechosa' }
  ],
  CAUSE: [
    { code: 'CAUSE_NONEXISTENT', label: 'Esta causa no existe' },
    { code: 'CAUSE_FAKE_DOCUMENTS', label: 'Los documentos parecen falsos' }
  ],
  // ... más opciones
};
```

---

## 8. Reglas de DISPUTA por entrega de premio (muy importante)

### Escenario: ganador dice "no me entregaron"

```
┌─────────────────────────────────────────────────────────────┐
│              FLUJO DE DISPUTA DE PREMIO                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. GANADOR reporta disputa                                 │
│     └─▶ Incident: PRIZE_NOT_DELIVERED                       │
│                                                             │
│  2. SISTEMA bloquea automáticamente                         │
│     └─▶ Flag: PRIZE_DELIVERY_DISPUTE                        │
│     └─▶ Flag: FUNDS_HOLD (en dinero relacionado)            │
│                                                             │
│  3. ORGANIZADOR notificado                                  │
│     └─▶ Debe subir evidencia adicional en X días            │
│                                                             │
│  4. PLATAFORMA verifica                                     │
│     └─▶ Contacta ambas partes                               │
│     └─▶ Revisa evidencias                                   │
│                                                             │
│  5. RESOLUCIÓN                                              │
│     ├─▶ SI confirmada entrega: liberar fondos               │
│     └─▶ SI NO confirmada:                                   │
│         ├─▶ Marcar como fraude/incumplimiento               │
│         ├─▶ Bloquear organizador                            │
│         └─▶ Retención definitiva o reembolso                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementación:

```typescript
// prize-dispute.service.ts

@Injectable()
export class PrizeDisputeService {
  
  async openDispute(prizeId: string, winnerId: string, description: string): Promise<Incident> {
    const prize = await this.getPrize(prizeId);
    
    // 1. Crear incidente
    const incident = await this.incidentService.create({
      incidentCode: 'PRIZE_NOT_DELIVERED',
      incidentType: 'PRIZE',
      entityType: 'PRIZE',
      entityId: prizeId,
      reportedBy: winnerId,
      title: 'Disputa de entrega de premio',
      description,
      priority: 'HIGH'
    });
    
    // 2. Activar flags automáticos
    await this.flagService.addFlag('PRIZE', prizeId, 'PRIZE_DELIVERY_DISPUTE', {
      reason: 'Disputa abierta por ganador',
      incidentId: incident.id
    });
    
    // 3. Bloquear dinero relacionado
    const relatedMoney = await this.getRelatedMoney(prize.raffleId);
    for (const money of relatedMoney) {
      await this.flagService.addFlag('MONEY', money.id, 'FUNDS_HOLD', {
        reason: 'Disputa de premio activa',
        incidentId: incident.id
      });
    }
    
    // 4. Notificar al organizador
    await this.notifyOrganizer(prize.creatorId, incident);
    
    // 5. Log de auditoría
    await this.auditService.log({
      eventType: 'PRIZE_DISPUTE_OPENED',
      entityType: 'PRIZE',
      entityId: prizeId,
      actorId: winnerId,
      metadata: { incidentId: incident.id }
    });
    
    return incident;
  }
  
  async resolveDispute(
    incidentId: string, 
    resolution: 'DELIVERED' | 'NOT_DELIVERED',
    resolvedBy: string,
    notes: string
  ): Promise<void> {
    const incident = await this.getIncident(incidentId);
    const prize = await this.getPrize(incident.entityId);
    
    if (resolution === 'DELIVERED') {
      // Confirmar entrega - liberar fondos
      await this.flagService.resolveFlag('PRIZE', prize.id, 'PRIZE_DELIVERY_DISPUTE', {
        resolvedBy,
        notes: 'Entrega confirmada tras revisión'
      });
      
      // Liberar dinero
      const relatedMoney = await this.getRelatedMoney(prize.raffleId);
      for (const money of relatedMoney) {
        await this.flagService.resolveFlag('MONEY', money.id, 'FUNDS_HOLD', {
          resolvedBy,
          notes: 'Disputa resuelta - entrega confirmada'
        });
      }
      
    } else {
      // No entregado - acciones contra organizador
      await this.flagService.addFlag('USER', prize.creatorId, 'HIGH_RISK', {
        reason: 'Incumplimiento de entrega de premio confirmado'
      });
      
      // Posible suspensión
      await this.flagService.addFlag('USER', prize.creatorId, 'ACCOUNT_SUSPENDED', {
        reason: 'Investigación por incumplimiento de entrega'
      });
      
      // Log de fraude
      await this.auditService.log({
        eventType: 'PRIZE_FRAUD_CONFIRMED',
        entityType: 'PRIZE',
        entityId: prize.id,
        actorId: 'SYSTEM',
        metadata: { 
          incidentId, 
          creatorId: prize.creatorId,
          action: 'ACCOUNT_SUSPENDED'
        },
        category: 'LEGAL'
      });
    }
    
    // Cerrar incidente
    await this.incidentService.resolve(incidentId, {
      resolutionType: resolution === 'DELIVERED' ? 'FALSE_POSITIVE' : 'CONFIRMED_FRAUD',
      resolvedBy,
      notes
    });
  }
}
```

> 👉 **Regla: sin confirmación = no pago.**

---

## 9. Reglas para causas creadas por usuario (fraude de causa)

Si una causa creada por usuario:
- ❌ no acredita existencia,
- ❌ tiene documentos falsos,
- ❌ no pasa validación,

Entonces:

```
┌─────────────────────────────────────────────────────────────┐
│              CAUSA NO VERIFICADA - ACCIONES                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Flag: CAUSE_NOT_VERIFIED                                │
│                                                             │
│  2. Dinero relacionado:                                     │
│     └─▶ Estado: RETENIDO (no avanza)                        │
│     └─▶ Flag: FUNDS_HOLD                                    │
│                                                             │
│  3. Causa:                                                  │
│     └─▶ NO entra al catálogo público                        │
│     └─▶ NO puede recibir donaciones                         │
│                                                             │
│  4. Usuario creador:                                        │
│     └─▶ Puede ser bloqueado si hay fraude confirmado        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Acciones de la plataforma (catálogo de "acciones posibles")

El sistema debe permitir estas acciones y **SOLO estas**:

| Acción | Código | Descripción |
|--------|--------|-------------|
| Retener fondos | `HOLD_FUNDS` | Bloquear liberación de dinero |
| Bloquear retiro | `BLOCK_WITHDRAWAL` | Impedir retiros |
| Suspender cuenta temporal | `SUSPEND_ACCOUNT` | Suspensión temporal con revisión |
| Bloquear cuenta permanente | `BLOCK_ACCOUNT` | Bloqueo definitivo |
| Desactivar sorteos | `DEACTIVATE_RAFFLES` | Suspender sorteos del usuario |
| Desactivar causas | `DEACTIVATE_CAUSES` | Suspender causas del usuario |
| Requerir KYC Nivel 2 | `REQUIRE_KYC_L2` | Verificación adicional |
| Escalar a revisión manual | `ESCALATE_MANUAL` | Enviar a revisión humana |
| Liberar fondos | `RELEASE_FUNDS` | Aprobar liberación |
| Cerrar incidente | `CLOSE_INCIDENT` | Resolver sin acción |
| Notificar usuario | `NOTIFY_USER` | Enviar comunicación |

> 👉 **No inventar acciones fuera de este catálogo sin documentarlo.**

### Tabla: `incident_actions`

```sql
CREATE TABLE incident_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Incidente relacionado
    incident_id UUID NOT NULL REFERENCES incidents(id),
    
    -- Acción
    action_code VARCHAR(50) NOT NULL,
    
    -- Contexto
    target_type VARCHAR(50), -- USER, MONEY, CAUSE, RAFFLE
    target_id UUID,
    
    -- Detalles
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Quién ejecutó
    executed_by UUID NOT NULL REFERENCES users(id),
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Resultado
    was_successful BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

CREATE INDEX idx_actions_incident ON incident_actions(incident_id);
CREATE INDEX idx_actions_code ON incident_actions(action_code);
```

---

## 11. Revisión manual (cuando es obligatorio)

La revisión manual aplica cuando:

| Condición | Umbral |
|-----------|--------|
| Montos altos | > €1,000 en una transacción |
| Múltiples flags | 3+ flags activos en una entidad |
| Evidencia contradictoria | Ambas partes presentan "pruebas" |
| Casos de reputación sensible | Causa mediática, influencer, etc. |
| Primer retiro de usuario nuevo | Usuario con < 30 días |
| Patrón sospechoso detectado | Algoritmo antifraude lo marca |

> 👉 **En revisión manual, el sistema:**

```
┌─────────────────────────────────────────────────────────────┐
│                   REVISIÓN MANUAL                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. CONGELA todo lo relacionado                             │
│     └─▶ Fondos                                              │
│     └─▶ Sorteos pendientes                                  │
│     └─▶ Retiros en proceso                                  │
│                                                             │
│  2. MUESTRA estado "En revisión" al usuario                 │
│     └─▶ Sin acusar                                          │
│     └─▶ Sin revelar detalles                                │
│                                                             │
│  3. ASIGNA a revisor humano                                 │
│     └─▶ Con prioridad según gravedad                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Registro obligatorio de todo (relación con Documento 37)

Cada incidente debe generar logs:

| Evento | Log obligatorio |
|--------|-----------------|
| Creación del incidente | `INCIDENT_CREATED` |
| Cambio de estado | `INCIDENT_STATUS_CHANGED` |
| Asignación | `INCIDENT_ASSIGNED` |
| Acción tomada | `INCIDENT_ACTION_TAKEN` |
| Evidencia añadida | `INCIDENT_EVIDENCE_ADDED` |
| Resolución | `INCIDENT_RESOLVED` |

> 👉 **Si no hay log, no hay defensa.**

```typescript
// Ejemplo de logs por incidente
await auditService.log({
  eventType: 'INCIDENT_CREATED',
  entityType: 'INCIDENT',
  entityId: incident.id,
  actorId: reporterId,
  metadata: {
    incidentCode: 'PRIZE_NOT_DELIVERED',
    affectedEntity: { type: 'PRIZE', id: prizeId }
  },
  category: 'LEGAL'
});
```

---

## 13. Mensajes al usuario (tonos recomendados)

### Cuando se retienen fondos:

```
"Tus fondos están en revisión para proteger a todos los participantes.
Te notificaremos cuando se complete la verificación."
```

### Cuando falta evidencia:

```
"Necesitamos evidencia adicional para continuar con tu solicitud.
Por favor, sube los documentos requeridos."
```

### Cuando falta KYC:

```
"Para liberar tus fondos, necesitamos verificar tu identidad.
Este proceso es rápido y seguro."
```

### Cuando hay disputa activa:

```
"Hay una revisión en curso relacionada con esta transacción.
Te mantendremos informado del resultado."
```

### Reglas de tono:

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| Claro y directo | Acusar |
| Informativo | Admitir culpa |
| Profesional | Revelar detalles internos |
| Empático | Prometer tiempos específicos |

---

## 14. Detección automática de patrones sospechosos

### Patrones que el sistema debe detectar:

| Patrón | Detección | Acción automática |
|--------|-----------|-------------------|
| Misma IP en múltiples cuentas | IP repetida en 3+ registros | `MULTIPLE_ACCOUNTS` flag |
| Participación masiva desde una IP | 50+ participaciones/hora misma IP | `SUSPICIOUS_ACTIVITY` flag |
| Retiro inmediato tras recibir fondos | Retiro < 1 hora de recepción | `MANUAL_REVIEW_REQUIRED` flag |
| Documentos KYC repetidos | Mismo documento en 2+ cuentas | `IDENTITY_FRAUD` flag + bloqueo |
| Patrón de horario sospechoso | Actividad 24/7 sin pausas | `USER_BOT_DETECTED` flag |

```typescript
// fraud-detection.service.ts

@Injectable()
export class FraudDetectionService {
  
  async analyzeUser(userId: string): Promise<RiskAssessment> {
    const signals: RiskSignal[] = [];
    
    // Check IP patterns
    const ipAnalysis = await this.analyzeIpPatterns(userId);
    if (ipAnalysis.multipleAccounts) {
      signals.push({ type: 'MULTIPLE_ACCOUNTS', score: 0.8 });
    }
    
    // Check activity patterns
    const activityAnalysis = await this.analyzeActivity(userId);
    if (activityAnalysis.botLikeBehavior) {
      signals.push({ type: 'BOT_DETECTED', score: 0.9 });
    }
    
    // Check withdrawal patterns
    const withdrawalAnalysis = await this.analyzeWithdrawals(userId);
    if (withdrawalAnalysis.immediateWithdrawal) {
      signals.push({ type: 'SUSPICIOUS_WITHDRAWAL', score: 0.6 });
    }
    
    // Calculate overall risk
    const riskScore = this.calculateRiskScore(signals);
    
    // Auto-flag if high risk
    if (riskScore > 0.7) {
      await this.flagService.addFlag('USER', userId, 'HIGH_RISK', {
        reason: 'Detección automática de riesgo alto',
        signals
      });
    }
    
    return { userId, riskScore, signals };
  }
}
```

---

## 15. Checklist del programador IA

### Antes de cerrar este módulo:

| ✅ | Requisito |
|----|-----------|
| ☐ | Sistema de reportes funcional |
| ☐ | Flags por entidad (tabla + API) |
| ☐ | Estados del incidente definidos |
| ☐ | Bloqueos automáticos de dinero |
| ☐ | Flujo de disputa de premio completo |
| ☐ | Causa no verificada bloquea fondos |
| ☐ | Catálogo de acciones definido |
| ☐ | Revisión manual implementada |
| ☐ | Detección automática de patrones |
| ☐ | Logs completos (Doc 37) |
| ☐ | Mensajes UX definidos |

---

## 16. CHECKPOINT DE RESPALDO (obligatorio)

### IA del programador:

**Antes de implementar cambios basados en este documento:**

1. ✅ Realiza respaldo completo.
2. ✅ No modifiques backups anteriores.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_38_INCIDENTES_FRAUDE
VERSION: docset_full_backup_009
```

---

## 17. Resumen ejecutivo

### Sistema de defensa en capas:

| Capa | Descripción |
|------|-------------|
| **1. Detección** | Patrones, flags automáticos |
| **2. Bloqueo** | Retención automática si hay duda |
| **3. Reporte** | Canal para usuarios afectados |
| **4. Investigación** | Estados claros, asignación |
| **5. Resolución** | Acciones del catálogo |
| **6. Registro** | Todo queda en logs |

### Reglas de oro:

1. **Si hay duda → SE BLOQUEA**
2. **Si se bloquea → SE REGISTRA**
3. **Si se resuelve → SE DOCUMENTA**
4. **Sin confirmación = No pago**
5. **Sin log = Sin defensa**

---

## 18. Cierre

Este documento es el **"sistema inmunológico"** de la plataforma.

> Sin él, cualquier fraude pequeño escala hasta destruir la confianza.

---

```
=========================================================
FIN DEL DOCUMENTO 38
MÓDULO 0.a.37 — INCIDENTES, FRAUDE Y DISPUTAS
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
