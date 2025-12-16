# DOCUMENTO 34 – MÓDULO 0.a.25

# ESTADOS DEL DINERO, FLUJOS FINANCIEROS Y REGLAS DE RETENCIÓN, APROBACIÓN Y LIBERACIÓN

---

## Documento operativo crítico
## Aplica a: donaciones, premios, causas y pagos

**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento existe para responder una pregunta muy concreta:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ¿Dónde está el dinero en cada momento                                │
│   y por qué NO se puede mover libremente?                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Si el dinero NO tiene estados claros:

| Problema | Consecuencia |
|----------|--------------|
| Se libera antes de tiempo | Pérdida económica |
| Se paga dos veces | Error contable grave |
| Se paga a quien no corresponde | Fraude |
| Se generan fraudes | Pérdida de confianza |
| Se rompe la confianza | Usuarios abandonan |
| Problemas legales | Proyecto puede colapsar |

### 👉 Este documento define cómo debe "pensar" el dinero dentro del sistema.

---

## 2. Principio básico que debes entender

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   El dinero NUNCA está "libre" hasta que se cumplen                    │
│   TODAS las condiciones.                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Aunque el usuario:

- ✅ Haya pagado
- ✅ Haya generado donaciones
- ✅ Haya terminado un sorteo

### 👉 El dinero SIEMPRE nace RETENIDO.

---

## 3. Estados oficiales del dinero (NO inventar otros)

Todo dinero dentro del sistema **DEBE** estar en **UNO Y SOLO UNO** de estos estados:

### Estado 1 – GENERADO (`generated`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | El dinero existe contablemente |
| **Proviene de** | Donaciones, participaciones, sorteos |
| **¿Se puede usar?** | ❌ NO |
| **¿Se puede retirar?** | ❌ NO |

**Ejemplo:**
> "Ya se donó, pero aún no se puede mover."

---

### Estado 2 – RETENIDO (`held`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | El dinero está bloqueado por seguridad |
| **Por qué** | Aún no se ha validado: identidad, causa, premio, evidencias |
| **¿Se puede usar?** | ❌ NO |
| **¿Se puede retirar?** | ❌ NO |

**👉 Este es el estado POR DEFECTO de todo dinero nuevo.**

---

### Estado 3 – PENDIENTE DE VERIFICACIÓN (`pending_verification`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | El usuario solicitó liberar dinero |
| **Qué falta** | KYC, evidencia, validación de causa, confirmación de entrega |
| **¿Se puede usar?** | ❌ NO |
| **¿Se puede retirar?** | ❌ NO |

**👉 El dinero sigue bloqueado hasta que se complete todo.**

---

### Estado 4 – APROBADO (`approved`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | TODAS las condiciones se cumplieron |
| **Condiciones** | Usuario verificado, causa validada, premio entregado, evidencias confirmadas |
| **¿Se puede usar?** | ⏳ Listo para liberar |
| **¿Se puede retirar?** | ⏳ Pendiente de transferencia |

**👉 El dinero YA puede liberarse, pero aún no se ha pagado.**

---

### Estado 5 – LIBERADO (`released`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | El dinero fue enviado |
| **Destino** | A la causa, o al usuario (por premio no donado) |
| **Registro** | Fecha, método, comprobante |
| **¿Puede cambiar?** | ❌ NO (estado final) |

**👉 Estado final exitoso.**

---

### Estado 6 – BLOQUEADO / RECHAZADO (`blocked`)

| Característica | Descripción |
|----------------|-------------|
| **Qué significa** | El dinero NO se libera |
| **Motivos** | Fraude, causa falsa, premio no entregado, KYC rechazado |
| **Acción** | Revisión manual o cierre definitivo |
| **¿Puede cambiar?** | Solo por admin con justificación |

**👉 Estado de protección.**

---

## 4. Diagrama de estados

```
                    ┌─────────────┐
                    │  GENERADO   │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  RETENIDO   │ ◄── Estado por defecto
                    └──────┬──────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ PENDIENTE VERIFICACIÓN │
              └────────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │  APROBADO   │          │  BLOQUEADO  │
       └──────┬──────┘          └─────────────┘
              │
              ▼
       ┌─────────────┐
       │  LIBERADO   │ ◄── Estado final exitoso
       └─────────────┘
```

---

## 5. Regla ABSOLUTA de transición de estados

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   El dinero SOLO puede avanzar hacia adelante.                         │
│   NUNCA puede retroceder de estado.                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Ejemplos PROHIBIDOS:

| Transición | Permitido |
|------------|-----------|
| GENERADO → RETENIDO | ✅ SÍ |
| RETENIDO → PENDIENTE | ✅ SÍ |
| PENDIENTE → APROBADO | ✅ SÍ |
| APROBADO → LIBERADO | ✅ SÍ |
| LIBERADO → RETENIDO | ❌ **PROHIBIDO** |
| APROBADO → GENERADO | ❌ **PROHIBIDO** |
| LIBERADO → APROBADO | ❌ **PROHIBIDO** |

### Si algo falla:

- ✅ Se marca como **BLOQUEADO**
- ✅ Se registra en auditoría
- ❌ **NO se "rebobina"**

---

## 6. Flujos principales del dinero (explicados fácil)

### Flujo A – Donación a causa de la plataforma

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO A: DONACIÓN A CAUSA                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Donación ocurre ────────────────────► GENERADO                      │
│                                                │                        │
│  2. Sistema retiene automáticamente ─────► RETENIDO                     │
│                                                │                        │
│  3. Usuario/causa solicita liberar ──────► PENDIENTE                    │
│                                                │                        │
│  4. Causa validada + requisitos OK ──────► APROBADO                     │
│                                                │                        │
│  5. Transferencia ejecutada ─────────────► LIBERADO                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Flujo B – Premio DONADO por el usuario

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO B: PREMIO DONADO                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Sorteo ejecutado ───────────────────► GENERADO                      │
│                                                │                        │
│  2. Sistema retiene ────────────────────► RETENIDO                      │
│                                                │                        │
│  3. Premio entregado + evidencia ───────► PENDIENTE                     │
│                                                │                        │
│  4. Causa validada + todo OK ───────────► APROBADO                      │
│                                                │                        │
│  5. Dinero a la causa ──────────────────► LIBERADO                      │
│                                                                         │
│  👉 Usuario NO recibe dinero (es donación)                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Flujo C – Premio NO donado (usuario cobra valor)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                FLUJO C: PREMIO CON COBRO DE VALOR                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Sorteo ejecutado ───────────────────► GENERADO                      │
│                                                │                        │
│  2. Sistema retiene ────────────────────► RETENIDO                      │
│                                                │                        │
│  3. Premio entregado + evidencia                                        │
│     + ganador confirmado ───────────────► PENDIENTE                     │
│                                                │                        │
│  4. Usuario pasa KYC + todo validado ───► APROBADO                      │
│                                                │                        │
│  5. Pago al usuario ────────────────────► LIBERADO                      │
│                                                                         │
│  👉 NUNCA pagar antes del paso 4                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Relación entre dinero y KYC (recordatorio)

| Condición faltante | ¿Puede pasar a APROBADO? |
|--------------------|--------------------------|
| Sin KYC | ❌ NO |
| Sin evidencia | ❌ NO |
| Sin causa válida | ❌ NO |
| Sin confirmación de entrega | ❌ NO |

### Consecuencia:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   👉 El dinero puede quedarse RETENIDO indefinidamente                 │
│      si el usuario no cumple las condiciones.                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Qué PUEDE hacer el usuario mientras el dinero está retenido

| Acción | ¿Permitida? |
|--------|-------------|
| Seguir usando la app | ✅ SÍ |
| Crear sorteos | ✅ SÍ |
| Generar más dinero | ✅ SÍ |
| Pagar su suscripción | ✅ SÍ |
| Participar en causas | ✅ SÍ |

### 👉 Retención ≠ Bloqueo de la app

---

## 9. Qué NO puede hacer el usuario

Mientras el dinero esté en estado **RETENIDO** o **PENDIENTE**:

| Acción | ¿Permitida? |
|--------|-------------|
| Retirarlo | ❌ NO |
| Moverlo | ❌ NO |
| Asignarlo manualmente | ❌ NO |
| Transferirlo a otra cuenta | ❌ NO |

---

## 10. Auditoría y trazabilidad (OBLIGATORIO)

### Cada cambio de estado del dinero DEBE registrar:

| Campo | Descripción |
|-------|-------------|
| `actor_id` | Quién lo cambió |
| `actor_type` | Sistema, usuario, admin |
| `timestamp` | Cuándo |
| `reason` | Por qué |
| `from_status` | Desde qué estado |
| `to_status` | Hacia cuál estado |
| `metadata` | Datos adicionales |

### Regla:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│              👉 Sin logs = ERROR GRAVE                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Regla antifraude clave

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│           Si hay DUDA, el dinero NO se libera.                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### NUNCA:

- ❌ "Me parece que está bien"
- ❌ "El usuario se ve honesto"
- ❌ "Luego lo arreglamos"

### 👉 Todo debe estar PROBADO y DOCUMENTADO.

---

## 12. Checklist antes de liberar dinero

### Antes de pasar a LIBERADO:

| # | Validación | Check |
|---|------------|-------|
| 1 | ☐ Estado actual = APROBADO | |
| 2 | ☐ Usuario verificado (KYC) | |
| 3 | ☐ Causa validada | |
| 4 | ☐ Premio entregado (si aplica) | |
| 5 | ☐ Evidencias confirmadas | |
| 6 | ☐ Sin flags de fraude | |

### Regla:

```
Si falla UNO → NO liberar.
```

---

## 13. Mensaje UX correcto al usuario

### ❌ NO decir:

```
"Tu dinero está bloqueado."
```

### ✅ SÍ decir:

```
"Tu dinero está en proceso de validación para proteger a todos."
```

### Mensajes por estado:

| Estado | Mensaje UX |
|--------|------------|
| RETENIDO | "Tus fondos están seguros. Completaremos la validación pronto." |
| PENDIENTE | "Estamos verificando la información. Te avisaremos cuando esté listo." |
| APROBADO | "¡Todo listo! Tu dinero será transferido en breve." |
| LIBERADO | "¡Transferencia completada! Revisa tu cuenta." |
| BLOQUEADO | "Necesitamos revisar tu caso. Contacta a soporte." |

---

## 14. Modelo de Datos

### Tabla: `fund_ledger`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK a users |
| source_type | enum | 'donation', 'sweepstake', 'prize', 'cause' |
| source_id | UUID | FK a la fuente |
| amount | decimal(12,2) | Monto |
| currency | varchar(3) | Moneda (USD, EUR, MXN) |
| status | enum | 'generated', 'held', 'pending_verification', 'approved', 'released', 'blocked' |
| previous_status | varchar | Estado anterior (para auditoría rápida) |
| held_reason | text | Razón de retención |
| blocked_reason | text | Razón de bloqueo |
| approved_at | datetime | Fecha de aprobación |
| approved_by | UUID | Quien aprobó |
| released_at | datetime | Fecha de liberación |
| released_to | varchar | Destino (cuenta, causa) |
| transaction_ref | varchar | Referencia de transferencia |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `fund_status_history`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| fund_id | UUID | FK a fund_ledger |
| from_status | varchar | Estado anterior |
| to_status | varchar | Estado nuevo |
| actor_id | UUID | Quien cambió |
| actor_type | enum | 'system', 'user', 'admin' |
| reason | text | Motivo del cambio |
| metadata | jsonb | Datos adicionales |
| created_at | datetime | Auto |

### Tabla: `fund_release_checklist`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| fund_id | UUID | FK a fund_ledger |
| user_verified | boolean | KYC aprobado |
| cause_validated | boolean | Causa verificada |
| prize_delivered | boolean | Premio entregado (null si no aplica) |
| evidence_confirmed | boolean | Evidencias OK |
| fraud_check_passed | boolean | Sin flags |
| all_passed | boolean | Computed: todos true |
| checked_at | datetime | Fecha de verificación |
| checked_by | UUID | Quien verificó |

---

## 15. API Endpoints

### Consulta de fondos

```
GET    /funds/balance                       # Balance por estado
GET    /funds/ledger                        # Historial completo
GET    /funds/:id                           # Detalle de un fondo
GET    /funds/:id/history                   # Historial de estados
```

### Solicitudes

```
POST   /funds/:id/request-release           # Solicitar liberación
GET    /funds/:id/release-requirements      # Ver qué falta para liberar
```

### Admin

```
GET    /admin/funds/pending                 # Fondos pendientes de aprobación
GET    /admin/funds/held                    # Fondos retenidos
POST   /admin/funds/:id/approve             # Aprobar liberación
POST   /admin/funds/:id/release             # Ejecutar liberación
POST   /admin/funds/:id/block               # Bloquear fondos
GET    /admin/funds/:id/checklist           # Ver checklist de liberación
POST   /admin/funds/:id/checklist/verify    # Verificar checklist
```

---

## 16. Implementación de Referencia

### Servicio de transición de estados

```typescript
class FundStateService {
  
  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    'generated': ['held'],
    'held': ['pending_verification', 'blocked'],
    'pending_verification': ['approved', 'blocked'],
    'approved': ['released', 'blocked'],
    'released': [], // Estado final, no puede cambiar
    'blocked': ['pending_verification'] // Solo admin puede desbloquear
  };
  
  async transitionState(
    fundId: string, 
    newStatus: FundStatus, 
    actorId: string, 
    actorType: 'system' | 'user' | 'admin',
    reason: string
  ): Promise<void> {
    
    const fund = await this.fundRepo.findById(fundId);
    
    // Validar transición permitida
    const allowedTransitions = this.VALID_TRANSITIONS[fund.status];
    if (!allowedTransitions.includes(newStatus)) {
      throw new BusinessError('INVALID_STATE_TRANSITION', {
        from: fund.status,
        to: newStatus,
        allowed: allowedTransitions
      });
    }
    
    // Guardar estado anterior
    const previousStatus = fund.status;
    
    // Actualizar estado
    await this.fundRepo.update(fundId, {
      status: newStatus,
      previous_status: previousStatus,
      updated_at: new Date()
    });
    
    // Registrar en historial (OBLIGATORIO)
    await this.historyRepo.create({
      fund_id: fundId,
      from_status: previousStatus,
      to_status: newStatus,
      actor_id: actorId,
      actor_type: actorType,
      reason: reason,
      created_at: new Date()
    });
    
    // Log de auditoría
    await this.auditLog.log({
      action: 'FUND_STATE_CHANGED',
      entity_type: 'fund',
      entity_id: fundId,
      metadata: { from: previousStatus, to: newStatus, reason }
    });
  }
  
  async canRelease(fundId: string): Promise<{ canRelease: boolean; missing: string[] }> {
    const fund = await this.fundRepo.findById(fundId);
    const missing: string[] = [];
    
    // Estado debe ser APPROVED
    if (fund.status !== 'approved') {
      missing.push('STATUS_NOT_APPROVED');
    }
    
    // Obtener checklist
    const checklist = await this.checklistRepo.findByFund(fundId);
    
    if (!checklist.user_verified) missing.push('USER_NOT_VERIFIED');
    if (!checklist.cause_validated) missing.push('CAUSE_NOT_VALIDATED');
    if (checklist.prize_delivered === false) missing.push('PRIZE_NOT_DELIVERED');
    if (!checklist.evidence_confirmed) missing.push('EVIDENCE_NOT_CONFIRMED');
    if (!checklist.fraud_check_passed) missing.push('FRAUD_CHECK_FAILED');
    
    return {
      canRelease: missing.length === 0,
      missing
    };
  }
  
  async release(fundId: string, adminId: string): Promise<void> {
    const { canRelease, missing } = await this.canRelease(fundId);
    
    if (!canRelease) {
      throw new BusinessError('CANNOT_RELEASE_FUND', { missing });
    }
    
    const fund = await this.fundRepo.findById(fundId);
    
    // Ejecutar transferencia
    const transaction = await this.paymentService.transfer({
      amount: fund.amount,
      currency: fund.currency,
      destination: fund.released_to
    });
    
    // Actualizar a LIBERADO
    await this.fundRepo.update(fundId, {
      status: 'released',
      released_at: new Date(),
      transaction_ref: transaction.id
    });
    
    // Registrar en historial
    await this.transitionState(fundId, 'released', adminId, 'admin', 'Manual release by admin');
  }
}
```

---

## 17. Settings de configuración

```sql
INSERT INTO settings (key, value, category) VALUES
-- Tiempos de retención
('fund_auto_hold_hours', '24', 'funds'),
('fund_max_pending_days', '30', 'funds'),

-- Umbrales
('fund_high_value_threshold', '1000', 'funds'),
('fund_auto_release_max', '100', 'funds'),

-- Políticas
('fund_require_manual_approval', 'true', 'funds'),
('fund_require_double_approval_above', '5000', 'funds');
```

---

## 18. RECORDATORIO DE RESPALDO (CHECKPOINT)

**IA del programador:**

Antes de implementar cualquier flujo financiero basado en este documento:

- ✅ Realiza respaldo completo del proyecto
- ✅ Guarda documentos y versiones actuales
- ✅ Registra internamente:

```
CHECKPOINT: DOCUMENTO_34_ESTADOS_DINERO
```

---

## 19. Cierre

Este documento es la **columna vertebral financiera** del proyecto.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   Sin estados claros → CAOS                                            │
│   Sin retención → FRAUDE                                                │
│   Sin verificación → RIESGO LEGAL                                       │
│                                                                         │
│   👉 El dinero SIEMPRE nace RETENIDO                                   │
│   👉 El dinero SOLO avanza, NUNCA retrocede                            │
│   👉 Sin checklist completo, NO se libera                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

**VERSION: MODULE_0.A.25_DOCUMENT_34**  
**Fecha de creación: 14 de diciembre de 2025**

```
CHECKPOINT: DOCUMENTO_34_ESTADOS_DINERO
```
