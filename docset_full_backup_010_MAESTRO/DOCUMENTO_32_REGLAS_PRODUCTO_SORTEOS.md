# DOCUMENTO 32 – MÓDULO 0.a.23 (VERSIÓN DEFINITIVA INTEGRADA)

# REGLAS DE PRODUCTO, ALCANCE FUNCIONAL, LÍMITES NO NEGOCIABLES Y MODELO OPERATIVO DEL MÓDULO DE SORTEOS CON IMPACTO SOCIAL

---

## Documento ANCLA del proyecto

**Dirigido a:** Programador IA (nivel no experto)  
**Lectura obligatoria antes de continuar cualquier desarrollo**

---

## 1. Para qué existe este documento (explicado fácil)

Este documento existe para **evitar errores graves y costosos**.

### Errores típicos que este documento PREVIENE:

- ❌ Confundir sorteos con ecommerce.
- ❌ Mezclar donaciones con ventas.
- ❌ Pensar que "premio = producto vendido".
- ❌ Asumir que siempre el usuario dona el premio.
- ❌ Entregar dinero sin verificar entrega del premio.
- ❌ Aceptar causas falsas o no verificadas.
- ❌ Permitir fraudes por premios inexistentes.

👉 **Este documento te dice exactamente qué puede pasar y qué NO puede pasar.**  
👉 **Si algo no está aquí, NO se implementa.**

---

## 2. Qué tipo de aplicación estamos construyendo (muy claro)

### Estamos construyendo:

> Una plataforma de **SORTEOS con impacto social obligatorio**,  
> donde el **sorteo es el producto principal**,  
> el **premio es un incentivo** (no una venta),  
> y el **marketing es una consecuencia** del sorteo.

### Dicho con peras y manzanas:

| LO QUE SÍ ES | LO QUE NO ES |
|--------------|--------------|
| Plataforma de sorteos | Tienda online |
| Participación en sorteos | Compra de productos |
| Donaciones a causas | Ventas con % donación |
| Premios como incentivos | Productos a la venta |
| Marketing por engagement | Ecommerce tradicional |

- ✅ Aquí **no se compra nada**.
- ✅ Aquí **no se venden productos**.
- ✅ Aquí las personas **participan en sorteos**.
- ✅ A veces **donan a una causa**.
- ✅ A veces **ganan un premio**.
- ✅ Y todo eso **genera datos y reputación**.

---

## 3. Qué SÍ puede hacer el usuario respecto a los PREMIOS

### 3.1 Premios predeterminados de la plataforma

La plataforma debe ofrecer un **catálogo de premios predefinidos**, organizados por categorías claras.

#### Ejemplos de categorías (referencia, no limitante):

| Categoría | Ejemplos |
|-----------|----------|
| **Mujer** | bolsos, cosmética, accesorios |
| **Hombre** | relojes, ropa, accesorios |
| **Tecnología** | gadgets, electrónicos |
| **Hogar** | artículos para casa |
| **Experiencias** | viajes, eventos, servicios |

#### Reglas de premios predeterminados:

🔹 Estos premios **NO se venden**.  
🔹 Son **incentivos de sorteo**.  
🔹 La plataforma **controla su disponibilidad**.

### 3.2 Premios cargados por el usuario (premio propio)

El usuario **SÍ puede subir su propio premio**, aunque no tenga tienda integrada.

#### Ejemplos válidos:

- Un objeto nuevo.
- Un objeto usado.
- Un regalo personal.
- Un producto de su negocio (sin venderlo).

#### Información obligatoria que el usuario debe subir:

| Campo | Descripción | Obligatorio |
|-------|-------------|-------------|
| `images` | Foto(s) del premio | ✅ Sí |
| `name` | Nombre del premio | ✅ Sí |
| `description` | Descripción clara | ✅ Sí |
| `estimated_value` | Valor estimado (solo referencia, no precio) | ✅ Sí |
| `condition` | Estado: nuevo / usado | ✅ Sí |
| `delivered_by` | Quién entrega el premio (usuario o plataforma) | ✅ Sí |
| `delivery_conditions` | Condiciones de entrega | ✅ Sí |

#### Aclaraciones importantes:

👉 Esto **NO convierte a la plataforma en ecommerce**.  
👉 El premio sigue siendo un **incentivo, no una venta**.

---

## 4. Regla crítica: ¿el usuario dona el premio o NO lo dona?

Existen **DOS escenarios válidos**, y el sistema debe distinguirlos claramente.

### Escenario A – El usuario DONA el premio

```
┌─────────────────────────────────────────────────────────────┐
│                    ESCENARIO A: DONACIÓN                    │
├─────────────────────────────────────────────────────────────┤
│ • El premio es 100% aportado por el usuario                 │
│ • El usuario NO recibe dinero por el premio                 │
│ • La donación va a la causa seleccionada                    │
│ • El usuario entrega el premio al ganador                   │
└─────────────────────────────────────────────────────────────┘
```

👉 **Este es el escenario más simple.**

### Escenario B – El usuario NO dona el premio y quiere recibir su valor

Este escenario **SÍ está permitido**, pero con **reglas estrictas antifraude**.

#### Flujo explicado fácil:

```
┌────────────────────────────────────────────────────────────────────────┐
│              ESCENARIO B: PREMIO CON VALOR A RECIBIR                   │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. El sorteo se ejecuta                                               │
│           ↓                                                            │
│  2. Hay un ganador                                                     │
│           ↓                                                            │
│  3. El usuario entrega el premio al ganador                            │
│           ↓                                                            │
│  4. ANTES de recibir dinero, el usuario debe:                          │
│     • Subir evidencia de entrega (fotos)                               │
│     • Proporcionar datos verificables del ganador (ej. teléfono)       │
│           ↓                                                            │
│  5. La plataforma:                                                     │
│     • Contacta o verifica al ganador                                   │
│     • Confirma que el premio fue entregado                             │
│           ↓                                                            │
│  6. SOLO entonces:                                                     │
│     • La plataforma libera el dinero correspondiente al valor          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Reglas inquebrantables:

👉 **Nunca se libera dinero sin evidencia.**  
👉 **Nunca se paga antes de la entrega.**

#### Esto protege a:

- ✅ La plataforma
- ✅ Al ganador
- ✅ A la causa

---

## 5. Modelo antifraude (explicado con peras y manzanas)

### Para evitar fraudes:

| Medida | Descripción |
|--------|-------------|
| **Términos específicos** | El usuario acepta términos específicos del sorteo |
| **Reconocimiento de consecuencias** | Si no entrega el premio, puede ser bloqueado |
| **Verificación adicional** | Premios de alto valor pueden requerir verificación adicional |
| **Evidencias obligatorias** | Fotos de entrega, contacto del ganador, confirmación cruzada |

### Regla de oro antifraude:

```
┌─────────────────────────────────────────┐
│                                         │
│   SIN EVIDENCIA = SIN DINERO           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 6. Qué SÍ puede hacer el usuario respecto a las CAUSAS SOCIALES

### 6.1 Seleccionar una causa de la plataforma

- ✅ Estas causas **ya están verificadas**.
- ✅ Están organizadas por nichos.

#### Nichos de causas disponibles:

| Nicho | Ejemplos |
|-------|----------|
| **Animales** | Refugios, protectoras, santuarios |
| **Medio ambiente** | Reforestación, océanos, conservación |
| **Salud** | Investigación, hospitales, tratamientos |
| **Educación** | Becas, escuelas, materiales |
| **Humanitarias** | Refugiados, hambre, vivienda |
| **Comunidad** | Proyectos locales, barrios |

👉 El usuario puede elegirlas **libremente**.

### 6.2 Crear una causa propia

Esto **SÍ está permitido**, pero con **validación obligatoria**.

#### Flujo explicado simple:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    CREACIÓN DE CAUSA PROPIA                            │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  1. El usuario propone una causa                                       │
│           ↓                                                            │
│  2. Debe acreditar su existencia:                                      │
│     • Documentos                                                       │
│     • Información verificable                                          │
│     • O vinculación con una fundación real                             │
│           ↓                                                            │
│  3. La plataforma valida                                               │
│           ↓                                                            │
│  4. SOLO después:                                                      │
│     • Se libera el dinero                                              │
│     • La causa puede recibir donaciones                                │
│           ↓                                                            │
│  5. Una vez validada:                                                  │
│     • La causa puede entrar al catálogo general                        │
│     • Otros usuarios pueden seleccionarla                              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Regla inquebrantable:

👉 **No se libera dinero a causas no verificadas.**

---

## 7. Regla de causa social obligatoria (sin excepción)

### Si el usuario:

- ❌ No elige causa
- ❌ No crea una
- ❌ O no sabe cuál usar

### Entonces:

👉 **La plataforma asigna una causa base por defecto.**

### Esto garantiza:

| Garantía | Descripción |
|----------|-------------|
| **Impacto social real** | Siempre hay una causa beneficiada |
| **Recibos de donación válidos** | Documentación fiscal correcta |
| **Coherencia del producto** | La plataforma mantiene su identidad |

---

## 8. Sobre el dinero de las donaciones (muy importante)

### Reglas del dinero:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     REGLAS DE LIBERACIÓN DE DINERO                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ❌ El dinero NO se libera automáticamente                              │
│                                                                         │
│  ✅ El dinero se libera:                                                │
│     • Solo cuando la causa está verificada                              │
│     • Y cuando el premio fue entregado (si aplica)                      │
│                                                                         │
│  🔒 La plataforma actúa como:                                           │
│     • Verificador                                                       │
│     • Intermediario                                                     │
│     • Garante del proceso                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Qué NO se debe implementar (repetición intencional)

### La plataforma NO debe implementar:

| ❌ NO IMPLEMENTAR | Razón |
|-------------------|-------|
| Checkout de productos | Esto NO es ecommerce |
| Carrito | Esto NO es ecommerce |
| Venta | Esto NO es ecommerce |
| Facturación por productos | Esto NO es ecommerce |
| Stock | Esto NO es ecommerce |
| Envíos como ecommerce | Esto NO es ecommerce |
| "Compra y dona %" | Esto NO es ecommerce |
| Donación a cambio de producto fuera de sorteos | Esto NO es ecommerce |

### Regla de detección:

👉 **Si algo parece venta → NO va aquí.**

---

## 10. Regla de oro para el programador IA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                        REGLA DE ORO                                     │
│                                                                         │
│         • No asumas.                                                    │
│         • No anticipes.                                                 │
│         • No prepares "por si luego".                                   │
│                                                                         │
│         Si algo no está descrito:                                       │
│         • NO lo codifiques.                                             │
│         • Pregunta antes.                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Checklist antes de escribir código

### Antes de implementar cualquier cosa, pregúntate:

| # | Pregunta | Respuesta esperada |
|---|----------|-------------------|
| 1 | ¿Esto gira alrededor de un sorteo? | ✅ SÍ |
| 2 | ¿Esto NO es una venta? | ✅ SÍ (NO es venta) |
| 3 | ¿Esto protege contra fraude? | ✅ SÍ |
| 4 | ¿Esto exige evidencia antes de liberar dinero? | ✅ SÍ |
| 5 | ¿Esto respeta causa social obligatoria? | ✅ SÍ |

### Si alguna respuesta es NO → detente.

---

## 12. Modelo de Datos Específico del Documento 32

### Tabla: `prizes` (actualización)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| creator_id | UUID | FK al usuario que crea el premio |
| source | enum | 'platform', 'user' |
| name | varchar | Nombre del premio |
| description | text | Descripción detallada |
| estimated_value | decimal | Valor estimado (referencia) |
| condition | enum | 'new', 'used' |
| delivered_by | enum | 'user', 'platform' |
| delivery_conditions | text | Condiciones de entrega |
| is_donated | boolean | Si el premio es donado (sin compensación) |
| category_id | UUID | FK a categoría de premios |
| status | enum | 'draft', 'pending_review', 'approved', 'rejected', 'in_sweepstake', 'delivered', 'verified' |
| images | jsonb | Array de URLs de imágenes |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `prize_categories`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| name | varchar | Nombre de categoría |
| slug | varchar | Slug para URL |
| target_audience | enum | 'women', 'men', 'tech', 'home', 'experiences', 'general' |
| icon | varchar | Icono de la categoría |
| is_active | boolean | Si está activa |
| sort_order | integer | Orden de visualización |
| created_at | datetime | Auto |

### Tabla: `prize_deliveries`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sweepstake_id | UUID | FK al sorteo |
| prize_id | UUID | FK al premio |
| winner_id | UUID | FK al ganador |
| prize_owner_id | UUID | FK al dueño del premio |
| delivery_status | enum | 'pending', 'evidence_submitted', 'under_review', 'verified', 'disputed', 'completed' |
| evidence_images | jsonb | Fotos de evidencia de entrega |
| winner_contact_info | jsonb | Datos de contacto del ganador (verificación) |
| verification_notes | text | Notas de verificación |
| verified_by | UUID | FK al admin que verificó |
| verified_at | datetime | Fecha de verificación |
| money_released | boolean | Si se liberó el dinero |
| money_released_at | datetime | Fecha de liberación |
| money_amount | decimal | Monto liberado |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `cause_verifications`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| cause_id | UUID | FK a la causa |
| submitted_by | UUID | FK al usuario que propuso |
| verification_status | enum | 'pending', 'under_review', 'approved', 'rejected' |
| documents | jsonb | Documentos subidos |
| external_links | jsonb | Enlaces verificables |
| foundation_name | varchar | Nombre de fundación (si aplica) |
| foundation_id | varchar | ID fiscal de fundación |
| reviewer_id | UUID | FK al admin revisor |
| reviewer_notes | text | Notas del revisor |
| reviewed_at | datetime | Fecha de revisión |
| rejection_reason | text | Razón de rechazo (si aplica) |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `default_cause_assignments`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sweepstake_id | UUID | FK al sorteo |
| original_cause_id | UUID | Causa original (null si nunca tuvo) |
| assigned_cause_id | UUID | Causa asignada por defecto |
| assignment_reason | enum | 'user_did_not_select', 'cause_rejected', 'cause_inactive' |
| assigned_at | datetime | Fecha de asignación |

---

## 13. API Endpoints Específicos

### Premios

```
GET    /prizes/catalog                      # Catálogo de premios de plataforma
GET    /prizes/catalog/:category            # Premios por categoría
GET    /prizes/categories                   # Lista de categorías
POST   /prizes/user                         # Usuario sube su premio
PUT    /prizes/user/:id                     # Usuario actualiza su premio
GET    /prizes/user/my                      # Mis premios subidos
```

### Entregas de Premios

```
POST   /prize-deliveries/:id/evidence       # Subir evidencia de entrega
GET    /prize-deliveries/:id/status         # Estado de entrega
POST   /admin/prize-deliveries/:id/verify   # Admin verifica entrega
POST   /admin/prize-deliveries/:id/dispute  # Admin marca disputa
POST   /admin/prize-deliveries/:id/release-money # Admin libera dinero
```

### Verificación de Causas

```
POST   /causes/propose                      # Proponer causa propia
POST   /causes/:id/verification-docs        # Subir documentos de verificación
GET    /causes/:id/verification-status      # Estado de verificación
POST   /admin/causes/:id/verify             # Admin verifica causa
POST   /admin/causes/:id/reject             # Admin rechaza causa
GET    /admin/causes/pending-verification   # Causas pendientes de verificación
```

---

## 14. Flujos de Estado

### Estado del Premio

```
draft → pending_review → approved → in_sweepstake → delivered → verified
                      ↘ rejected
```

### Estado de Entrega

```
pending → evidence_submitted → under_review → verified → completed
                                           ↘ disputed
```

### Estado de Verificación de Causa

```
pending → under_review → approved
                      ↘ rejected
```

---

## 15. Reglas de Negocio Implementables

### 15.1 Liberación de dinero por premio NO donado

```typescript
async function releasePrizeMoney(deliveryId: string): Promise<void> {
  const delivery = await getDelivery(deliveryId);
  
  // Verificaciones obligatorias
  if (!delivery.evidence_images || delivery.evidence_images.length === 0) {
    throw new BusinessError('NO_EVIDENCE_SUBMITTED');
  }
  
  if (delivery.delivery_status !== 'verified') {
    throw new BusinessError('DELIVERY_NOT_VERIFIED');
  }
  
  if (delivery.money_released) {
    throw new BusinessError('MONEY_ALREADY_RELEASED');
  }
  
  const prize = await getPrize(delivery.prize_id);
  
  if (prize.is_donated) {
    throw new BusinessError('DONATED_PRIZE_NO_MONEY');
  }
  
  // Liberar dinero
  await transferMoney(delivery.prize_owner_id, prize.estimated_value);
  
  // Actualizar registro
  await updateDelivery(deliveryId, {
    money_released: true,
    money_released_at: new Date(),
    money_amount: prize.estimated_value,
    delivery_status: 'completed'
  });
  
  // Auditoría
  await auditLog('PRIZE_MONEY_RELEASED', {
    deliveryId,
    prizeId: prize.id,
    amount: prize.estimated_value,
    ownerId: delivery.prize_owner_id
  });
}
```

### 15.2 Asignación de causa por defecto

```typescript
async function ensureCauseAssigned(sweepstakeId: string): Promise<string> {
  const sweepstake = await getSweepstake(sweepstakeId);
  
  if (sweepstake.cause_id) {
    const cause = await getCause(sweepstake.cause_id);
    
    // Verificar que la causa esté activa y verificada
    if (cause.status === 'approved' && cause.is_active) {
      return cause.id;
    }
  }
  
  // Asignar causa por defecto
  const defaultCause = await getDefaultCause();
  
  await createDefaultAssignment({
    sweepstake_id: sweepstakeId,
    original_cause_id: sweepstake.cause_id || null,
    assigned_cause_id: defaultCause.id,
    assignment_reason: sweepstake.cause_id ? 'cause_inactive' : 'user_did_not_select'
  });
  
  await updateSweepstake(sweepstakeId, { cause_id: defaultCause.id });
  
  return defaultCause.id;
}
```

---

## 16. Validaciones Obligatorias

### Al crear premio de usuario:

```typescript
const userPrizeSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  estimated_value: z.number().positive().max(100000),
  condition: z.enum(['new', 'used']),
  delivered_by: z.enum(['user', 'platform']),
  delivery_conditions: z.string().min(10).max(1000),
  is_donated: z.boolean(),
  images: z.array(z.string().url()).min(1).max(10)
});
```

### Al subir evidencia de entrega:

```typescript
const deliveryEvidenceSchema = z.object({
  images: z.array(z.string().url()).min(1).max(10),
  winner_phone: z.string().optional(),
  winner_email: z.string().email().optional(),
  delivery_date: z.date(),
  delivery_notes: z.string().max(500).optional()
}).refine(data => data.winner_phone || data.winner_email, {
  message: 'Se requiere al menos un dato de contacto del ganador'
});
```

---

## 17. Checklist de Implementación

- [ ] Catálogo de premios de plataforma implementado
- [ ] Sistema de carga de premios de usuario
- [ ] Flujo de entrega de premios con evidencia
- [ ] Sistema de verificación de causas propias
- [ ] Asignación automática de causa por defecto
- [ ] Liberación condicional de dinero (solo tras verificación)
- [ ] Panel admin para verificar entregas
- [ ] Panel admin para verificar causas
- [ ] Auditoría de todas las liberaciones de dinero
- [ ] Validaciones en todos los endpoints
- [ ] Tests para flujos críticos antifraude

---

## 18. Backups obligatorios

**Programador IA:**

Después de integrar este Documento 32:
- ✅ Backup local
- ✅ Backup remoto
- ✅ Registrar versión:

```
VERSION: DOCUMENTO_32_FINAL_COMPLETED
```

---

## 19. Cierre

Este **Documento 32 es la regla del juego**.

- ❌ No es sugerencia.
- ❌ No es idea.
- ✅ **Es norma.**

Si algo entra en conflicto con este documento:

👉 **Este documento gana.**

---

**VERSION: MODULE_0.A.23_DOCUMENT_32**  
**Fecha de creación: 14 de diciembre de 2025**
