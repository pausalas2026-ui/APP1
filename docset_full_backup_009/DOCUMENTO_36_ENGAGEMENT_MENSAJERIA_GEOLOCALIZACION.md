# DOCUMENTO 36 – MÓDULO 0.a.27

## ENGAGEMENT, INTERACCIÓN CONTINUA, MENSAJERÍA AUTOMÁTICA, GEOLOCALIZACIÓN DE DONATIVOS Y DINÁMICAS DE RETENCIÓN DE USUARIOS

**Documento estratégico + operativo**
**Documento clave para retención, recurrencia y crecimiento**
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento existe para responder una pregunta clave de negocio:

> **¿Cómo logramos que el usuario NO use la app una sola vez, sino que entre, regrese, interactúe y se motive constantemente?**

Sin esto:
- la app se usa solo cuando hay sorteo,
- el creador de la causa entra poco,
- el donante se olvida,
- el impacto se enfría.

👉 **Este documento convierte la app en una experiencia viva.**

---

## 2. Principio rector de engagement

> **Cada acción del usuario debe generar una reacción de la app.**

Si alguien:
- participa,
- dona,
- gana,
- crea una causa,

👉 **La app SIEMPRE responde con información, emoción y llamada a la acción.**

```
┌─────────────────────────────────────────────────────────────┐
│              CICLO DE ENGAGEMENT                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│    ACCIÓN           →        REACCIÓN          →   CTA      │
│    ───────                   ────────              ───      │
│    Participa        →        Confirmación      →   Dona     │
│    Dona             →        Agradecimiento    →   Comparte │
│    Gana             →        Celebración       →   Próximo  │
│    Crea causa       →        Bienvenida        →   Publica  │
│                                                             │
│    ❌ NUNCA: Acción sin reacción                            │
│    ❌ NUNCA: Reacción sin CTA                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tablero del CREADOR DE LA CAUSA – Métricas avanzadas

### 3.1 Métricas económicas básicas (ya existentes)

El creador ve:
- dinero acumulado,
- porcentaje de avance,
- meta vs actual.

### 3.2 NUEVO: Geolocalización de los donativos (muy importante)

El tablero del creador de la causa **DEBE mostrar visualmente:**
- desde qué países se generan donativos,
- desde qué regiones / ciudades (cuando sea posible),
- volumen por zona.

**Ejemplo visual:**
- Mapa del mundo
- Países iluminados según donaciones
- Contador tipo: **"Tu causa ha recibido apoyo desde 7 países"**

👉 **Esto genera orgullo, motivación y hábito de entrada.**

### Tabla: `donation_geolocations`

```sql
CREATE TABLE donation_geolocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencias
    donation_id UUID NOT NULL REFERENCES donations(id),
    cause_id UUID NOT NULL REFERENCES causes(id),
    user_id UUID REFERENCES users(id),
    
    -- Geolocalización
    country_code CHAR(2) NOT NULL,
    country_name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Monto (para agregaciones)
    amount DECIMAL(10, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Índices implícitos por FK
    CONSTRAINT fk_donation FOREIGN KEY (donation_id) REFERENCES donations(id)
);

-- Índices para agregaciones rápidas
CREATE INDEX idx_geo_cause ON donation_geolocations(cause_id);
CREATE INDEX idx_geo_country ON donation_geolocations(country_code);
CREATE INDEX idx_geo_cause_country ON donation_geolocations(cause_id, country_code);
```

### Vista: `cause_geo_summary`

```sql
CREATE VIEW cause_geo_summary AS
SELECT 
    cause_id,
    country_code,
    country_name,
    COUNT(*) as donation_count,
    SUM(amount) as total_amount,
    COUNT(DISTINCT user_id) as unique_donors
FROM donation_geolocations
GROUP BY cause_id, country_code, country_name;
```

### API Endpoint: Geodatos de causa

```typescript
// GET /api/causes/:causeId/geo-stats
interface CauseGeoStats {
  causeId: string;
  totalCountries: number;
  totalCities: number;
  countries: {
    code: string;
    name: string;
    donationCount: number;
    totalAmount: number;
    uniqueDonors: number;
    topCities?: string[];
  }[];
  recentLocations: {
    city: string;
    country: string;
    timestamp: Date;
  }[];
}
```

---

## 4. Mensajería AUTOMÁTICA al PARTICIPAR en un sorteo

### Regla obligatoria

> **Toda participación genera un mensaje de confirmación inmediato.**

### Contenido mínimo del mensaje:

| Campo | Descripción |
|-------|-------------|
| Confirmación | Inscripción exitosa |
| Boletos | Número de boletos asignados |
| Sorteo | Nombre del sorteo |
| Fecha | Fecha del sorteo |

### 4.1 Call to action obligatorio dentro del mensaje

Ese mensaje **SIEMPRE** debe incluir opción para:
- donar para obtener más boletos,
- participar en otros sorteos activos.

### Ejemplo de mensaje:

```
┌─────────────────────────────────────────────────────────────┐
│  🎉 ¡Ya estás participando!                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sorteo: iPhone 15 Pro                                      │
│  Boletos: 3 🎫                                              │
│  Fecha: 20 de diciembre 2025                                │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ¿Quieres más boletos?                                      │
│                                                             │
│  [💙 Dona a la causa]     [🎯 Ver otros sorteos]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 👉 **Nunca enviar mensajes solo informativos.**

---

## 5. Mensajería AUTOMÁTICA al DONAR (muy importante emocionalmente)

### Regla clave

> **Toda donación debe recibir un mensaje cálido y humano.**

### Contenido del mensaje de donación:

| Campo | Descripción |
|-------|-------------|
| Agradecimiento | Explícito y cálido |
| Impacto | Lo que genera la donación |
| Vínculo | Conexión emocional con la causa |

### Ejemplo de mensaje:

```
┌─────────────────────────────────────────────────────────────┐
│  💙 Gracias por tu donación                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Tu apoyo de €10 está ayudando a:                           │
│  "Construir un pozo de agua en Kenia"                       │
│                                                             │
│  Con tu donación, la causa ahora está al 67% de su meta.    │
│                                                             │
│  Te mantendremos informado de los avances. 🌍               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [📢 Compartir]     [👀 Ver más causas]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 👉 **Esto convierte al donante en seguidor.**

---

## 6. Actualizaciones periódicas del estado de la causa

### 6.1 Mensajes de avance (automatizados)

De forma periódica (configurable):
- avances de recaudación,
- hitos alcanzados,
- nuevos países apoyando.

**Ejemplo:**
```
"Tu causa ya alcanzó el 45% de su objetivo.
Gracias por ser parte."
```

### Hitos automáticos que disparan mensajes:

| Hito | Mensaje tipo |
|------|--------------|
| 25% alcanzado | "¡Un cuarto del camino!" |
| 50% alcanzado | "¡Mitad del objetivo!" |
| 75% alcanzado | "¡Ya casi lo logramos!" |
| 100% alcanzado | "¡META CUMPLIDA! 🎉" |
| Nuevo país | "Apoyo desde [país]" |
| 10 donantes | "10 personas ya apoyan" |
| 50 donantes | "50 corazones unidos" |
| 100 donantes | "¡100 héroes!" |

### 6.2 Noticias de la causa (contenido humano)

El creador de la causa tendrá un **módulo para crear "estados" o noticias**.

Estos estados sirven para:
- alimentar mensajes automáticos,
- mantener viva la narrativa,
- mostrar progreso real.

---

## 7. Módulo del CREADOR DE LA CAUSA – Estados y noticias

### El creador de la causa puede:

- ✅ Crear actualizaciones (texto, imagen, video)
- ✅ Marcar avances
- ✅ Compartir logros
- ✅ Agradecer públicamente

### El sistema usa estos estados para:

- Enviar mensajes automáticos
- Mostrar en el tablero
- Reforzar engagement

> 👉 **El creador se vuelve generador de contenido sin darse cuenta.**

### Tabla: `cause_updates`

```sql
CREATE TABLE cause_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Referencias
    cause_id UUID NOT NULL REFERENCES causes(id),
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Contenido
    update_type VARCHAR(50) NOT NULL DEFAULT 'NEWS',
    title VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Media (opcional)
    image_url VARCHAR(500),
    video_url VARCHAR(500),
    
    -- Visibilidad
    is_public BOOLEAN DEFAULT TRUE,
    is_pinned BOOLEAN DEFAULT FALSE,
    
    -- Notificaciones
    notify_donors BOOLEAN DEFAULT TRUE,
    notify_participants BOOLEAN DEFAULT TRUE,
    notification_sent_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

-- Tipos de actualización
-- NEWS: Noticia general
-- MILESTONE: Hito alcanzado
-- THANKS: Agradecimiento
-- PROGRESS: Avance de obra/proyecto
-- MEDIA: Foto/video del progreso

CREATE INDEX idx_updates_cause ON cause_updates(cause_id);
CREATE INDEX idx_updates_type ON cause_updates(update_type);
CREATE INDEX idx_updates_public ON cause_updates(is_public) WHERE is_public = TRUE;
```

### API: Crear actualización de causa

```typescript
// POST /api/causes/:causeId/updates
interface CreateCauseUpdate {
  updateType: 'NEWS' | 'MILESTONE' | 'THANKS' | 'PROGRESS' | 'MEDIA';
  title?: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  notifyDonors?: boolean;
  notifyParticipants?: boolean;
}
```

---

## 8. Idioma de los mensajes (muy importante)

### Regla obligatoria

> **Los mensajes se envían en el idioma del receptor.**

### Cómo determinar idioma:

| Prioridad | Fuente |
|-----------|--------|
| 1 | Preferencia del usuario (configuración) |
| 2 | Idioma del navegador/app |
| 3 | Geolocalización |
| 4 | Idioma por defecto del sistema |

> 👉 **Nunca enviar mensajes genéricos en un solo idioma.**

### Tabla: `message_templates`

```sql
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    template_key VARCHAR(100) NOT NULL,
    language_code CHAR(2) NOT NULL,
    
    -- Contenido
    subject VARCHAR(255),
    body TEXT NOT NULL,
    cta_text VARCHAR(100),
    cta_url VARCHAR(500),
    
    -- Canales
    channel VARCHAR(50) NOT NULL, -- push, email, internal, sms
    
    -- Variables disponibles
    variables JSONB, -- Lista de variables que acepta
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique por template + idioma + canal
    UNIQUE(template_key, language_code, channel)
);

-- Ejemplos de template_key:
-- PARTICIPATION_CONFIRMED
-- DONATION_THANKS
-- CAUSE_MILESTONE_25
-- CAUSE_MILESTONE_50
-- WINNER_NOTIFICATION
-- CAUSE_UPDATE_NEWS
```

### Ejemplo de templates multi-idioma:

```sql
-- Español
INSERT INTO message_templates (template_key, language_code, channel, subject, body, cta_text) VALUES
('PARTICIPATION_CONFIRMED', 'ES', 'push', 
 '🎉 ¡Ya estás participando!',
 'Tienes {{ticket_count}} boletos para {{raffle_name}}. Sorteo: {{raffle_date}}',
 'Ver sorteo');

-- Inglés
INSERT INTO message_templates (template_key, language_code, channel, subject, body, cta_text) VALUES
('PARTICIPATION_CONFIRMED', 'EN', 'push',
 '🎉 You are in!',
 'You have {{ticket_count}} tickets for {{raffle_name}}. Draw: {{raffle_date}}',
 'View raffle');

-- Francés
INSERT INTO message_templates (template_key, language_code, channel, subject, body, cta_text) VALUES
('PARTICIPATION_CONFIRMED', 'FR', 'push',
 '🎉 Vous participez!',
 'Vous avez {{ticket_count}} billets pour {{raffle_name}}. Tirage: {{raffle_date}}',
 'Voir le tirage');
```

---

## 9. Canales de mensajería (arquitectura abierta)

La app debe estar preparada para enviar mensajes vía:

| Canal | Estado | Prioridad |
|-------|--------|-----------|
| Notificaciones push | ✅ MVP | Alta |
| Email | ✅ MVP | Alta |
| Mensajes internos | ✅ MVP | Media |
| WhatsApp | 🔮 Futuro | Media |
| SMS | 🔮 Futuro | Baja |

> 👉 **No acoplar la lógica a un solo canal.**

### Arquitectura de mensajería:

```
┌─────────────────────────────────────────────────────────────┐
│                   MOTOR DE MENSAJERÍA                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   EVENTO    │───▶│  PROCESADOR  │───▶│  DISPATCHER   │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│                            │                    │           │
│                            ▼                    ▼           │
│                     ┌──────────────┐    ┌───────────────┐  │
│                     │  TEMPLATES   │    │   CANALES     │  │
│                     │  + IDIOMA    │    │               │  │
│                     └──────────────┘    │  ├─ Push      │  │
│                                         │  ├─ Email     │  │
│                                         │  ├─ Internal  │  │
│                                         │  ├─ WhatsApp  │  │
│                                         │  └─ SMS       │  │
│                                         └───────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Servicio de mensajería:

```typescript
// messaging.service.ts

interface MessagePayload {
  userId: string;
  templateKey: string;
  variables: Record<string, string>;
  channels?: ('push' | 'email' | 'internal')[];
  priority?: 'high' | 'normal' | 'low';
}

@Injectable()
export class MessagingService {
  
  async sendMessage(payload: MessagePayload): Promise<void> {
    // 1. Obtener preferencias del usuario
    const user = await this.getUser(payload.userId);
    const language = user.preferredLanguage || this.detectLanguage(user);
    const channels = payload.channels || user.notificationChannels || ['internal'];
    
    // 2. Obtener template en el idioma correcto
    for (const channel of channels) {
      const template = await this.getTemplate(
        payload.templateKey, 
        language, 
        channel
      );
      
      if (!template) {
        // Fallback a idioma por defecto
        template = await this.getTemplate(payload.templateKey, 'ES', channel);
      }
      
      // 3. Renderizar mensaje
      const rendered = this.renderTemplate(template, payload.variables);
      
      // 4. Enviar por el canal correspondiente
      await this.dispatch(channel, user, rendered);
    }
    
    // 5. Registrar envío
    await this.logMessage(payload, channels);
  }
  
  private async dispatch(
    channel: string, 
    user: User, 
    message: RenderedMessage
  ): Promise<void> {
    switch (channel) {
      case 'push':
        await this.pushService.send(user.pushToken, message);
        break;
      case 'email':
        await this.emailService.send(user.email, message);
        break;
      case 'internal':
        await this.internalService.create(user.id, message);
        break;
      // Futuros canales...
    }
  }
}
```

---

## 10. Reglas de frecuencia (no saturar)

| Tipo de mensaje | Frecuencia | Inmediato |
|-----------------|------------|-----------|
| Confirmaciones | Siempre | ✅ Sí |
| Agradecimientos | Siempre | ✅ Sí |
| Avances automáticos | Por hito | ❌ No |
| Noticias del creador | Cuando publique | ❌ No |
| Recordatorios de sorteo | 24h y 1h antes | ❌ No |

> 👉 **Engagement ≠ spam.**

### Límites de frecuencia:

```typescript
const FREQUENCY_LIMITS = {
  // Máximo mensajes por día por usuario
  maxPerDay: 5,
  
  // Mínimo tiempo entre mensajes no urgentes
  minGapMinutes: 60,
  
  // Horario permitido (hora local del usuario)
  allowedHours: { start: 9, end: 21 },
  
  // Excepciones (siempre se envían)
  immediateAlways: [
    'PARTICIPATION_CONFIRMED',
    'DONATION_THANKS',
    'WINNER_NOTIFICATION',
    'PRIZE_CLAIM_APPROVED'
  ]
};
```

---

## 11. Qué NO hacer (errores graves)

| ❌ Error | Consecuencia |
|----------|--------------|
| Enviar mensajes sin valor | Usuario desactiva notificaciones |
| Repetir siempre el mismo texto | Fatiga, ignorado |
| Ignorar idioma o país | Desconexión, frustración |
| Enviar mensajes sin CTA | Oportunidad perdida |
| Saturar con notificaciones | Desinstalación |
| Enviar a horas inadecuadas | Molestia |
| No personalizar | Mensaje genérico = ignorado |

---

## 12. Eventos que disparan mensajes

### Matriz de eventos → mensajes:

| Evento | Template | Canales | Inmediato |
|--------|----------|---------|-----------|
| Participación en sorteo | `PARTICIPATION_CONFIRMED` | push, internal | ✅ |
| Donación realizada | `DONATION_THANKS` | push, email, internal | ✅ |
| Ganador de sorteo | `WINNER_NOTIFICATION` | push, email, internal | ✅ |
| Causa alcanza 25% | `CAUSE_MILESTONE_25` | push, internal | ❌ |
| Causa alcanza 50% | `CAUSE_MILESTONE_50` | push, internal | ❌ |
| Causa alcanza 75% | `CAUSE_MILESTONE_75` | push, internal | ❌ |
| Causa completa | `CAUSE_COMPLETED` | push, email, internal | ✅ |
| Nueva actualización de causa | `CAUSE_UPDATE_NEWS` | push, internal | ❌ |
| Sorteo próximo (24h) | `RAFFLE_REMINDER_24H` | push | ❌ |
| Sorteo próximo (1h) | `RAFFLE_REMINDER_1H` | push | ❌ |
| Premio aprobado | `PRIZE_CLAIM_APPROVED` | push, email | ✅ |
| KYC aprobado | `KYC_APPROVED` | push, email | ✅ |
| Dinero liberado | `MONEY_RELEASED` | push, email | ✅ |

---

## 13. Tabla de mensajes internos

```sql
CREATE TABLE internal_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Destinatario
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Contenido
    template_key VARCHAR(100),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    cta_text VARCHAR(100),
    cta_url VARCHAR(500),
    
    -- Referencias opcionales
    reference_type VARCHAR(50), -- cause, raffle, donation, etc.
    reference_id UUID,
    
    -- Estado
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_internal_user ON internal_messages(user_id);
CREATE INDEX idx_internal_unread ON internal_messages(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_internal_created ON internal_messages(created_at DESC);
```

---

## 14. Checklist para el programador IA

### Antes de implementar mensajería y engagement:

| ✅ | Requisito |
|----|-----------|
| ☐ | Mensaje por participación |
| ☐ | Mensaje por donación |
| ☐ | CTA incluido siempre |
| ☐ | Geolocalización visible en tablero |
| ☐ | Idioma correcto del receptor |
| ☐ | Módulo de estados de causa |
| ☐ | Sistema de canales reutilizable |
| ☐ | Templates multi-idioma |
| ☐ | Límites de frecuencia |
| ☐ | Horarios respetados |

---

## 15. RECORDATORIO DE RESPALDO (CHECKPOINT DE ENGAGEMENT)

### IA del programador:

**Antes de implementar este módulo:**

1. ✅ Realiza respaldo completo del proyecto.
2. ✅ Guarda estado actual.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_36_ENGAGEMENT
VERSION: docset_full_backup_009
```

---

## 16. Resumen ejecutivo

### Pilares del engagement:

| # | Pilar | Descripción |
|---|-------|-------------|
| 1 | **Reacción** | Toda acción genera respuesta |
| 2 | **Emoción** | Mensajes cálidos y humanos |
| 3 | **CTA** | Siempre hay siguiente paso |
| 4 | **Personalización** | Idioma + nombre + contexto |
| 5 | **Geografía** | Mapa de impacto visible |

### Reglas de oro:

1. **Acción → Reacción → CTA** (ciclo completo)
2. **Idioma del receptor** (nunca genérico)
3. **Engagement ≠ Spam** (frecuencia controlada)
4. **Geografía genera orgullo** (mapa de donaciones)
5. **Creador = Generador de contenido** (módulo de estados)

---

## 17. Cierre

Este módulo es el que transforma:

> **Una app funcional** → **Una app viva y adictiva (en el buen sentido)**

👉 **Sin engagement no hay recurrencia.**
👉 **Sin recurrencia no hay crecimiento.**

---

```
=========================================================
FIN DEL DOCUMENTO 36
MÓDULO 0.a.27 — ENGAGEMENT Y MENSAJERÍA AUTOMÁTICA
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
