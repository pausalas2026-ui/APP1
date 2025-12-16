# DOCUMENTO 33 – MÓDULO 0.a.24 (VERSIÓN DEFINITIVA, PEDAGÓGICA Y ANTIFRAUDE)

# SISTEMA DE VERIFICACIÓN DE IDENTIDAD (KYC), LIBERACIÓN DE FONDOS, CONTROL DE FRAUDE Y PROTECCIÓN DE LA PLATAFORMA

---

## Documento normativo + operativo
## Documento crítico para dinero, premios y causas

**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento existe para evitar un solo problema:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│        Que salga dinero de la plataforma sin control.                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Si este documento NO se respeta, pasan cosas graves:

| Problema | Consecuencia |
|----------|--------------|
| Personas falsas cobrando | Pérdida económica directa |
| Premios no entregados | Fraude a ganadores |
| Causas inexistentes recibiendo donaciones | Fraude masivo |
| Fraudes sistemáticos | Destrucción de la plataforma |
| Problemas legales | Cierre forzado |
| Destrucción de la confianza | Muerte del proyecto |

### 👉 Este documento define:

- ✅ **CUÁNDO** se puede entregar dinero
- ✅ **CÓMO** se puede entregar dinero
- ✅ **A QUIÉN** se le puede entregar dinero

---

## 2. Regla madre (memorízala)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│         NADIE recibe dinero sin verificación previa.                   │
│                                                                         │
│                            PERO                                         │
│                                                                         │
│     NADIE está obligado a verificarse solo para usar la plataforma.    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Esta regla resuelve el conflicto entre:

| Objetivo | Necesidad |
|----------|-----------|
| **Conversión / Crecimiento** | Facilitar el registro y uso |
| **Seguridad / Antifraude** | Proteger la plataforma y usuarios |

---

## 3. Por qué NO se pide identificación al registrarse

### Explicado con peras y manzanas

Cuando una persona descarga la app:

- ❓ No sabe aún si le gustará
- ❓ No confía todavía
- ❓ No entiende el valor
- ❓ No tiene dinero pendiente

### Si en ese momento le pedimos:

- 📄 INE / DNI
- 📄 Pasaporte
- 📷 Selfie

### 👉 SE VA.

### Por eso:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     REGISTRO = SIMPLE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ Se puede pagar suscripción                                          │
│  ✅ Se puede crear sorteos                                              │
│  ✅ Se puede generar donaciones                                         │
│  ✅ Se puede usar todo el sistema                                       │
│                                                                         │
│  👉 SIN subir identificación                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estados del usuario respecto a verificación

Todo usuario tiene un **estado de verificación**.

### Estados posibles:

| Estado | Código | Descripción | ¿Puede recibir dinero? |
|--------|--------|-------------|------------------------|
| **NO VERIFICADO** | `not_verified` | Estado inicial | ❌ NO |
| **VERIFICACIÓN PENDIENTE** | `verification_pending` | Ya inició KYC | ❌ NO (retenido) |
| **VERIFICADO** | `verified` | KYC aprobado | ✅ SÍ |
| **VERIFICACIÓN RECHAZADA** | `verification_rejected` | KYC fallido | ❌ NO |
| **VERIFICACIÓN EXPIRADA** | `verification_expired` | Debe renovar | ❌ NO |

### Detalle de cada estado:

#### NO VERIFICADO (`not_verified`)
- ✅ Puede usar la app
- ✅ Puede crear sorteos
- ✅ Puede generar dinero
- ❌ **No puede recibir dinero**

#### VERIFICACIÓN PENDIENTE (`verification_pending`)
- Ya inició el proceso KYC
- El dinero sigue **retenido**
- **No se libera nada**

#### VERIFICADO (`verified`)
- ✅ Puede recibir dinero
- ✅ Puede cobrar premios
- ✅ Puede liberar fondos de causas

#### VERIFICACIÓN RECHAZADA (`verification_rejected`)
- ❌ No recibe dinero
- ⚠️ Puede ser bloqueado o revisado manualmente
- Puede reintentar después de X días

---

## 5. ¿CUÁNDO se pide la verificación? (momento exacto)

### Regla fundamental:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   La verificación NO se pide ANTES,                                     │
│   se pide SOLO cuando ocurre un EVENTO DISPARADOR.                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Eventos disparadores (cualquiera de estos):

| # | Evento | Descripción |
|---|--------|-------------|
| 1 | **Solicitud de retiro** | El usuario solicita retirar dinero de una causa |
| 2 | **Cobro de premio** | El usuario quiere recibir dinero por un premio NO donado |
| 3 | **Primera vez** | Es la primera vez que intenta recibir dinero |
| 4 | **Umbral superado** | El monto acumulado supera un umbral (definido por negocio) |
| 5 | **Causa propia** | El usuario crea una causa propia |
| 6 | **Premio alto valor** | El usuario crea un premio de alto valor |

### Mensaje que aparece:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   "Para poder liberar los fondos, necesitamos verificar tu identidad." │
│                                                                         │
│                    [ Iniciar verificación ]                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Qué datos se piden en la verificación (Nivel 1)

### Verificación básica obligatoria (KYC Nivel 1)

#### Se solicita:

| Dato | Tipo | Obligatorio |
|------|------|-------------|
| **Documento oficial** | DNI / INE / Pasaporte | ✅ Sí |
| **Selfie / Prueba de vida** | Foto en tiempo real | ✅ Sí |
| **Datos básicos** | Nombre, fecha nacimiento | ✅ Sí |

#### Esto sirve para:

- ✅ Confirmar que la persona **existe**
- ✅ Asociar **legalmente** responsabilidades
- ✅ Evitar **identidades falsas**

### Regla inquebrantable:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│           👉 Sin KYC Nivel 1, NO hay liberación de dinero              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Verificación reforzada (Nivel 2 – solo en algunos casos)

### ¿Cuándo se activa Nivel 2?

| Condición | Umbral sugerido |
|-----------|-----------------|
| **Montos altos** | > $1,000 USD acumulado |
| **Causas creadas por usuario** | Siempre |
| **Premios de alto valor** | > $500 USD valor estimado |
| **Señales de riesgo** | Flags del sistema antifraude |

### Qué puede incluir Nivel 2:

| Verificación adicional | Descripción |
|------------------------|-------------|
| Documento adicional | Comprobante de domicilio |
| Validación manual | Revisión por equipo humano |
| Contacto directo | Llamada o videollamada |
| Confirmación externa | Verificar con fundación (si es causa) |

### Importante:

👉 **NO todos los usuarios pasan por Nivel 2.**  
Solo los que cumplen las condiciones.

---

## 8. Relación entre verificación y premios (muy importante)

### Caso A – Usuario DONA el premio

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CASO A: PREMIO DONADO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • No recibe dinero por el premio                                       │
│  • Solo debe:                                                           │
│    - Entregar el premio                                                 │
│    - Subir evidencia                                                    │
│                                                                         │
│  Verificación:                                                          │
│  • Puede ser más simple                                                 │
│  • PERO sigue siendo requerida si hay dinero por causa                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Caso B – Usuario NO dona el premio y quiere cobrar su valor

```
┌─────────────────────────────────────────────────────────────────────────┐
│                CASO B: PREMIO CON COBRO DE VALOR                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Flujo con peras y manzanas:                                            │
│                                                                         │
│  1. Se ejecuta el sorteo                                                │
│           ↓                                                             │
│  2. Hay un ganador                                                      │
│           ↓                                                             │
│  3. El usuario entrega el premio                                        │
│           ↓                                                             │
│  4. El usuario sube:                                                    │
│     • Fotos de entrega                                                  │
│     • Datos del ganador                                                 │
│           ↓                                                             │
│  5. La plataforma verifica con el ganador                               │
│           ↓                                                             │
│  6. SOLO DESPUÉS:                                                       │
│     • Se pide o valida KYC                                              │
│     • Se libera el dinero                                               │
│                                                                         │
│  👉 NUNCA al revés                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Relación entre verificación y causas propias

### Si el usuario crea una causa propia:

| Requisito | Descripción |
|-----------|-------------|
| **Acreditar existencia** | Debe demostrar que la causa existe |
| **Verificarse como persona** | KYC obligatorio |
| **Dinero retenido** | Hasta que todo esté validado |

### Flujo completo:

```
Usuario crea causa propia
        ↓
Sube documentación de causa
        ↓
Plataforma revisa causa
        ↓
Usuario inicia KYC (si no lo ha hecho)
        ↓
Causa aprobada + KYC aprobado
        ↓
Dinero puede ser liberado
```

### Regla:

👉 **Esto evita causas falsas.**

---

## 10. Qué pasa si el usuario NO quiere verificarse

### Explicado claro:

| Acción | ¿Permitida? |
|--------|-------------|
| Seguir usando la app | ✅ SÍ |
| Seguir pagando su plan | ✅ SÍ |
| Seguir haciendo sorteos | ✅ SÍ |
| Seguir generando impacto | ✅ SÍ |
| **Recibir dinero** | ❌ NO |

### Esto:

- ❌ **NO** es motivo de cancelación forzada
- ❌ **NO** bloquea la app
- ❌ **NO** castiga al usuario
- ✅ Es simplemente una **regla de seguridad**

---

## 11. ¿Proveedor externo o sistema propio?

### Recomendación firme:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   1. Usar PROVEEDOR EXTERNO de KYC al inicio                           │
│   2. Diseñar una CAPA ABSTRACTA de verificación                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Ventajas de proveedor externo:

| Ventaja | Descripción |
|---------|-------------|
| **Menos riesgo legal** | El proveedor asume responsabilidades |
| **Menos desarrollo** | No reinventar la rueda |
| **Más seguridad** | Especialistas en el tema |
| **Cumplimiento normativo** | Proveedores ya cumplen regulaciones |

### Proveedores sugeridos (referencia):

| Proveedor | Características |
|-----------|-----------------|
| **Onfido** | Global, robusto |
| **Jumio** | Verificación de documentos |
| **Veriff** | Fácil integración |
| **Truora** | Latinoamérica |
| **Stripe Identity** | Si ya usas Stripe |

### Arquitectura recomendada:

```typescript
// Capa abstracta - permite cambiar proveedor
interface KYCProvider {
  startVerification(userId: string): Promise<VerificationSession>;
  checkStatus(sessionId: string): Promise<VerificationStatus>;
  getResult(sessionId: string): Promise<VerificationResult>;
}

// Implementaciones
class OnfidoProvider implements KYCProvider { ... }
class JumioProvider implements KYCProvider { ... }
class ManualProvider implements KYCProvider { ... } // Fallback
```

👉 **El sistema debe permitir cambiar de proveedor en el futuro.**

---

## 12. Estados del dinero (muy importante para backend)

### Todo dinero debe tener estado:

| Estado | Código | Descripción |
|--------|--------|-------------|
| **GENERADO** | `generated` | Dinero creado por transacción |
| **RETENIDO** | `held` | Esperando verificaciones |
| **PENDIENTE DE VERIFICACIÓN** | `pending_verification` | Usuario debe completar KYC |
| **APROBADO** | `approved` | Listo para liberar |
| **LIBERADO** | `released` | Transferido al usuario |
| **RECHAZADO** | `rejected` | No se puede liberar |
| **BLOQUEADO** | `blocked` | Fraude detectado |

### Diagrama de estados:

```
GENERADO → RETENIDO → PENDIENTE_VERIFICACIÓN → APROBADO → LIBERADO
                                            ↘ RECHAZADO
                                            ↘ BLOQUEADO
```

### Regla crítica:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│               👉 NUNCA saltar estados                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 13. Checklist obligatorio antes de liberar dinero

### Antes de liberar fondos, el sistema debe validar:

| # | Validación | Descripción |
|---|------------|-------------|
| 1 | ☐ Usuario verificado | KYC Nivel 1 aprobado |
| 2 | ☐ Premio entregado | Si aplica, evidencia verificada |
| 3 | ☐ Evidencia subida | Fotos de entrega |
| 4 | ☐ Ganador confirmado | Contacto con ganador exitoso |
| 5 | ☐ Causa verificada | Si es causa propia |
| 6 | ☐ No hay flags de fraude | Sistema antifraude OK |

### Regla:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│        Si ALGO falla → NO liberar dinero                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 14. Mensaje UX correcto (muy importante)

### ❌ NO decir:

```
"Debes verificarte para usar la app."
```

### ✅ SÍ decir:

```
"Para liberar fondos, necesitamos verificar tu identidad."
```

### ¿Por qué importa?

| Mensaje incorrecto | Mensaje correcto |
|-------------------|------------------|
| Genera abandono | Genera confianza |
| Parece obligación | Parece protección |
| Frustra al usuario | Informa al usuario |

### Mensajes UX recomendados:

| Momento | Mensaje |
|---------|---------|
| **Al generar dinero** | "¡Felicidades! Has generado $X. Para retirarlo, necesitarás verificar tu identidad." |
| **Al solicitar retiro** | "Para proteger tus fondos y los de las causas, necesitamos verificar tu identidad." |
| **KYC en proceso** | "Estamos verificando tu identidad. Te avisaremos cuando esté listo." |
| **KYC aprobado** | "¡Verificación completada! Ya puedes retirar tus fondos." |
| **KYC rechazado** | "No pudimos verificar tu identidad. Puedes intentarlo de nuevo en X días." |

---

## 15. Modelo de Datos

### Tabla: `user_verifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| status | enum | 'not_verified', 'pending', 'verified', 'rejected', 'expired' |
| level | enum | 'level_1', 'level_2' |
| provider | varchar | Proveedor KYC usado |
| provider_session_id | varchar | ID de sesión del proveedor |
| provider_response | jsonb | Respuesta completa del proveedor |
| document_type | varchar | Tipo de documento verificado |
| document_country | varchar | País del documento |
| verified_name | varchar | Nombre verificado |
| verified_dob | date | Fecha de nacimiento verificada |
| rejection_reason | text | Razón de rechazo |
| attempts | integer | Intentos de verificación |
| last_attempt_at | datetime | Último intento |
| verified_at | datetime | Fecha de verificación exitosa |
| expires_at | datetime | Fecha de expiración |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `fund_states`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| source_type | enum | 'sweepstake', 'cause', 'prize' |
| source_id | UUID | FK a la fuente |
| amount | decimal | Monto |
| currency | varchar | Moneda |
| status | enum | 'generated', 'held', 'pending_verification', 'approved', 'released', 'rejected', 'blocked' |
| held_reason | text | Razón de retención |
| release_conditions | jsonb | Condiciones para liberar |
| released_at | datetime | Fecha de liberación |
| released_to | varchar | Destino de fondos |
| transaction_id | varchar | ID de transacción bancaria |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `verification_triggers`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| trigger_type | enum | 'withdrawal_request', 'prize_payment', 'threshold_reached', 'cause_creation', 'high_value_prize' |
| trigger_amount | decimal | Monto que disparó |
| trigger_source_id | UUID | ID del recurso que disparó |
| verification_required_level | enum | 'level_1', 'level_2' |
| created_at | datetime | Auto |

### Tabla: `kyc_audit_log`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| action | varchar | Acción realizada |
| previous_status | varchar | Estado anterior |
| new_status | varchar | Estado nuevo |
| actor_id | UUID | Quien realizó la acción |
| actor_type | enum | 'system', 'user', 'admin', 'provider' |
| metadata | jsonb | Datos adicionales |
| ip_address | varchar | IP |
| created_at | datetime | Auto |

---

## 16. API Endpoints

### Verificación de Usuario

```
GET    /verification/status                 # Estado de verificación del usuario
POST   /verification/start                  # Iniciar proceso KYC
POST   /verification/upload-document        # Subir documento
POST   /verification/upload-selfie          # Subir selfie
GET    /verification/session/:id            # Estado de sesión KYC
POST   /verification/webhook                # Webhook del proveedor KYC
```

### Fondos y Retiros

```
GET    /funds/balance                       # Balance disponible y retenido
GET    /funds/history                       # Historial de fondos
POST   /funds/request-withdrawal            # Solicitar retiro
GET    /funds/withdrawal/:id                # Estado de retiro
GET    /funds/requirements                  # Requisitos para liberar fondos
```

### Admin

```
GET    /admin/verifications/pending         # Verificaciones pendientes
POST   /admin/verifications/:id/approve     # Aprobar manualmente
POST   /admin/verifications/:id/reject      # Rechazar manualmente
GET    /admin/funds/held                    # Fondos retenidos
POST   /admin/funds/:id/release             # Liberar fondos manualmente
POST   /admin/funds/:id/block               # Bloquear fondos
GET    /admin/kyc-audit/:userId             # Auditoría KYC de usuario
```

---

## 17. Implementación de Referencia

### Servicio de Verificación

```typescript
class VerificationService {
  
  async checkIfVerificationRequired(userId: string, action: TriggerType): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    
    // Si ya está verificado, no se requiere
    if (user.verification_status === 'verified') {
      return false;
    }
    
    // Verificar si la acción requiere KYC
    const triggers = ['withdrawal_request', 'prize_payment', 'cause_creation'];
    if (triggers.includes(action)) {
      return true;
    }
    
    // Verificar umbral de monto
    const pendingFunds = await this.fundsRepo.getPendingAmount(userId);
    const threshold = await this.settingsRepo.get('kyc_threshold_amount');
    
    if (pendingFunds >= threshold) {
      return true;
    }
    
    return false;
  }
  
  async startVerification(userId: string, level: 'level_1' | 'level_2'): Promise<VerificationSession> {
    // Crear sesión con proveedor externo
    const session = await this.kycProvider.startVerification(userId);
    
    // Guardar en BD
    await this.verificationRepo.create({
      user_id: userId,
      status: 'pending',
      level,
      provider: this.kycProvider.name,
      provider_session_id: session.id
    });
    
    // Log de auditoría
    await this.auditLog.log({
      user_id: userId,
      action: 'KYC_STARTED',
      new_status: 'pending',
      metadata: { level, provider: this.kycProvider.name }
    });
    
    return session;
  }
  
  async processProviderWebhook(payload: ProviderWebhook): Promise<void> {
    const verification = await this.verificationRepo.findByProviderSession(payload.session_id);
    
    if (payload.status === 'approved') {
      await this.approveVerification(verification.id, payload);
    } else if (payload.status === 'rejected') {
      await this.rejectVerification(verification.id, payload.reason);
    }
  }
  
  async approveVerification(verificationId: string, data: ProviderResult): Promise<void> {
    const verification = await this.verificationRepo.findById(verificationId);
    
    await this.verificationRepo.update(verificationId, {
      status: 'verified',
      verified_name: data.name,
      verified_dob: data.date_of_birth,
      document_type: data.document_type,
      document_country: data.country,
      verified_at: new Date(),
      provider_response: data
    });
    
    // Actualizar usuario
    await this.userRepo.update(verification.user_id, {
      verification_status: 'verified'
    });
    
    // Procesar fondos pendientes
    await this.fundsService.processVerifiedUser(verification.user_id);
    
    // Notificar
    await this.notificationService.send(verification.user_id, 'KYC_APPROVED');
    
    // Auditoría
    await this.auditLog.log({
      user_id: verification.user_id,
      action: 'KYC_APPROVED',
      previous_status: 'pending',
      new_status: 'verified'
    });
  }
}
```

### Servicio de Fondos

```typescript
class FundsService {
  
  async canReleaseFunds(fundId: string): Promise<{ canRelease: boolean; blockers: string[] }> {
    const fund = await this.fundsRepo.findById(fundId);
    const user = await this.userRepo.findById(fund.user_id);
    const blockers: string[] = [];
    
    // 1. Usuario verificado
    if (user.verification_status !== 'verified') {
      blockers.push('USER_NOT_VERIFIED');
    }
    
    // 2. Si es premio, verificar entrega
    if (fund.source_type === 'prize') {
      const delivery = await this.deliveryRepo.findByPrize(fund.source_id);
      if (delivery.delivery_status !== 'verified') {
        blockers.push('PRIZE_NOT_DELIVERED');
      }
    }
    
    // 3. Si es causa propia, verificar causa
    if (fund.source_type === 'cause') {
      const cause = await this.causeRepo.findById(fund.source_id);
      if (cause.verification_status !== 'approved') {
        blockers.push('CAUSE_NOT_VERIFIED');
      }
    }
    
    // 4. Verificar flags de fraude
    const fraudCheck = await this.antifraudService.check(fund.user_id);
    if (fraudCheck.hasFlags) {
      blockers.push('FRAUD_FLAGS_DETECTED');
    }
    
    return {
      canRelease: blockers.length === 0,
      blockers
    };
  }
  
  async releaseFunds(fundId: string): Promise<void> {
    const { canRelease, blockers } = await this.canReleaseFunds(fundId);
    
    if (!canRelease) {
      throw new BusinessError('CANNOT_RELEASE_FUNDS', { blockers });
    }
    
    const fund = await this.fundsRepo.findById(fundId);
    
    // Actualizar estado
    await this.fundsRepo.update(fundId, {
      status: 'approved'
    });
    
    // Procesar pago
    const transaction = await this.paymentService.transfer(
      fund.user_id,
      fund.amount,
      fund.currency
    );
    
    // Marcar como liberado
    await this.fundsRepo.update(fundId, {
      status: 'released',
      released_at: new Date(),
      transaction_id: transaction.id
    });
    
    // Auditoría
    await this.auditLog.log({
      action: 'FUNDS_RELEASED',
      fund_id: fundId,
      amount: fund.amount,
      user_id: fund.user_id
    });
  }
}
```

---

## 18. Configuración Admin

### Settings requeridos:

```sql
INSERT INTO settings (key, value, category) VALUES
-- Umbrales KYC
('kyc_threshold_amount', '100', 'kyc'),
('kyc_high_value_prize_threshold', '500', 'kyc'),
('kyc_level2_threshold', '1000', 'kyc'),

-- Reintentos
('kyc_max_attempts', '3', 'kyc'),
('kyc_retry_cooldown_days', '7', 'kyc'),
('kyc_expiration_days', '365', 'kyc'),

-- Proveedor
('kyc_provider', 'onfido', 'kyc'),
('kyc_provider_api_key', 'xxx', 'kyc'),

-- Fondos
('funds_auto_release_enabled', 'false', 'funds'),
('funds_manual_review_threshold', '500', 'funds');
```

---

## 19. Checklist de Implementación

- [ ] Modelo de datos de verificación creado
- [ ] Integración con proveedor KYC externo
- [ ] Capa abstracta para cambiar proveedores
- [ ] Estados de verificación implementados
- [ ] Triggers de verificación configurados
- [ ] Estados de fondos implementados
- [ ] Validaciones antes de liberar dinero
- [ ] Endpoints de verificación
- [ ] Endpoints de fondos
- [ ] Panel admin para revisión manual
- [ ] Webhooks del proveedor
- [ ] Mensajes UX correctos
- [ ] Auditoría completa
- [ ] Tests de flujos críticos

---

## 20. Backups obligatorios

**Programador IA:**

Después de integrar este Documento 33:
- ✅ Backup local
- ✅ Backup remoto
- ✅ Registrar versión:

```
VERSION: DOCUMENTO_33_COMPLETED
```

---

## 21. Cierre

Este documento protege:

- ✅ A la plataforma
- ✅ A los usuarios honestos
- ✅ A las causas
- ✅ Al proyecto completo

### Reglas finales:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│            👉 Sin verificación NO hay dinero                           │
│            👉 Pero la app SIGUE funcionando                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## RECORDATORIO OBLIGATORIO DE RESPALDO

**IA del programador:**

Antes de continuar con cualquier implementación basada en este documento:

- ✅ Realiza un respaldo completo del estado actual
- ✅ Guarda documentos, configuraciones y versiones
- ✅ Registra internamente:

```
CHECKPOINT: DOCUMENTO_33_DEFINITIVO
```

---

**VERSION: MODULE_0.A.24_DOCUMENT_33_DEFINITIVO**  
**Fecha de creación: 14 de diciembre de 2025**
