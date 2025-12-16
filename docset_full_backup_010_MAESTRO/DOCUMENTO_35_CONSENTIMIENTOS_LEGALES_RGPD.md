# DOCUMENTO 35 – MÓDULO 0.a.26

## CONTRATOS, CONSENTIMIENTOS LEGALES, AUTORIZACIÓN DE DATOS (RGPD) Y PRUEBAS DE ACEPTACIÓN

**Documento normativo + operativo**
**Documento crítico legal y de protección del proyecto**
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento existe para responder una pregunta básica pero crítica:

> **¿Cómo sabemos, y cómo demostramos legalmente, que el usuario aceptó las reglas, el uso de sus datos y las condiciones de la plataforma?**

Si esto no se define bien:
- hay riesgos legales,
- hay problemas con protección de datos,
- hay disputas por premios,
- hay disputas por dinero,
- y el proyecto queda expuesto.

👉 **Este documento define QUÉ se acepta, CUÁNDO se acepta, CÓMO se acepta y CÓMO se prueba.**

---

## 2. Principio rector (muy importante)

> **Todo debe estar aceptado legalmente,**
> **pero no todo debe molestar al usuario.**

Esto significa:
- consentimiento válido y demostrable,
- experiencia limpia y no intrusiva.

---

## 3. Tipos de contratos y consentimientos necesarios

Para este proyecto existen **CUATRO tipos de aceptación distintos**.

**No mezclar, no simplificar, no omitir.**

---

### 3.1 Términos y Condiciones de Uso de la Plataforma (TOS)

| Aspecto | Detalle |
|---------|---------|
| **Quién los acepta** | Todo usuario que crea cuenta. Todo usuario que paga suscripción. |
| **Qué cubren** | Uso permitido de la plataforma. Reglas de sorteos. Reglas de premios. Reglas de dinero. Retención de fondos. Antifraude. Suspensión o cancelación de cuentas. Responsabilidades y límites. |
| **Cuándo se aceptan** | En el registro. Se reafirman automáticamente al pagar la suscripción. |

**Cómo se acepta (UX correcto):**

Texto corto debajo del botón:
> "Al crear tu cuenta y/o pagar tu suscripción, aceptas los Términos de Uso."

- Link visible al documento completo.
- 👉 **No popup largo.**

---

### 3.2 Política de Privacidad y Tratamiento de Datos (RGPD)

| Aspecto | Detalle |
|---------|---------|
| **Quién la acepta** | Usuarios registrados. Usuarios que pagan. Participantes en sorteos. Donantes. Ganadores. |
| **Qué autoriza** | Tratamiento de datos personales. Uso de datos para sorteos. Contacto en caso de ganar. Verificación de identidad (cuando aplique). Marketing derivado. Cumplimiento legal. |
| **Cuándo se acepta** | En el registro. Al pagar suscripción. Al participar en un sorteo. Al donar. |

👉 **La aceptación puede ser implícita por acción, siempre que el texto esté visible.**

---

### 3.3 Bases Legales de Participación en Sorteos

| Aspecto | Detalle |
|---------|---------|
| **Quién las acepta** | Toda persona que participe en un sorteo (tenga o no cuenta creada). |
| **Qué cubren** | Reglas del sorteo específico. Uso de datos del participante. Publicación de resultados. Contacto en caso de ganar. Cesión de datos al organizador del sorteo. Donaciones asociadas (si existen). |
| **Cuándo se aceptan** | Antes de pulsar "Participar". |

**Cómo se acepta:**

Texto justo antes del botón:
> "Al participar aceptas las bases del sorteo y la política de privacidad."

- Link a las bases del sorteo concreto.
- 👉 **Este consentimiento es específico por sorteo.**

---

### 3.4 Consentimiento para Donaciones y Recibos

| Aspecto | Detalle |
|---------|---------|
| **Quién lo acepta** | Donantes. Participantes que realizan aportaciones. |
| **Qué cubre** | Autorización de la donación. Emisión de recibo de donativo. Uso de datos para fines fiscales y legales. |
| **Cuándo se acepta** | En el flujo de donación. |

**Cómo se acepta:**

Texto visible antes de confirmar:
> "Al donar autorizas el tratamiento de tus datos y la emisión del recibo correspondiente."

---

## 4. Regla clave: consentimiento ≠ verificación

**Muy importante para no mezclar conceptos:**

| Concepto | Descripción |
|----------|-------------|
| **Consentimiento** | Ocurre al usar, pagar o participar. Es legal. No bloquea uso. |
| **Verificación (KYC)** | Ocurre solo para liberar dinero. Acredita identidad. Puede requerir documentos. |

> 👉 **Nunca pedir KYC solo para consentir.**

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSENTIMIENTO                           │
│                                                             │
│  ✅ Registro                                                │
│  ✅ Pago suscripción                                        │
│  ✅ Participación sorteo                                    │
│  ✅ Donación                                                │
│                                                             │
│  → No requiere documentos                                   │
│  → No bloquea uso de la app                                 │
│  → Es un acto legal                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    VERIFICACIÓN (KYC)                       │
│                                                             │
│  ⚠️ Solo para liberar dinero                                │
│  ⚠️ Solo cuando hay dinero pendiente                        │
│                                                             │
│  → Requiere documentos                                      │
│  → Puede bloquear retiro (no uso)                           │
│  → Es un acto de identidad                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Cómo se guardan las aceptaciones (backend obligatorio)

**Cada aceptación debe generar un registro legal inmutable.**

### Campos mínimos por aceptación:

| Campo | Descripción |
|-------|-------------|
| `user_id` | Si existe cuenta |
| `participant_id` o `session_id` | Si no hay cuenta |
| `consent_type` | Tipo de consentimiento |
| `document_version` | Versión del documento aceptado |
| `accepted_at` | Fecha y hora |
| `ip_address` | IP del usuario |
| `user_agent` | User agent / fingerprint básico |

### Tipos de consentimiento (`consent_type`):

```
TOS              → Términos y Condiciones
PRIVACY          → Política de Privacidad
SORTEO_{id}      → Bases de sorteo específico
DONACION         → Consentimiento de donación
```

> 👉 **Sin registro = aceptación no demostrable.**

### Tabla: `user_consents`

```sql
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación del usuario
    user_id UUID REFERENCES users(id),
    participant_id UUID,
    session_id VARCHAR(255),
    
    -- Tipo y versión
    consent_type VARCHAR(50) NOT NULL,
    document_version VARCHAR(20) NOT NULL,
    
    -- Referencia opcional (ej: sorteo_id)
    reference_type VARCHAR(50),
    reference_id UUID,
    
    -- Datos de la aceptación
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET NOT NULL,
    user_agent TEXT,
    fingerprint VARCHAR(255),
    
    -- Metadatos
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT chk_user_or_participant 
        CHECK (user_id IS NOT NULL OR participant_id IS NOT NULL OR session_id IS NOT NULL)
);

-- Índices
CREATE INDEX idx_consents_user ON user_consents(user_id);
CREATE INDEX idx_consents_type ON user_consents(consent_type);
CREATE INDEX idx_consents_version ON user_consents(document_version);
CREATE INDEX idx_consents_date ON user_consents(accepted_at);
```

### Tabla: `legal_documents`

```sql
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    document_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    
    -- Contenido
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Fechas
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,
    
    -- Estado
    is_current BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Constraints
    UNIQUE(document_type, version)
);

-- Índices
CREATE INDEX idx_legal_docs_type ON legal_documents(document_type);
CREATE INDEX idx_legal_docs_current ON legal_documents(is_current) WHERE is_current = TRUE;
```

---

## 6. Versionado de documentos legales (muy importante)

Cada documento legal tiene versión:
- `v1.0`, `v1.1`, `v2.0`, etc.

**Cuando cambia el documento:**
- ❌ No se borra el anterior
- ✅ Se crea nueva versión

**El sistema debe saber:**
- Qué versión aceptó cada usuario

> 👉 **Esto protege frente a reclamaciones futuras.**

### Flujo de versionado:

```
┌─────────────────────────────────────────────────────────────┐
│                   VERSIONADO LEGAL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Documento TOS v1.0 → Usuario A acepta                   │
│                                                             │
│  2. TOS cambia → Se crea TOS v1.1                           │
│     - v1.0 permanece (is_current = FALSE)                   │
│     - v1.1 es actual (is_current = TRUE)                    │
│                                                             │
│  3. Usuario A tiene registro: TOS v1.0                      │
│     → Válido para acciones antes de v1.1                    │
│                                                             │
│  4. Usuario B registra ahora → Acepta TOS v1.1              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Qué NO se debe hacer (errores comunes)

| ❌ Error | Consecuencia |
|----------|--------------|
| Esconder textos legales | Consentimiento inválido |
| Usar textos invisibles | Violación RGPD |
| Forzar popups largos | Mala UX, abandono |
| Asumir aceptación sin registro | No demostrable |
| Reutilizar consentimiento genérico | Incompleto legalmente |
| Borrar versiones antiguas | Pérdida de evidencia |
| Mezclar consentimiento con KYC | Confusión de conceptos |

---

## 8. Mensajes UX correctos (ejemplos)

### Registro:
```
"Al crear tu cuenta aceptas los Términos de Uso y la Política de Privacidad."
[Link: Términos] [Link: Privacidad]
```

### Pago de suscripción:
```
"Al completar el pago confirmas la aceptación de los Términos y la Política de Privacidad."
[Link: Términos] [Link: Privacidad]
```

### Participación en sorteo:
```
"Al participar aceptas las bases del sorteo y la política de privacidad."
[Link: Bases del sorteo] [Link: Privacidad]
```

### Donación:
```
"Al donar aceptas el tratamiento de tus datos y la emisión del recibo."
[Link: Política de donaciones]
```

### Implementación frontend:

```tsx
// Componente de consentimiento
interface ConsentTextProps {
  type: 'register' | 'payment' | 'raffle' | 'donation';
  raffleId?: string;
}

const consentTexts = {
  register: {
    text: 'Al crear tu cuenta aceptas los',
    links: [
      { label: 'Términos de Uso', href: '/legal/terms' },
      { label: 'Política de Privacidad', href: '/legal/privacy' }
    ]
  },
  payment: {
    text: 'Al completar el pago confirmas la aceptación de los',
    links: [
      { label: 'Términos', href: '/legal/terms' },
      { label: 'Política de Privacidad', href: '/legal/privacy' }
    ]
  },
  raffle: {
    text: 'Al participar aceptas las',
    links: [
      { label: 'bases del sorteo', href: '/raffle/{id}/terms' },
      { label: 'política de privacidad', href: '/legal/privacy' }
    ]
  },
  donation: {
    text: 'Al donar aceptas el tratamiento de tus datos y la',
    links: [
      { label: 'emisión del recibo', href: '/legal/donations' }
    ]
  }
};
```

---

## 9. Relación con cancelaciones y suscripciones

| Concepto | Efecto |
|----------|--------|
| **La aceptación legal** | NO impide cancelar |
| **La cancelación** | NO invalida aceptaciones previas |
| **Los consentimientos** | Siguen siendo válidos para acciones ya realizadas |

### Ejemplo:

```
Usuario acepta TOS v1.0 el 1 de enero
Usuario participa en Sorteo A el 15 de enero
Usuario cancela suscripción el 1 de febrero

→ El consentimiento del Sorteo A SIGUE VÁLIDO
→ La cancelación NO borra los registros de consentimiento
→ Si hay disputa sobre Sorteo A, se usa el registro del 15 de enero
```

---

## 10. Checklist para el programador IA

### Antes de implementar flujos de registro, pago o participación:

| ✅ | Requisito |
|----|-----------|
| ☐ | Texto legal visible |
| ☐ | Link al documento correcto |
| ☐ | Registro de aceptación |
| ☐ | Versión guardada |
| ☐ | Fecha e IP guardadas |

> **Si falta uno → implementación incompleta.**

### Validación por flujo:

```
┌─────────────────────────────────────────────────────────────┐
│                      REGISTRO                               │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mostrar texto: "Al crear tu cuenta aceptas..."           │
│ ☐ Link a TOS visible                                        │
│ ☐ Link a Privacy visible                                    │
│ ☐ Al submit: guardar consent TOS                            │
│ ☐ Al submit: guardar consent PRIVACY                        │
│ ☐ Incluir IP, user_agent, timestamp                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       PAGO                                  │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mostrar texto: "Al completar el pago..."                  │
│ ☐ Links visibles                                            │
│ ☐ Al procesar pago: reafirmar consent TOS                   │
│ ☐ Al procesar pago: reafirmar consent PRIVACY               │
│ ☐ Incluir IP, user_agent, timestamp                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      SORTEO                                 │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mostrar texto: "Al participar aceptas..."                 │
│ ☐ Link a bases del sorteo específico                        │
│ ☐ Link a privacy                                            │
│ ☐ Al participar: guardar consent SORTEO_{id}                │
│ ☐ Incluir IP, user_agent, timestamp                         │
│ ☐ Si no hay cuenta: usar session_id o participant_id        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     DONACIÓN                                │
├─────────────────────────────────────────────────────────────┤
│ ☐ Mostrar texto: "Al donar aceptas..."                      │
│ ☐ Link a política de donaciones                             │
│ ☐ Al confirmar: guardar consent DONACION                    │
│ ☐ Incluir IP, user_agent, timestamp                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Servicio de consentimientos (backend)

```typescript
// consent.service.ts

interface ConsentRecord {
  userId?: string;
  participantId?: string;
  sessionId?: string;
  consentType: 'TOS' | 'PRIVACY' | 'SORTEO' | 'DONACION';
  documentVersion: string;
  referenceType?: string;
  referenceId?: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class ConsentService {
  
  async recordConsent(data: ConsentRecord): Promise<void> {
    // Validar que hay al menos un identificador
    if (!data.userId && !data.participantId && !data.sessionId) {
      throw new Error('Se requiere al menos un identificador');
    }
    
    // Obtener versión actual del documento
    const currentDoc = await this.getCurrentDocumentVersion(data.consentType);
    
    // Crear registro inmutable
    await this.prisma.userConsent.create({
      data: {
        userId: data.userId,
        participantId: data.participantId,
        sessionId: data.sessionId,
        consentType: data.consentType,
        documentVersion: currentDoc.version,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        acceptedAt: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      }
    });
  }
  
  async hasValidConsent(
    userId: string, 
    consentType: string,
    referenceId?: string
  ): Promise<boolean> {
    const consent = await this.prisma.userConsent.findFirst({
      where: {
        userId,
        consentType,
        ...(referenceId && { referenceId })
      },
      orderBy: { acceptedAt: 'desc' }
    });
    
    return !!consent;
  }
  
  async getConsentHistory(userId: string): Promise<UserConsent[]> {
    return this.prisma.userConsent.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' }
    });
  }
  
  async getCurrentDocumentVersion(type: string): Promise<LegalDocument> {
    const doc = await this.prisma.legalDocument.findFirst({
      where: {
        documentType: type,
        isCurrent: true
      }
    });
    
    if (!doc) {
      throw new Error(`No hay documento legal activo para: ${type}`);
    }
    
    return doc;
  }
}
```

---

## 12. RECORDATORIO DE RESPALDO (CHECKPOINT LEGAL)

### IA del programador:

**Antes de implementar cambios basados en este documento:**

1. ✅ Realiza respaldo completo del proyecto.
2. ✅ Guarda estado actual de documentos y configuraciones.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_35_CONSENTIMIENTOS
VERSION: docset_full_backup_009
```

---

## 13. Resumen ejecutivo

### Los 4 tipos de consentimiento:

| # | Tipo | Momento | Registro |
|---|------|---------|----------|
| 1 | TOS | Registro + Pago | `TOS` |
| 2 | Privacy | Registro + Pago + Sorteo + Donación | `PRIVACY` |
| 3 | Bases Sorteo | Antes de participar | `SORTEO_{id}` |
| 4 | Donación | Al confirmar donación | `DONACION` |

### Reglas de oro:

1. **Todo texto legal visible** (no escondido)
2. **Todo consentimiento registrado** (con IP, fecha, versión)
3. **Documentos versionados** (nunca borrar)
4. **Consentimiento ≠ KYC** (no mezclar)
5. **Cancelación ≠ Invalidación** (siguen válidos)

---

## 14. Cierre

Este documento protege:
- ✅ legalmente a la plataforma,
- ✅ a los usuarios,
- ✅ a las causas,
- ✅ y al proyecto completo.

> 👉 **Sin consentimiento registrado, la plataforma queda expuesta.**

---

```
=========================================================
FIN DEL DOCUMENTO 35
MÓDULO 0.a.26 — CONSENTIMIENTOS LEGALES Y RGPD
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
