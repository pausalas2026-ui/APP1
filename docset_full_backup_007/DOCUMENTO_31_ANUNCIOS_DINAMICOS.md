# DOCUMENTO 31 – MÓDULO 0.a.22
# SISTEMA DE ANUNCIOS DINÁMICOS EN EL TABLERO PRINCIPAL DEL USUARIO
## (PROMOTOR / DONANTE / GENERADOR)

---

## Entregable técnico normativo para la IA del Programador

---

## 1. Propósito del Módulo

El objetivo de este módulo es definir toda la arquitectura, reglas, lógica, algoritmos, modelos de datos, API endpoints, validaciones y flujos del **sistema de anuncios dinámicos** dentro del tablero principal del usuario.

Los anuncios dinámicos son elementos visuales que aparecen en el dashboard del usuario para:

- Promover campañas de recaudación
- Promover causas personales o institucionales
- Promover sorteos activos
- Promover actualizaciones de plan (free → pro → premium → elite)
- Promover retos, misiones o elementos de gamificación
- Promover oportunidades donde el usuario puede ganar dinero o generar impacto social

### Estos anuncios NO son banners tradicionales

Son piezas **altamente personalizadas** diseñadas con lógica psicológica, en función de:

- Preferencias explícitas (Documento 30)
- Comportamiento histórico
- Objetivos del usuario
- Plan contratado
- Urgencia de campaña
- Potencial económico
- Rendimiento pasado
- Naturaleza del rol (promotor, donante, generador, híbrido)

---

## 2. Elementos Centrales del Sistema de Anuncios Dinámicos

El sistema consta de:

| Componente | Descripción |
|------------|-------------|
| `AdEngineService` | Motor principal del sistema de anuncios |
| `AdRecommendationEngine` | IA logística que determina qué anuncio ve cada usuario |
| `AdSlots` | Espacios donde los anuncios pueden aparecer en el dashboard |
| `AdTemplates` | Plantillas visuales preconfiguradas |
| `AdCampaigns` | Conjunto de anuncios configurados por la plataforma o fundaciones asociadas |
| `Economic Model Integration Layer` | Capa que calcula impacto económico futuro estimado |
| `Tracking Layer` | Sistema de seguimiento completo (clics, impresiones, conversiones) |
| `AdScheduler` | Determina cuándo un anuncio debe mostrarse, pausarse o caducar |

---

## 3. Tipos de Anuncios

El sistema debe soportar, como mínimo, **cinco categorías**:

### 3.1. Anuncios de Causas Activas
Promueven campañas que necesitan donaciones urgentes.

### 3.2. Anuncios de Sorteos Activos (Documento 29)
Integración directa con:
- URLs firmadas
- Trazabilidad promotor-causa
- Potencial económico

### 3.3. Anuncios de Actualización de Plan
Sistema inteligente que muestra exactamente:
- Cuánto dinero perdió el usuario por estar en plan gratuito
- Cuánto ganaría si fuera pro, premium o elite
- Comparativas en tiempo real
- **Multiplicadores:** Free (5%), Pro (30%), Premium (70%), Elite (100%)

### 3.4. Anuncios para Mejorar el Rendimiento del Promotor
Ejemplos:
- "Comparte esta campaña para aumentar tu conversión."
- "Tus seguidores interactúan más con campañas de salud. Recomendada: …"

### 3.5. Anuncios de Misiones o Retos Gamificados
Este tipo aumenta retención y viralidad.

---

## 4. Arquitectura Técnica del Sistema de Anuncios

### 4.1. Ad Engine Pipeline

El pipeline completo para decidir qué anuncio mostrar es:

#### Paso 1: Cargar información del usuario
- Preferencias explícitas (Documento 30)
- Preferencias implícitas (behavior insights)
- Plan actual
- Historial de comportamiento
- Conversiones
- Tasa de clics
- Campañas previamente promovidas

#### Paso 2: Cargar campañas disponibles
- Campañas activas
- Causas urgentes
- Sorteos activos
- Retos o misiones
- Ofertas de upgrade de plan

#### Paso 3: Calcular puntuación por anuncio

```typescript
AdScore = 
    (ExplicitPreferenceWeight * UserGoalMatch) +
    (ImplicitBehaviorWeight * BehaviorMatch) +
    (EconomicWeight * PotentialRevenue) +
    (UrgencyWeight * CampaignUrgency) +
    (PlanWeight * UpgradeOpportunity) +
    (RelevanceWeight * CategoryMatch)
```

#### Paso 4: Filtrado
- Eliminar anuncios ya mostrados demasiadas veces
- Eliminar anuncios que no cumplen con requisitos de plan
- Priorizar anuncios con potencial económico mayor

#### Paso 5: Selección
El anuncio con mayor `AdScore` se muestra en el primer slot.

#### Paso 6: Logging / Tracking
Registrar:
- Impresión
- Clic
- Conversión
- Tiempo en pantalla

---

## 5. Integración con el Modelo Económico

Este módulo se relaciona directamente con el **modelo de 4 actores**:

1. **Plataforma**
2. **Promotor**
3. **Generador de causa**
4. **Causa destino**

### Los anuncios deben optimizar:
- Ingreso para la plataforma
- Ingreso para el promotor
- Recaudación para la causa
- Oportunidades del generador

### En cada anuncio se debe calcular:
- Potencial de donación
- Potencial de red compartida
- Potencial de mejora de plan
- Potencial de engagement
- Beneficio económico para cada actor

### Distribución MLM (EXACTAMENTE 2 NIVELES)
- **N1 (Promotor directo)**: 70% de la comisión de promotor
- **N2 (Affiliator)**: 30% de la comisión de promotor
- **NO EXISTE NIVEL 3**

---

## 6. Base de Datos Completa

### Tabla: `ad_campaigns`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| title | varchar | Título del anuncio |
| description | text | Descripción completa |
| short_description | varchar | Descripción corta para preview |
| type | enum | 'cause', 'sweepstake', 'upgrade', 'mission', 'performance' |
| image_url | varchar | URL de la imagen principal |
| cta_text | varchar | Texto del call-to-action |
| cta_url | varchar | URL de destino |
| target_roles | jsonb | Roles objetivo: ['promoter', 'donor', 'generator'] |
| target_plans | jsonb | Planes objetivo: ['free', 'pro', 'premium', 'elite'] |
| target_goals | jsonb | Objetivos objetivo: ['attract', 'fundraise', 'earn'] |
| cause_id | UUID | FK a causa (si aplica) |
| sweepstake_id | UUID | FK a sorteo (si aplica) |
| start_date | datetime | Fecha de inicio |
| end_date | datetime | Fecha de fin |
| urgency_level | integer | Nivel de urgencia (1-10) |
| priority_weight | float | Peso base de prioridad |
| max_impressions_per_user | integer | Máximo de impresiones por usuario |
| max_impressions_total | integer | Máximo de impresiones totales |
| budget | decimal | Presupuesto (si aplica) |
| status | enum | 'draft', 'active', 'paused', 'completed', 'archived' |
| created_by | UUID | FK al admin que creó |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `ad_slots`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| slot_key | varchar | Clave única del slot |
| slot_name | varchar | Nombre display |
| position | enum | 'top', 'middle', 'bottom', 'sidebar', 'modal' |
| max_ads | integer | Máximo de anuncios en este slot |
| available_for_roles | jsonb | Roles que ven este slot |
| is_active | boolean | Si está activo |
| created_at | datetime | Auto |

### Tabla: `ad_templates`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| template_key | varchar | Clave única |
| template_name | varchar | Nombre |
| html_structure | text | Estructura HTML/JSX |
| css_classes | varchar | Clases CSS |
| supported_types | jsonb | Tipos de anuncios que soporta |
| is_active | boolean | Si está activo |
| created_at | datetime | Auto |

### Tabla: `ad_impressions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| ad_id | UUID | FK al anuncio |
| slot_id | UUID | FK al slot |
| shown_at | datetime | Timestamp de visualización |
| view_duration_ms | integer | Tiempo de visualización en ms |
| session_id | varchar | ID de sesión |
| device_type | varchar | Tipo de dispositivo |
| ip | varchar | IP del usuario |
| user_agent | varchar | User agent |

### Tabla: `ad_clicks`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| ad_id | UUID | FK al anuncio |
| impression_id | UUID | FK a la impresión |
| clicked_at | datetime | Timestamp del clic |
| destination_url | varchar | URL de destino |
| ip | varchar | IP del usuario |
| user_agent | varchar | User agent |

### Tabla: `ad_conversions`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| ad_id | UUID | FK al anuncio |
| click_id | UUID | FK al clic |
| conversion_type | enum | 'donation', 'signup', 'upgrade', 'share', 'sweepstake_entry' |
| conversion_value | decimal | Valor de la conversión |
| converted_at | datetime | Timestamp de conversión |
| metadata | jsonb | Datos adicionales |

### Tabla: `ad_performance`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| ad_id | UUID | FK al anuncio |
| date | date | Fecha del registro |
| impressions | integer | Total impresiones |
| clicks | integer | Total clics |
| conversions | integer | Total conversiones |
| ctr | float | Click-through rate |
| conversion_rate | float | Tasa de conversión |
| revenue_generated | decimal | Ingresos generados |
| updated_at | datetime | Auto |

### Tabla: `ad_user_fatigue`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| ad_id | UUID | FK al anuncio |
| impression_count | integer | Veces mostrado |
| last_shown_at | datetime | Última vez mostrado |
| is_dismissed | boolean | Si el usuario lo cerró |
| dismissed_at | datetime | Cuándo lo cerró |

---

## 7. API Endpoints

### Recomendación de Anuncios

```
GET    /ads/recommend                       # Devuelve el mejor anuncio para el usuario
GET    /ads/recommend/:slot                 # Anuncio para un slot específico
GET    /ads/recommend/multiple              # Múltiples anuncios ordenados
```

### Tracking

```
POST   /ads/impression                      # Registra visualización
POST   /ads/click                           # Registra clic
POST   /ads/conversion                      # Registra conversión
POST   /ads/dismiss                         # Usuario cierra anuncio
```

### Administración de Campañas

```
GET    /admin/ads/campaigns                 # Lista campañas
GET    /admin/ads/campaigns/:id             # Detalle de campaña
POST   /admin/ads/campaigns                 # Crear campaña
PUT    /admin/ads/campaigns/:id             # Actualizar campaña
DELETE /admin/ads/campaigns/:id             # Eliminar campaña
POST   /admin/ads/campaigns/:id/publish     # Publicar campaña
POST   /admin/ads/campaigns/:id/pause       # Pausar campaña
POST   /admin/ads/campaigns/:id/resume      # Reanudar campaña
```

### Reportes y Métricas

```
GET    /admin/ads/performance               # Performance general
GET    /admin/ads/performance/:id           # Performance de campaña específica
GET    /admin/ads/analytics                 # Analytics detallado
GET    /admin/ads/analytics/by-type         # Analytics por tipo de anuncio
GET    /admin/ads/analytics/by-role         # Analytics por rol de usuario
```

### Configuración

```
GET    /admin/ads/slots                     # Lista slots disponibles
POST   /admin/ads/slots                     # Crear slot
PUT    /admin/ads/slots/:id                 # Actualizar slot
GET    /admin/ads/templates                 # Lista templates
POST   /admin/ads/templates                 # Crear template
```

---

## 8. Reglas de Negocio

### 8.1. Prioridad de Anuncios
- Un anuncio de **campaña urgente** SIEMPRE tiene prioridad sobre otros
- Urgency level 10 = máxima prioridad

### 8.2. Anuncios de Upgrade
- Un usuario en plan gratuito debe ver anuncios de upgrade **al menos 1 vez por sesión**
- Mostrar comparativa real de lo que habría ganado con plan superior

### 8.3. Personalización para Promotores
- Un promotor debe ver anuncios alineados con causas que generan más conversiones
- Usar datos de `user_behavior_insights` para personalizar

### 8.4. Prevención de Fatiga
- **No se deben mostrar dos anuncios iguales consecutivos**
- Máximo de impresiones por usuario configurable por campaña
- El sistema debe evitar fatiga visual

### 8.5. Optimización por Rendimiento
- Si un anuncio supera el CTR histórico promedio, su peso aumenta
- Si un anuncio tiene CTR bajo después de 100 impresiones, su peso disminuye

### 8.6. Integración con Sorteos (Documento 29)
- Los anuncios de sorteos deben incluir URLs firmadas con HMAC
- Trazabilidad completa promoter_id → cause_id → sweepstake_id

---

## 9. Algoritmo de Scoring Detallado

```typescript
interface AdScoringParams {
  explicitPreferenceWeight: number;  // Default: 0.25
  implicitBehaviorWeight: number;    // Default: 0.20
  economicWeight: number;            // Default: 0.20
  urgencyWeight: number;             // Default: 0.15
  planWeight: number;                // Default: 0.10
  relevanceWeight: number;           // Default: 0.10
}

function calculateAdScore(
  ad: AdCampaign,
  user: User,
  preferences: UserPreferences,
  insights: UserBehaviorInsights,
  params: AdScoringParams
): number {
  const userGoalMatch = calculateGoalMatch(ad, preferences.primary_goal);
  const behaviorMatch = calculateBehaviorMatch(ad, insights);
  const potentialRevenue = calculatePotentialRevenue(ad, user.plan);
  const campaignUrgency = ad.urgency_level / 10;
  const upgradeOpportunity = calculateUpgradeOpportunity(ad, user.plan);
  const categoryMatch = calculateCategoryMatch(ad, preferences.selected_categories);

  return (
    params.explicitPreferenceWeight * userGoalMatch +
    params.implicitBehaviorWeight * behaviorMatch +
    params.economicWeight * potentialRevenue +
    params.urgencyWeight * campaignUrgency +
    params.planWeight * upgradeOpportunity +
    params.relevanceWeight * categoryMatch
  );
}
```

---

## 10. Estructura de Archivos

```
services/api/src/
  modules/
    ads/
      ads.module.ts
      ads.controller.ts
      ads.service.ts
      ad-engine.service.ts
      ad-recommendation.service.ts
      ad-scheduler.service.ts
      ad-tracking.service.ts
      ads.dto.ts
      
      controllers/
        ads-admin.controller.ts
        ads-public.controller.ts
        
      services/
        ad-scoring.service.ts
        ad-fatigue.service.ts
        ad-performance.service.ts

packages/core/src/
  ads/
    ad-engine.service.ts
    ad-scoring.service.ts
    ads.types.ts
    ad-constants.ts
```

---

## 11. Checklist para la IA del Programador

- [ ] Implementar `AdEngineService`
- [ ] Implementar `AdRecommendationEngine`
- [ ] Implementar `AdScheduler`
- [ ] Implementar `AdTrackingService`
- [ ] Implementar `AdScoringService`
- [ ] Implementar `AdFatigueService`
- [ ] Crear tabla `ad_campaigns`
- [ ] Crear tabla `ad_slots`
- [ ] Crear tabla `ad_templates`
- [ ] Crear tabla `ad_impressions`
- [ ] Crear tabla `ad_clicks`
- [ ] Crear tabla `ad_conversions`
- [ ] Crear tabla `ad_performance`
- [ ] Crear tabla `ad_user_fatigue`
- [ ] Crear endpoints de recomendación
- [ ] Crear endpoints de tracking
- [ ] Crear endpoints de administración
- [ ] Crear endpoints de reportes
- [ ] Integrar con preferencias del usuario (Documento 30)
- [ ] Integrar con comportamiento (insights)
- [ ] Integrar con modelo económico de 4 actores
- [ ] Integrar con sorteos (Documento 29)
- [ ] Integrar con campañas de causas
- [ ] Implementar lógica de upgrade de plan
- [ ] Implementar prevención de fatiga visual
- [ ] Implementar tracking completo
- [ ] Realizar backups después de cada submódulo

---

## 12. Recordatorio Obligatorio Interno

**IA del programador:**

Después de recibir este Documento 31:
- Haz backup local
- Haz backup remoto
- Registra:

```
VERSION: DOCUMENTO_31_COMPLETED
```

---

**VERSION: MODULE_0.A.22_DOCUMENT_31**
**Fecha de creación: 11 de diciembre de 2025**
