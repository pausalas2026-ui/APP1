# DOCUMENTO 29 – MÓDULO 0.a.20
# SISTEMA DE SORTEOS EXTERNO INTEGRADO
## (Addendum Estratégico Aplicable a Todos los Módulos Previos del Megaíndice del Programador IA)

---

## Aviso Oficial a la IA del Programador

Este documento constituye un **entregable normativo, obligatorio e incremental**, destinado a la IA del programador responsable del desarrollo de la plataforma **I Love to Help**. Debe ser leído, interpretado y ejecutado como un módulo funcional del megaíndice.

### Recuerda:
- Debes realizar **backups obligatorios** después de implementar cada submódulo.
- Debes seguir este documento al **100%**, sin interpretaciones libres.
- Si consideras que alguna solución técnica puede mejorarse, puedes proponerla, pero **nunca sustituirla automáticamente** sin autorización explícita.
- **No debes resumir, comprimir, omitir ni simplificar** ninguna instrucción.
- Todos los entregables deben conectarse al resto del sistema y generar **addendums retroactivos** cuando un módulo impacte módulos previos.

---

## 1. Propósito del Módulo

El presente módulo define la arquitectura completa, la lógica de negocio, los flujos operativos, las reglas económicas y la infraestructura técnica del **Sistema de Sorteos Externo Integrado**, un mecanismo esencial para:

- Generar tráfico.
- Incentivar participación.
- Aumentar conversión y engagement.
- Crear una razón adicional para que promotores y usuarios interactúen con la plataforma.
- Mantener la plataforma estable evitando congestión en su backend principal.
- Desacoplar el proceso de sorteos del core transaccional.

**El sistema de sorteos no se ejecuta dentro de I Love to Help**, sino en un **motor externo**, un microservicio independiente, conectado mediante endpoints con autenticación, firmas criptográficas y trazabilidad total.

Este modelo garantiza **máxima seguridad, escalabilidad y cumplimiento legal internacional**.

---

## 2. Arquitectura Funcional del Sistema de Sorteos Externo

El sistema se compone de **cuatro elementos principales**:

### 2.1. Panel del Administrador (I Love to Help)

El administrador podrá:
- Crear sorteos.
- Cargar imágenes del premio.
- Definir reglas generales y legales.
- Configurar fechas de inicio y cierre.
- Publicar o archivar sorteos.
- Obtener URLs únicas del sorteo.
- Obtener códigos QR imprimibles.
- Definir si el sorteo exige donación o solo participación.
- Asociar el sorteo a una causa, evento, campaña o categoría de activación.

### 2.2. Motor Externo de Sorteo (Microservicio)

Este componente es **completamente independiente** del backend central. Debe:
- Recibir listas cifradas de participantes.
- Ejecutar selección de ganador(es) mediante algoritmos criptográficamente seguros.
- Generar evidencia auditable del sorteo.
- Retornar los datos del ganador al core.
- Crear un registro de auditoría con hash verificable.

**Tecnologías recomendadas:**
- Node.js (`crypto.randomInt`)
- o Python (`secrets.randbelow`)

**El motor no tendrá nunca acceso directo a la base de datos interna del core.**

### 2.3. Base de Datos de Trazabilidad

Debe registrar:
- ID del promotor
- ID de la causa
- ID del evento o campaña
- Timestamp
- Firma HMAC
- Parámetros UTM
- Participaciones derivadas de acciones del promotor
- Comportamiento del usuario final

### 2.4. Sistema de Reportes para Administrador y Promotor

Incluye:
- Métricas en tiempo real
- Número de participantes
- Conversiones provenientes de promotores
- Si hubo donación o no
- Historial del ganador
- Evidencia del sorteo
- Hash criptográfico
- Ingreso generado
- Porcentajes aplicados

---

## 3. Flujos Operativos del Sistema

### 3.1. Flujo Completo del Administrador

1. Entra al panel principal de administración.
2. Selecciona la opción "Crear nuevo sorteo externo".
3. Sube la imagen del premio.
4. Escribe título.
5. Escribe descripción larga.
6. Escribe descripción corta optimizada para redes sociales.
7. Define fechas: inicio y cierre.
8. Define número de ganadores: 1 o más.
9. Define si la participación requiere donación o no.
10. Define reglas legales (obligatorio).
11. Guarda configuración.
12. El sistema automáticamente genera:
    - ID único del sorteo
    - URL externa con firma
    - QR imprimible
    - Parámetros para rastreo
13. Activa el sorteo.
14. Supervisa métricas desde su dashboard.

### 3.2. Flujo del Promotor

1. En su dashboard, ve los sorteos activos.
2. Selecciona un sorteo para promover.
3. El sistema le genera:
   - Enlace trackeado
   - UTM codes
   - QR personalizado
4. Comparte el sorteo:
   - Facebook
   - Instagram
   - TikTok
   - WhatsApp
   - Email
   - Impresión en tienda física
5. Cada clic queda registrado con:
   - `promoter_id`
   - `cause_id`
   - `event_id`
   - `signature`
6. Si la participación genera donación:
   - Se aplican reglas económicas globales y específicas.

### 3.3. Flujo del Usuario Final

1. Accede al sorteo mediante enlace o QR.
2. Registra su participación (email, datos mínimos).
3. Si requiere donación:
   - El usuario dona mediante los métodos permitidos.
4. Su participación queda registrada en el motor externo.
5. Una vez cerrada la campaña:
   - El motor ejecuta el sorteo.
   - Se genera evidencia criptográfica.
   - Se registra ganador.

---

## 4. Reglas Técnicas Obligatorias

### 4.1. Seguridad

- Todos los IDs deben transmitirse con **HMAC-256**.
- **Nunca** se enviarán IDs sin firma.
- El motor externo debe validar autenticidad de las firmas.
- Las participaciones deben registrar IP, user-agent y timestamp.
- No se transmite ningún dato sensible sin cifrado.

### 4.2. Independencia del Motor de Sorteo

El motor:
- **Nunca** deberá residir dentro del core.
- **Nunca** tendrá acceso directo a la base de datos de producción.
- **Siempre** operará como servicio desacoplado.

### 4.3. Backups

**IA del programador:**
Después de implementar cada submódulo, debes:
- Realizar backup local.
- Realizar backup remoto.
- Registrar la versión interna:
  ```
  VERSION: MODULE_0.A.20_DOCUMENT_29
  ```

---

## 5. Integración Obligatoria con Todos los Módulos Previos

Este módulo impacta:
- Autenticación
- Usuarios
- Promotores
- Causas
- Sistema económico global
- Planes de pago
- Sistema de gamificación
- Dashboard del promotor
- Dashboard del administrador
- Sistema de anuncios dinámicos
- Integraciones externas
- Plugins WordPress
- Lógica de donaciones
- Eventos y campañas

**Por tanto:**
La IA del programador debe generar un **ADDENDUM** en cada módulo previo, señalando:

> "El módulo 0.a.20 (Documento 29) introduce el Sistema de Sorteos Externo Integrado. Se debe considerar esta funcionalidad en todas las operaciones previamente definidas en este módulo."

---

## 6. Modelo de Datos Completo

### Tabla: `sweepstakes`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único del sorteo |
| admin_id | UUID | Administrador que creó el sorteo |
| title | varchar | Nombre del sorteo |
| description | text | Descripción |
| short_description | text | Descripción corta para redes sociales |
| image_url | varchar | URL de la imagen del premio |
| start_date | datetime | Fecha de inicio |
| end_date | datetime | Fecha de cierre |
| winners_count | integer | Número de ganadores (default: 1) |
| requires_donation | boolean | Si requiere donación |
| legal_rules | text | Reglas legales obligatorias |
| external_url | varchar | URL del sorteo externo |
| qr_code_url | varchar | URL del código QR generado |
| cause_id | UUID | Causa asociada (opcional) |
| event_id | UUID | Evento asociado (opcional) |
| campaign_id | UUID | Campaña asociada (opcional) |
| status | enum | draft, active, closed, archived |
| created_at | datetime | Fecha de creación |
| updated_at | datetime | Fecha de actualización |

### Tabla: `sweepstakes_participants`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sweepstake_id | UUID | FK al sorteo |
| promoter_id | UUID | FK al promotor (nullable) |
| cause_id | UUID | FK a la causa (nullable) |
| event_id | UUID | FK al evento (nullable) |
| user_email | varchar | Email del participante |
| user_name | varchar | Nombre del participante |
| tracking_signature | varchar | Firma HMAC de tracking |
| utm_source | varchar | Parámetro UTM source |
| utm_medium | varchar | Parámetro UTM medium |
| utm_campaign | varchar | Parámetro UTM campaign |
| donation_id | UUID | FK a donación si aplica |
| registered_at | datetime | Fecha de registro |
| ip | varchar | IP del participante |
| user_agent | varchar | User agent del navegador |

### Tabla: `sweepstakes_winners`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sweepstake_id | UUID | FK al sorteo |
| participant_id | UUID | FK al participante ganador |
| evidence_hash | varchar | Hash criptográfico de evidencia |
| algorithm_used | varchar | Algoritmo usado (crypto.randomInt, secrets.randbelow) |
| seed_data | text | Datos de seed para auditoría |
| position | integer | Posición del ganador (1, 2, 3...) |
| notified | boolean | Si fue notificado |
| notified_at | datetime | Fecha de notificación |
| claimed | boolean | Si reclamó el premio |
| claimed_at | datetime | Fecha de reclamo |
| created_at | datetime | Fecha de creación |

### Tabla: `sweepstakes_audit_log`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | Identificador único |
| sweepstake_id | UUID | FK al sorteo |
| action | varchar | Acción realizada |
| actor_id | UUID | Quien realizó la acción |
| actor_type | enum | admin, system, external_motor |
| payload | jsonb | Datos de la acción |
| hmac_signature | varchar | Firma HMAC del registro |
| created_at | datetime | Timestamp |

---

## 7. Reglas Económicas Aplicables

### 7.1. Sorteos gratuitos
- No generan ingresos.
- No se activan porcentajes económicos.
- Solo generan gamificación.

### 7.2. Sorteos con donación
- Se activan los porcentajes definidos en tu modelo económico:
  - Plataforma
  - Promotor (según plan: Free 5%, Pro 30%, Premium 70%, Elite 100%)
  - Generador (N1 70%, N2 30%)
  - Causa destino

### 7.3. Reglas del plan gratis
- El promotor gratuito recibe únicamente **5%** del total de la comisión que recibiría si estuviera en el plan élite.

### 7.4. Distribución MLM (EXACTAMENTE 2 NIVELES)
- **N1 (Promotor directo)**: 70% de la comisión de promotor
- **N2 (Affiliator)**: 30% de la comisión de promotor
- **NO EXISTE NIVEL 3**

---

## 8. API ENDPOINTS PROFESIONALES

### Administrador

```
POST   /admin/sweepstakes                    # Crea sorteo
GET    /admin/sweepstakes                    # Lista sorteos
GET    /admin/sweepstakes/{id}               # Detalle de sorteo
PUT    /admin/sweepstakes/{id}               # Actualiza sorteo
DELETE /admin/sweepstakes/{id}               # Elimina sorteo (solo draft)
POST   /admin/sweepstakes/{id}/publish       # Publica sorteo
POST   /admin/sweepstakes/{id}/close         # Cierra sorteo
POST   /admin/sweepstakes/{id}/archive       # Archiva sorteo
GET    /admin/sweepstakes/{id}/participants  # Lista participantes
GET    /admin/sweepstakes/{id}/results       # Devuelve ganador(es)
GET    /admin/sweepstakes/{id}/metrics       # Métricas del sorteo
GET    /admin/sweepstakes/{id}/audit-log     # Log de auditoría
```

### Promotor

```
GET    /promoter/sweepstakes                 # Lista sorteos activos disponibles
GET    /promoter/sweepstakes/{id}            # Detalle de sorteo
POST   /promoter/sweepstakes/{id}/share      # Obtiene enlaces trackeados
GET    /promoter/sweepstakes/{id}/metrics    # Métricas del promotor en sorteo
GET    /promoter/sweepstakes/my-stats        # Estadísticas globales de sorteos
```

### Motor Externo (Microservicio)

```
POST   /external/sweepstakes/{id}/register   # Registra participación
POST   /external/sweepstakes/{id}/run-lottery # Ejecuta sorteo
GET    /external/sweepstakes/{id}/verify     # Verifica evidencia criptográfica
POST   /external/sweepstakes/{id}/validate-signature # Valida firma HMAC
```

### Público

```
GET    /public/sweepstakes/{id}              # Información pública del sorteo
GET    /public/sweepstakes/{id}/winner       # Ganador público (después de cierre)
```

---

## 9. Errores Críticos que NO deben ocurrir

1. ❌ Integrar el motor externo dentro del core.
2. ❌ Enviar IDs sin firma.
3. ❌ No registrar tracking.
4. ❌ Ejecutar un sorteo sin evidencia criptográfica.
5. ❌ No insertar addendums en módulos previos.
6. ❌ Falta de trazabilidad en donaciones derivadas de sorteos.
7. ❌ Crear nivel 3 de MLM (SOLO EXISTEN 2 NIVELES).
8. ❌ Hardcodear porcentajes (deben venir de admin_settings).
9. ❌ Ejecutar sorteo antes de fecha de cierre.
10. ❌ Permitir participaciones después de fecha de cierre.

---

## 10. Checklist Final para la IA del Programador

- [ ] Motor de sorteo creado como microservicio independiente.
- [ ] APIs externas implementadas.
- [ ] Seguridad completa (HMAC, cifrado, IP logging).
- [ ] Backups ejecutados.
- [ ] Integración con tracking y UTM.
- [ ] Addendums generados en todos los módulos previos.
- [ ] Dashboard del administrador actualizado.
- [ ] Dashboard del promotor actualizado.
- [ ] Evidencia de sorteo implementada.
- [ ] Validaciones de reglas económicas aplicadas.
- [ ] Tablas de base de datos creadas (sweepstakes, sweepstakes_participants, sweepstakes_winners, sweepstakes_audit_log).
- [ ] Integración con EconomicEngine para donaciones en sorteos.
- [ ] Sistema de notificación a ganadores.
- [ ] Generación de QR codes.
- [ ] Tests unitarios y de integración.

---

## 11. Estructura de Archivos Requerida

```
services/
  api/src/
    modules/
      sweepstakes/
        sweepstakes.module.ts
        sweepstakes.controller.ts
        sweepstakes.service.ts
        sweepstakes.dto.ts
        sweepstakes-admin.controller.ts
        sweepstakes-promoter.controller.ts
        
  lottery-engine/              # MICROSERVICIO INDEPENDIENTE
    src/
      index.ts
      lottery.service.ts
      crypto.service.ts
      validation.service.ts
      routes/
        lottery.routes.ts
      types/
        lottery.types.ts
    package.json
    tsconfig.json
    Dockerfile
    
packages/
  core/src/
    sweepstakes/
      sweepstakes-engine.service.ts
      sweepstakes.types.ts
```

---

## 12. Variables de Entorno Requeridas

```env
# Motor de Sorteos Externo
LOTTERY_ENGINE_URL=https://lottery.ilovetohelp.com
LOTTERY_ENGINE_API_KEY=xxx
LOTTERY_HMAC_SECRET=xxx

# QR Generation
QR_SERVICE_URL=https://qr.ilovetohelp.com
QR_API_KEY=xxx
```

---

**VERSION: MODULE_0.A.20_DOCUMENT_29**
**Fecha de creación: 11 de diciembre de 2025**
