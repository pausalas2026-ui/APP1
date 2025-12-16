# DOCUMENTO 30 – MÓDULO 0.a.21
# SISTEMA DE PREFERENCIAS Y ORDENAMIENTO DEL TABLERO PRINCIPAL DEL USUARIO
## (PROMOTOR / DONANTE / GENERADOR)

---

## Entregable normativo oficial para la IA del programador
**(Con backups obligatorios, reglas completas y máxima granularidad)**

---

## 1. Propósito del Módulo

Este módulo define la arquitectura completa del **Sistema de Preferencias del Usuario**, responsable de personalizar el tablero principal de cada rol dentro de I Love to Help (promotor, donante, generador de causa).

Esto permite que el usuario vea, en primer lugar, lo que más le importa según la psicología del comportamiento, focalizando en:

- **Atraer clientes / seguidores**
- **Recaudar para una causa personal o ajena**
- **Ganar dinero con su gestión como promotor**

El tablero debe acomodarse automáticamente, siguiendo:
- Sus acciones previas
- Su rol
- Su comportamiento histórico
- Sus metas
- Sus preferencias explícitas
- Su estilo de participación
- Su plan contratado (free → pro → premium → elite)

### Este módulo es fundamental porque:
- Impacta la UX completa
- Influye en la toma de decisiones del usuario
- Dirige tráfico hacia causas, sorteos, campañas o productos
- Aumenta los ingresos de la plataforma y de los promotores

---

## 2. Componentes Principales del Módulo

El sistema consta de:

1. **Preferencias explícitas del usuario**
   - Configurables manualmente en su panel

2. **Preferencias implícitas aprendidas automáticamente**
   - Basadas en comportamiento

3. **Motor de ordenamiento del dashboard**
   - Algoritmo que decide qué módulos y elementos van arriba, en medio y abajo

4. **Reglas de prioridad basadas en el modelo económico de 4 actores**

5. **Integración con gamificación, anuncios dinámicos y campañas activas**

6. **Persistencia en base de datos + API para lectura/escritura**

7. **Sincronización con roles múltiples**
   - Un usuario puede ser donante, promotor y generador simultáneamente

---

## 3. Flujo Completo del Sistema para el Usuario

### 3.1. Al registrarse (promotor, donante o generador)

El sistema debe mostrar un **asistente de bienvenida estilo "Pinterest Onboarding"**, donde:

1. **Se le pregunta su objetivo principal:**
   - Atraer seguidores o clientes
   - Recaudar más dinero para una causa específica
   - Ganar dinero como promotor

2. **Se le pide seleccionar categorías:**
   - Tipos de campañas
   - Tipos de causas
   - Tipos de contenido que desea promover
   - Formatos preferidos
   - Plataformas donde promociona más

3. **Se genera una estructura inicial del tablero** basada en esas elecciones.

### 3.2. Durante el uso del sistema

El motor debe **aprender de:**
- Qué campañas comparte más
- Cuáles generan más clics
- Cuáles generan más donaciones
- Qué tipo de contenido ignora
- Qué módulos visita más
- Qué módulos nunca visita
- Cuánto tiempo dedica a cada sección
- En qué redes sociales tiene mejor rendimiento
- Su plan actual (free, pro, premium, elite)

Con esto, el tablero se **reordena progresivamente**.

---

## 4. Arquitectura Técnica del Sistema

### 4.1. Componentes técnicos obligatorios

| Componente | Descripción |
|------------|-------------|
| `PreferencesService` | Encargado de CRUD de preferencias |
| `DashboardOrderingService` | Implementa el algoritmo de ordenamiento |
| `PreferencesController` (API) | Endpoints para guardar y consultar preferencias |
| `DashboardController` (API) | Endpoints para entregar el tablero ya ordenado |
| Modelo `Preferences` | Preferencias explícitas |
| Modelo `BehaviorInsights` | Preferencias implícitas basadas en comportamiento |

### 4.2. Motor de Ordenamiento (Reglas Base)

El tablero debe ordenarse con una **puntuación final por módulo**:

```typescript
score = (pref_explicit_weight * user_explicit_priority)
      + (pref_implicit_weight * learned_behavior_score)
      + (economic_weight * revenue_potential_score)
      + (urgency_weight * active_campaign_urgency)
      + (plan_weight * user_plan_level)
```

#### Explicación pedagógica para el programador IA:

| Factor | Descripción |
|--------|-------------|
| `pref_explicit_weight` | Es lo que el usuario dijo que le interesa |
| `pref_implicit_weight` | Es lo que el sistema deduce por comportamiento |
| `revenue_potential_score` | Determina cuál módulo genera más ingresos para: plataforma, promotor, causa, generador |
| `active_campaign_urgency` | Ejemplo: si faltan 12 horas para que cierre una campaña, sube arriba |
| `user_plan_level` | El tablero debe empujar al usuario a aprovechar beneficios de planes superiores |

---

## 5. Base de Datos Completa (Tablas y Campos)

### Tabla: `user_preferences`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| primary_goal | enum | 'attract', 'fundraise', 'earn' |
| selected_categories | jsonb | Preferencias iniciales seleccionadas |
| preferred_cause_types | jsonb | Tipos de causas preferidas |
| preferred_campaign_types | jsonb | Tipos de campañas preferidas |
| preferred_platforms | jsonb | Plataformas donde promociona más |
| display_mode | enum | 'simple', 'advanced' |
| notification_preferences | jsonb | Preferencias de notificación |
| onboarding_completed | boolean | Si completó el onboarding |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `user_behavior_insights`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| most_shared_campaign_types | jsonb | Tipos de campaña más compartidos |
| most_successful_causes | jsonb | Causas con mejor rendimiento |
| ignored_sections | jsonb | Secciones que ignora |
| active_channels | jsonb | Canales más activos |
| share_success_rate | float | Tasa de éxito en compartidos |
| donation_conversion_rate | float | Tasa de conversión de donaciones |
| click_through_rate | float | CTR general |
| avg_session_duration | integer | Duración promedio de sesión (segundos) |
| most_visited_modules | jsonb | Módulos más visitados |
| least_visited_modules | jsonb | Módulos menos visitados |
| inferred_priority | enum | 'attract', 'fundraise', 'earn' (inferido) |
| last_activity_date | datetime | Última actividad |
| updated_at | datetime | Auto |

### Tabla: `dashboard_state`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| user_id | UUID | FK al usuario |
| role | enum | 'promoter', 'donor', 'generator' |
| ordered_widgets | jsonb | Widgets ordenados con posición y score |
| widget_visibility | jsonb | Qué widgets están visibles/ocultos |
| custom_layout | jsonb | Layout personalizado por el usuario |
| last_auto_update | datetime | Última actualización automática |
| last_manual_update | datetime | Última actualización manual |
| version | integer | Versión del estado |
| created_at | datetime | Auto |
| updated_at | datetime | Auto |

### Tabla: `dashboard_widgets`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| widget_key | varchar | Clave única del widget |
| widget_name | varchar | Nombre display |
| widget_type | enum | 'campaigns', 'sweepstakes', 'causes', 'earnings', 'impact', 'training', 'quick_actions' |
| default_position | integer | Posición por defecto |
| default_weight | float | Peso base para scoring |
| available_for_roles | jsonb | Roles que pueden ver este widget |
| available_for_plans | jsonb | Planes que pueden ver este widget |
| is_active | boolean | Si está activo en el sistema |
| created_at | datetime | Auto |

---

## 6. Algoritmo del Dashboard (Paso a Paso)

```typescript
// DashboardOrderingService.generateDashboard(userId, role)

1. Cargar preferencias explícitas del usuario
2. Cargar insights implícitos (comportamiento)
3. Cargar campañas activas relevantes
4. Cargar rendimiento histórico del usuario
5. Cargar reglas económicas según plan del usuario
6. Obtener lista de widgets disponibles para el rol

7. Para cada widget, calcular puntuación:
   - Campañas recomendadas
   - Sorteos activos
   - Causas personales
   - Causas seguidas
   - Contenido de entrenamiento
   - Accesos rápidos a promoción
   - Panel de ingresos
   - Panel de impacto social

8. Aplicar fórmula de scoring:
   score = (pref_explicit_weight * user_explicit_priority)
         + (pref_implicit_weight * learned_behavior_score)
         + (economic_weight * revenue_potential_score)
         + (urgency_weight * active_campaign_urgency)
         + (plan_weight * user_plan_level)

9. Ordenar widgets de mayor a menor puntuación

10. Guardar en dashboard_state

11. Retornar dashboard ordenado
```

**IMPORTANTE:** El programador solo tiene que seguir el orden de pasos, sin inventar ni eliminar nada.

---

## 7. Reglas de Negocio

### 7.1. Prioridad Principal

El tablero **SIEMPRE** debe mostrar arriba:
- Acceso rápido a la acción principal del usuario
- Ej: Si eligió "ganar dinero", arriba va "Promociona estas campañas"

### 7.2. Módulos Inactivos

Si el usuario no usa un módulo durante **30 días**:
- El módulo baja al fondo
- Se envía sugerencia de reactivación

### 7.3. Detección de Prioridad Real

El sistema detecta cuál prioridad real está emergiendo:

| Comportamiento | Prioridad Inferida |
|----------------|-------------------|
| Comparte campañas pero nunca dona | ganar dinero |
| Dona mucho pero no comparte | apoyar causas |
| Comparte sorteos sin causa | tráfico/seguimiento |

### 7.4. Urgencia de Campañas

Si hay campañas que están por cerrar → deben **subir automáticamente**

### 7.5. Recomendación de Upgrades

El tablero debe recomendar upgrades de plan de manera inteligente:
- Mostrando cuánto más habría ganado si fuese pro, premium o elite
- Mostrando beneficios adicionales según comportamiento
- **Multiplicadores por plan:**
  - Free: 5%
  - Pro: 30%
  - Premium: 70%
  - Elite: 100%

---

## 8. API Endpoints Profesionales

### Preferencias

```
GET    /user/preferences                    # Devuelve preferencias explícitas
POST   /user/preferences                    # Crea preferencias iniciales
PUT    /user/preferences                    # Actualiza preferencias
PATCH  /user/preferences/goal               # Actualiza solo el objetivo principal
```

### Dashboard

```
GET    /user/dashboard                      # Entrega el dashboard ordenado
GET    /user/dashboard/:role                # Dashboard específico por rol
POST   /user/dashboard/reorder              # Guarda estado manual modificado
POST   /user/dashboard/reset                # Resetea a valores por defecto
GET    /user/dashboard/widgets              # Lista widgets disponibles
PATCH  /user/dashboard/widget/:id/toggle    # Muestra/oculta un widget
```

### Insights

```
GET    /user/insights                       # Obtiene insights de comportamiento
POST   /user/insights/update                # Actualiza comportamiento (interno)
POST   /user/insights/track-action          # Registra una acción del usuario
GET    /user/insights/recommendations       # Obtiene recomendaciones basadas en insights
```

### Onboarding

```
GET    /user/onboarding/status              # Estado del onboarding
POST   /user/onboarding/complete            # Marca onboarding como completado
POST   /user/onboarding/step/:step          # Guarda paso específico del onboarding
```

---

## 9. Integración con Otros Módulos

### 9.1. Integración con Sorteos (Documento 29)

- Los sorteos activos deben aparecer en el dashboard según preferencias
- Si el usuario tiene buen rendimiento promocionando sorteos, suben en prioridad

### 9.2. Integración con Sistema Económico

- El score considera `revenue_potential_score` basado en el modelo de 4 actores
- Los widgets que generan más ingresos pueden subir en prioridad

### 9.3. Integración con Gamificación

- Los logros y puntos influyen en qué contenido se muestra
- Usuarios con más engagement ven contenido más avanzado

### 9.4. Integración con Campañas

- Campañas próximas a cerrar suben automáticamente
- Campañas con buen rendimiento del usuario suben en prioridad

---

## 10. Estructura de Archivos

```
services/api/src/
  modules/
    preferences/
      preferences.module.ts
      preferences.controller.ts
      preferences.service.ts
      preferences.dto.ts
      
    dashboard/
      dashboard.module.ts
      dashboard.controller.ts
      dashboard.service.ts
      dashboard-ordering.service.ts
      dashboard.dto.ts
      
    insights/
      insights.module.ts
      insights.controller.ts
      insights.service.ts
      insights.dto.ts
      
    onboarding/
      onboarding.module.ts
      onboarding.controller.ts
      onboarding.service.ts
      onboarding.dto.ts

packages/core/src/
  dashboard/
    dashboard-scoring.service.ts
    dashboard.types.ts
    widget-registry.ts
```

---

## 11. Checklist para la IA del Programador

- [ ] Crear tabla `user_preferences`
- [ ] Crear tabla `user_behavior_insights`
- [ ] Crear tabla `dashboard_state`
- [ ] Crear tabla `dashboard_widgets`
- [ ] Crear `PreferencesService`
- [ ] Crear `DashboardOrderingService`
- [ ] Crear `InsightsService`
- [ ] Implementar algoritmo de puntuación
- [ ] Implementar endpoints de preferencias
- [ ] Implementar endpoints de dashboard
- [ ] Implementar endpoints de insights
- [ ] Implementar onboarding wizard
- [ ] Integrar con modelo económico
- [ ] Integrar con campañas activas
- [ ] Integrar con sorteos (Documento 29)
- [ ] Integrar gamificación
- [ ] Sincronizar preferencias con onboarding
- [ ] Implementar detección de prioridad inferida
- [ ] Implementar lógica de módulos inactivos (30 días)
- [ ] Implementar recomendaciones de upgrade
- [ ] Implementar backups

---

## 12. Recordatorio Obligatorio Interno

**IA del programador:**

Después de recibir este Documento 30:
- Haz backup local
- Haz backup remoto
- Registra:

```
VERSION: DOCUMENTO_30_COMPLETED
```

---

**VERSION: MODULE_0.A.21_DOCUMENT_30**
**Fecha de creación: 11 de diciembre de 2025**
