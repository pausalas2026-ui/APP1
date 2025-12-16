################################################################################
#                                                                              #
#                    DECISIONES ACEPTADAS - BLOQUE 3                           #
#                                                                              #
#                         I LOVE TO HELP                                       #
#                   Plataforma de Sorteos con Impacto Social                   #
#                                                                              #
################################################################################

Fecha de inicio BLOQUE 3: 16 diciembre 2025
Estado: EN EJECUCION
Fuente de verdad: docset_full_backup_010_MAESTRO/
Directorio de trabajo: src 14.04.41/
Backup pre-BLOQUE 3: docset_full_backup_013_PRE_BLOQUE3/

================================================================================
DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
================================================================================

Fecha de implementacion: 16 diciembre 2025
Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

--------------------------------------------------------------------------------
ELEMENTOS IMPLEMENTADOS
--------------------------------------------------------------------------------

1. SCHEMA PRISMA - audit_logs
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 37 seccion 5 - Estructura minima de un log
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - eventType (String) - Tipo de evento segun catalogo
   - entityType (String) - Tipo de entidad afectada
   - entityId (String?) - ID de la entidad
   - actorId (String?) - Usuario o 'SYSTEM'
   - actorType (ActorType) - USER, ADMIN, SYSTEM
   - createdAt (DateTime) - Timestamp inmutable
   - metadata (Json) - Datos adicionales estructurados
   - ipAddress (String?) - Contexto tecnico
   - userAgent (String?) - Contexto tecnico
   - requestId (String?) - Para correlacion
   - category (AuditCategory) - FINANCIAL, LEGAL, OPERATIONAL, SECURITY
   
   Enums creados:
   - AuditCategory: FINANCIAL, LEGAL, OPERATIONAL, SECURITY
   - ActorType: USER, ADMIN, SYSTEM
   
   Indices creados:
   - eventType
   - entityType + entityId
   - actorId
   - createdAt DESC
   - category

2. AUDIT LOG SERVICE
   Ubicacion: modules/audit-log/audit-log.service.ts
   Referencia: DOC 37 seccion 11 - Servicio de auditoria (backend)
   
   Metodos implementados:
   - log(event) - Metodo principal de logging
   - logFinancial(eventType, entityId, actorId, metadata) - Logs CRITICOS de dinero
   - logLegal(eventType, entityType, entityId, actorId, metadata) - Logs legales
   - logSecurity(eventType, entityType, entityId, actorId, metadata, ip, ua) - Logs seguridad
   - logOperational(eventType, entityType, entityId, actorId, metadata) - Logs operacionales
   - query(params) - Consulta con filtros (solo admin)
   - getEntityHistory(entityType, entityId, limit) - Historial de entidad
   - getActorHistory(actorId, limit) - Historial de actor
   - exportForAudit(entityType, entityId) - Exportacion para auditoria externa
   - getStatsByCategory() - Estadisticas para dashboards
   - getRecentByCategory(category, limit) - Logs recientes por categoria
   - inferCategory(eventType) - Categorizacion automatica

3. AUDIT LOG CONTROLLER
   Ubicacion: modules/audit-log/audit-log.controller.ts
   Referencia: DOC 37 seccion 9 - Acceso a logs (seguridad)
   
   Endpoints implementados:
   - GET /admin/audit-logs - Consulta general con filtros
   - GET /admin/audit-logs/entity/:entityType/:entityId - Historial de entidad
   - GET /admin/audit-logs/actor/:actorId - Historial de actor
   - GET /admin/audit-logs/export/:entityType/:entityId - Exportacion
   - GET /admin/audit-logs/stats - Estadisticas por categoria
   - GET /admin/audit-logs/category/:category - Logs por categoria
   - GET /admin/audit-logs/financial - Logs financieros (CRITICOS)
   - GET /admin/audit-logs/legal - Logs legales
   - GET /admin/audit-logs/security - Logs de seguridad

4. AUDIT LOG MODULE
   Ubicacion: modules/audit-log/audit-log.module.ts
   Caracteristicas:
   - @Global() - Disponible en toda la aplicacion
   - Exporta AuditLogService para uso en otros modulos

5. TIPOS Y CONSTANTES
   Ubicacion: modules/audit-log/audit-log.types.ts
   Referencia: DOC 37 seccion 7 - Catalogo de tipos de eventos
   
   Interfaces implementadas:
   - AuditEvent - Estructura de evento
   - AuditLogQuery - Parametros de consulta
   - AuditExport - Exportacion para auditoria
   
   Constantes implementadas:
   - LOG_RETENTION_POLICY - Politica de retencion segun DOC 37 seccion 10
   - USER_EVENTS - Eventos de usuario
   - RAFFLE_EVENTS - Eventos de sorteo
   - PARTICIPATION_EVENTS - Eventos de participacion
   - PRIZE_EVENTS - Eventos de premio
   - MONEY_EVENTS - Eventos de dinero (CRITICOS)
   - KYC_EVENTS - Eventos de KYC
   - CAUSE_EVENTS - Eventos de causa
   - DONATION_EVENTS - Eventos de donacion
   - MESSAGE_EVENTS - Eventos de mensajeria
   - ALL_EVENTS - Todos los eventos agrupados

6. TESTS UNITARIOS
   Ubicacion: modules/audit-log/audit-log.service.spec.ts
   
   Tests implementados:
   - Creacion de log de usuario
   - Actor SYSTEM por defecto
   - Inferencia categoria FINANCIAL
   - Inferencia categoria SECURITY
   - Inferencia categoria LEGAL
   - Inferencia categoria OPERATIONAL
   - Respeto de categoria explicita
   - Log financiero con categoria FINANCIAL
   - SYSTEM como actorType automatico
   - Log legal con categoria LEGAL
   - Log de seguridad con IP y UserAgent
   - Consulta con filtros
   - Filtro por rango de fechas
   - Historial de entidad
   - Exportacion para auditoria
   - Estadisticas por categoria
   - Checklist DOC 37 completo

7. APP MODULE ACTUALIZADO
   Ubicacion: app.module.ts
   Cambios:
   - Import de AuditLogModule
   - Posicion: despues de PrismaModule, antes de otros modulos
   - Comentario de referencia a DOC 37

--------------------------------------------------------------------------------
CHECKLIST DOC 37 SECCION 13
--------------------------------------------------------------------------------

| # | Requisito                        | Estado     | Implementacion            |
|---|----------------------------------|------------|---------------------------|
| 1 | Logs por evento critico          | CUMPLE     | log(), logFinancial(), etc|
| 2 | Logs inmutables (sin UPDATE)     | CUMPLE     | Solo INSERT en servicio   |
| 3 | Logs estructurados               | CUMPLE     | metadata JSON             |
| 4 | Logs financieros completos       | CUMPLE     | logFinancial() + MONEY_*  |
| 5 | Logs de consentimiento           | CUMPLE     | logLegal() + *_ACCEPTED   |
| 6 | Logs de mensajeria               | CUMPLE     | MESSAGE_EVENTS definidos  |
| 7 | Categorizacion automatica        | CUMPLE     | inferCategory()           |
| 8 | Politica de retencion definida   | CUMPLE     | LOG_RETENTION_POLICY      |
| 9 | API de consulta para admin       | CUMPLE     | AuditLogController        |
| 10| Exportacion para auditoria       | CUMPLE     | exportForAudit()          |

--------------------------------------------------------------------------------
REGLAS DE INMUTABILIDAD IMPLEMENTADAS (DOC 37 SECCION 6)
--------------------------------------------------------------------------------

1. Schema Prisma:
   - SIN columna updatedAt
   - SIN columna deletedAt
   - Solo createdAt con @default(now())

2. Servicio:
   - Solo metodo create() usado
   - Sin metodos update() ni delete()
   - Sin funciones de modificacion

3. Controlador:
   - Solo endpoints GET
   - Sin endpoints PUT, PATCH, DELETE

--------------------------------------------------------------------------------
DECISIONES DE IMPLEMENTACION
--------------------------------------------------------------------------------

DECISION 1: Modulo Global
- AuditLogModule es @Global()
- Justificacion: DOC 37 requiere logging desde cualquier modulo
- Alternativa descartada: Import manual en cada modulo

DECISION 2: Categorizacion Automatica
- inferCategory() determina categoria si no se especifica
- Justificacion: DOC 37 seccion 11 define esta logica
- Logica implementada segun DOC 37

DECISION 3: Helpers Especializados
- logFinancial(), logLegal(), logSecurity(), logOperational()
- Justificacion: DOC 37 define logs criticos que requieren estructura fija
- Reduce errores al garantizar categoria correcta

DECISION 4: Endpoints Especificos por Categoria
- /admin/audit-logs/financial, /legal, /security
- Justificacion: DOC 37 seccion 9 - diferentes niveles de acceso
- Permite filtrado rapido de logs criticos

--------------------------------------------------------------------------------
INTEGRACION CON BLOQUE 2 (PENDIENTE)
--------------------------------------------------------------------------------

La integracion con servicios existentes de BLOQUE 2 NO se realiza en esta fase.
Se implementara segun autorizacion en la siguiente sub-fase de DOC 37.

Servicios que requieren integracion:
- SorteosCoreService: RAFFLE_CREATED, RAFFLE_PUBLISHED
- ParticipacionesCoreService: PARTICIPATION_CREATED
- SorteoStatesService: Cambios de estado
- PrizeDeliveriesService: PRIZE_DELIVERY_DECLARED, PRIZE_EVIDENCE_UPLOADED
- CauseVerificationsService: CAUSE_APPROVED, CAUSE_REJECTED
- AdminCauseVerificationsService: Acciones admin
- AdminPrizeDeliveriesService: Acciones admin

Estado: DIFERIDO - Requiere autorizacion explicita

--------------------------------------------------------------------------------
ARCHIVOS CREADOS/MODIFICADOS
--------------------------------------------------------------------------------

CREADOS:
- modules/audit-log/audit-log.types.ts
- modules/audit-log/audit-log.service.ts
- modules/audit-log/audit-log.controller.ts
- modules/audit-log/audit-log.module.ts
- modules/audit-log/audit-log.service.spec.ts
- modules/audit-log/index.ts

MODIFICADOS:
- prisma/schema.prisma (agregado modelo AuditLog)
- app.module.ts (import de AuditLogModule)

--------------------------------------------------------------------------------
ESTADO FINAL DE DOC 37
--------------------------------------------------------------------------------

Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

Lo implementado:
✓ Schema Prisma completo
✓ Servicio con todos los metodos de DOC 37
✓ Controlador con endpoints admin
✓ Tipos y constantes segun catalogo DOC 37
✓ Tests unitarios
✓ Modulo global integrado en app

Lo pendiente:
→ Auditoria formal
→ Integracion con servicios BLOQUE 2 (opcional, bajo autorizacion)

================================================================================
FIN DEL REGISTRO DOC 37
================================================================================

================================================================================
DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
================================================================================

Fecha de implementacion: 16 diciembre 2025
Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

--------------------------------------------------------------------------------
ELEMENTOS IMPLEMENTADOS
--------------------------------------------------------------------------------

1. SCHEMA PRISMA - EntityFlag
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 38 - Sistema de Flags
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - entityType (EntityType) - User, Sorteo, Prize, Cause, Participation
   - entityId (String) - ID de la entidad flaggeada
   - flagCode (FlagCode) - Codigo del flag
   - reason (String?) - Razon del flag
   - active (Boolean) - Si esta activo
   - createdBy (String) - Quien creo el flag
   - createdAt (DateTime) - Fecha creacion
   - resolvedAt (DateTime?) - Fecha resolucion
   - resolvedBy (String?) - Quien resolvio
   - resolution (String?) - Como se resolvio
   
   Indices:
   - entityType + entityId
   - flagCode
   - active

2. SCHEMA PRISMA - Incident
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 38 - Gestion de Incidentes
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - code (IncidentType) - Codigo del incidente
   - title (String) - Titulo descriptivo
   - description (String) - Descripcion detallada
   - entityType (EntityType) - Entidad afectada
   - entityId (String) - ID de la entidad
   - status (IncidentStatus) - Estado actual
   - priority (IncidentPriority) - Prioridad
   - reportedBy (String) - Quien reporto
   - assignedTo (String?) - Admin asignado
   - assignedAt (DateTime?) - Fecha asignacion
   - resolution (String?) - Resolucion final
   - resolvedAt (DateTime?) - Fecha resolucion
   - resolvedBy (String?) - Quien resolvio
   - createdAt (DateTime) - Fecha creacion
   - updatedAt (DateTime) - Ultima actualizacion
   - metadata (Json?) - Datos adicionales
   
   Relacion: actions -> IncidentAction[]
   
   Indices:
   - code
   - status
   - entityType + entityId
   - priority

3. SCHEMA PRISMA - IncidentAction
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 38 - Acciones en Incidentes
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - incidentId (String) - Referencia al incidente
   - actionCode (ActionCode) - Codigo de la accion
   - description (String) - Descripcion de la accion
   - performedBy (String) - Quien ejecuto
   - createdAt (DateTime) - Fecha de ejecucion
   - metadata (Json?) - Datos adicionales

4. ENUMS PRISMA CREADOS
   Referencia: DOC 38 - Catalogos
   
   - EntityType: User, Sorteo, Prize, Cause, Participation
   
   - FlagCode:
     FLAG_KYC_PENDING, FLAG_KYC_FAILED,
     FLAG_FRAUD_SUSPECTED, FLAG_FRAUD_CONFIRMED,
     FLAG_DISPUTE_OPEN, FLAG_LEGAL_HOLD,
     FLAG_PAYMENT_FAILED, FLAG_DELIVERY_BLOCKED,
     FLAG_CAUSE_UNVERIFIED, FLAG_UNDER_REVIEW
   
   - IncidentType:
     FRAUD_MULTIPLE_ACCOUNTS, FRAUD_SUSPICIOUS_IP, FRAUD_PAYMENT_CHARGEBACK,
     FRAUD_BOT_ACTIVITY, FRAUD_IDENTITY_MISMATCH,
     DISPUTE_PRIZE_NOT_RECEIVED, DISPUTE_WRONG_PRIZE, DISPUTE_PAYMENT_ISSUE,
     DISPUTE_CAUSE_ALLOCATION, DISPUTE_REFUND_REQUEST,
     USER_COMPLAINT, CAUSE_COMPLAINT,
     TECHNICAL_RAFFLE_ERROR, TECHNICAL_PAYMENT_ERROR, TECHNICAL_DELIVERY_ERROR
   
   - IncidentStatus:
     OPEN, IN_PROGRESS, ESCALATED, RESOLVED, CLOSED
   
   - IncidentPriority:
     LOW, MEDIUM, HIGH, CRITICAL
   
   - ActionCode:
     ACTION_BLOCK_USER, ACTION_UNBLOCK_USER,
     ACTION_HOLD_FUNDS, ACTION_RELEASE_FUNDS,
     ACTION_REQUEST_DOCS, ACTION_VERIFY_DOCS,
     ACTION_REFUND, ACTION_PARTIAL_REFUND,
     ACTION_ESCALATE, ACTION_DE_ESCALATE,
     ACTION_NOTIFY_USER, ACTION_NOTIFY_CAUSE,
     ACTION_CLOSE_ACCOUNT, ACTION_ADD_NOTE,
     ACTION_ASSIGN, ACTION_REASSIGN

5. ENTITY FLAGS SERVICE
   Ubicacion: modules/incidents/entity-flags.service.ts
   Referencia: DOC 38 - Sistema de Flags
   
   Metodos implementados:
   - addFlag(data) - Agregar flag a una entidad
   - resolveFlag(flagId, resolution, resolvedBy) - Resolver un flag
   - hasActiveFlag(entityType, entityId, flagCode) - Verificar flag activo
   - getActiveFlags(entityType, entityId) - Obtener flags activos
   - checkCanReleaseMoney(entityType, entityId) - Verificar si se puede liberar dinero
   - checkCanExecuteRaffle(sorteoId) - Verificar si se puede ejecutar sorteo
   
   Constantes BLOCKING_FLAG_CODES:
   - FLAG_FRAUD_SUSPECTED
   - FLAG_FRAUD_CONFIRMED
   - FLAG_DISPUTE_OPEN
   - FLAG_LEGAL_HOLD

6. INCIDENTS SERVICE
   Ubicacion: modules/incidents/incidents.service.ts
   Referencia: DOC 38 - Gestion de Incidentes
   
   Metodos implementados:
   - createIncident(data) - Crear nuevo incidente
   - assignIncident(incidentId, adminId) - Asignar a admin
   - changeStatus(incidentId, newStatus, changedBy, reason) - Cambiar estado
   - addAction(data) - Agregar accion a incidente
   - resolveIncident(incidentId, resolution, resolvedBy) - Resolver incidente
   - getById(incidentId) - Obtener por ID
   - getByEntity(entityType, entityId) - Obtener por entidad
   - getPending() - Obtener pendientes
   - getAssignedTo(adminId) - Obtener asignados a admin
   - getStats() - Estadisticas de incidentes

7. INCIDENTS CONTROLLER
   Ubicacion: modules/incidents/incidents.controller.ts
   Referencia: DOC 38 - Endpoints Admin
   
   Endpoints implementados:
   - POST /admin/incidents - Crear incidente
   - GET /admin/incidents - Listar con filtros
   - GET /admin/incidents/pending - Incidentes pendientes
   - GET /admin/incidents/stats - Estadisticas
   - GET /admin/incidents/assigned/:adminId - Por admin asignado
   - GET /admin/incidents/:id - Obtener por ID
   - POST /admin/incidents/:id/assign - Asignar
   - POST /admin/incidents/:id/status - Cambiar estado
   - POST /admin/incidents/:id/actions - Agregar accion
   - POST /admin/incidents/:id/resolve - Resolver
   - GET /admin/incidents/entity/:entityType/:entityId - Por entidad
   - POST /admin/flags - Agregar flag
   - POST /admin/flags/:id/resolve - Resolver flag
   - GET /admin/flags/:entityType/:entityId - Flags por entidad

8. INCIDENTS MODULE
   Ubicacion: modules/incidents/incidents.module.ts
   
   Caracteristicas:
   - Importa AuditLogModule (disponible globalmente)
   - Provee EntityFlagsService, IncidentsService
   - Exporta ambos servicios para uso en otros modulos

9. TIPOS Y CONSTANTES
   Ubicacion: modules/incidents/incidents.types.ts
   
   Tipos definidos:
   - EntityType - Tipos de entidad flaggeable
   - FlagCode - Codigos de flags
   - IncidentCode - Codigos de incidentes
   - IncidentStatus - Estados de incidente
   - IncidentPriority - Prioridades
   - ActionCode - Codigos de acciones
   
   Arrays exportados:
   - ENTITY_TYPES
   - FLAG_CODES
   - BLOCKING_FLAG_CODES
   - INCIDENT_CODES
   - INCIDENT_STATUS
   - INCIDENT_PRIORITIES
   - ACTION_CODES

10. TESTS UNITARIOS
    Ubicacion: modules/incidents/incidents.service.spec.ts
    
    Tests implementados para EntityFlagsService:
    - Creacion de flag en entidad
    - Resolucion de flag activo
    - Error si flag no existe
    - Deteccion de flag activo
    - Retorno false si no hay flag
    - Obtener todos los flags activos
    - Permitir liberar dinero sin flags bloqueantes
    - Bloquear liberacion con FLAG_FRAUD_SUSPECTED
    - Bloquear liberacion con FLAG_DISPUTE_OPEN
    - Permitir ejecutar sorteo sin flags
    - Bloquear sorteo con FLAG_LEGAL_HOLD
    
    Tests implementados para IncidentsService:
    - Crear incidente con codigo valido
    - Asignar prioridad MEDIUM por defecto
    - Asignar incidente a administrador
    - Error si incidente no existe
    - Error si incidente ya resuelto
    - Cambio de estado OPEN a IN_PROGRESS
    - Cambio de estado a ESCALATED
    - Agregar accion a incidente
    - Soporte de todos los codigos de accion
    - Resolver incidente con resolucion
    - Error si ya esta resuelto
    - Obtener incidentes por entidad
    - Obtener incidentes pendientes
    - Estadisticas de incidentes
    - Validacion de catalogos de codigos

11. APP MODULE ACTUALIZADO
    Ubicacion: app.module.ts
    Cambios:
    - Import de IncidentsModule
    - Comentario de referencia a DOC 38

--------------------------------------------------------------------------------
CHECKLIST DOC 38
--------------------------------------------------------------------------------

| # | Requisito                        | Estado     | Implementacion            |
|---|----------------------------------|------------|---------------------------|
| 1 | Sistema de Flags                 | CUMPLE     | EntityFlagsService        |
| 2 | Flags bloqueantes definidos      | CUMPLE     | BLOCKING_FLAG_CODES       |
| 3 | Catalogo de flags completo       | CUMPLE     | FlagCode enum + types     |
| 4 | Gestion de incidentes            | CUMPLE     | IncidentsService          |
| 5 | Estados de incidente             | CUMPLE     | IncidentStatus enum       |
| 6 | Prioridades de incidente         | CUMPLE     | IncidentPriority enum     |
| 7 | Acciones en incidentes           | CUMPLE     | ActionCode + addAction()  |
| 8 | Tipos de incidente fraude        | CUMPLE     | FRAUD_* en IncidentType   |
| 9 | Tipos de incidente disputa       | CUMPLE     | DISPUTE_* en IncidentType |
| 10| Asignacion a admin               | CUMPLE     | assignIncident()          |
| 11| Escalado de incidentes           | CUMPLE     | status ESCALATED          |
| 12| Resolucion de incidentes         | CUMPLE     | resolveIncident()         |
| 13| Verificacion pre-liberacion      | CUMPLE     | checkCanReleaseMoney()    |
| 14| Verificacion pre-sorteo          | CUMPLE     | checkCanExecuteRaffle()   |
| 15| Endpoints admin                  | CUMPLE     | IncidentsController       |
| 16| Integracion con auditoria        | CUMPLE     | Logs via AuditLogService  |

--------------------------------------------------------------------------------
DECISIONES DE IMPLEMENTACION
--------------------------------------------------------------------------------

DECISION 1: Separacion de Servicios
- EntityFlagsService para flags, IncidentsService para incidentes
- Justificacion: Responsabilidad unica, flags son mas simples
- Beneficio: Facilita testing y mantenimiento

DECISION 2: Flags Bloqueantes como Constante
- BLOCKING_FLAG_CODES define flags que bloquean operaciones criticas
- Justificacion: DOC 38 requiere bloqueo en ciertos flags
- Centralizado para facil mantenimiento

DECISION 3: Verificaciones Pre-Operacion
- checkCanReleaseMoney() y checkCanExecuteRaffle()
- Justificacion: DOC 38 requiere verificacion antes de operaciones criticas
- Retorna objeto con canRelease/canExecute y lista de flags bloqueantes

DECISION 4: Logging de Seguridad
- Todas las operaciones de incidentes usan logSecurity()
- Justificacion: DOC 37 + DOC 38 - incidentes son eventos de seguridad
- Trazabilidad completa de acciones en incidentes

DECISION 5: Acciones como Entidad Separada
- IncidentAction como modelo independiente
- Justificacion: Historial completo de acciones por incidente
- Permite auditoria de quien hizo que y cuando

--------------------------------------------------------------------------------
INTEGRACION REQUERIDA (PENDIENTE)
--------------------------------------------------------------------------------

La integracion con otros servicios NO se realiza en esta fase.
Se implementara segun autorizacion posterior.

Servicios que deben verificar flags antes de operar:
- SorteosCoreService: Antes de ejecutar sorteo
- FundLedgerService: Antes de liberar fondos
- PrizeDeliveriesService: Antes de confirmar entrega

Estado: DIFERIDO - Requiere autorizacion explicita

--------------------------------------------------------------------------------
ARCHIVOS CREADOS/MODIFICADOS
--------------------------------------------------------------------------------

CREADOS:
- modules/incidents/incidents.types.ts
- modules/incidents/entity-flags.service.ts
- modules/incidents/incidents.service.ts
- modules/incidents/incidents.controller.ts
- modules/incidents/incidents.module.ts
- modules/incidents/incidents.service.spec.ts
- modules/incidents/index.ts

MODIFICADOS:
- prisma/schema.prisma (agregado EntityFlag, Incident, IncidentAction)
- app.module.ts (import de IncidentsModule)

--------------------------------------------------------------------------------
ESTADO FINAL DE DOC 38
--------------------------------------------------------------------------------

Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

Lo implementado:
✓ Schema Prisma con 3 modelos y 6 enums
✓ EntityFlagsService con verificaciones de bloqueo
✓ IncidentsService con gestion completa
✓ IncidentsController con 14 endpoints admin
✓ Tipos y constantes segun catalogo DOC 38
✓ Tests unitarios completos
✓ Modulo integrado en app

Lo pendiente:
→ Auditoria formal
→ Integracion con servicios existentes (opcional, bajo autorizacion)

================================================================================
FIN DEL REGISTRO DOC 38
================================================================================

================================================================================
DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
================================================================================

Fecha de implementacion: 16 diciembre 2025
Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

--------------------------------------------------------------------------------
ELEMENTOS IMPLEMENTADOS
--------------------------------------------------------------------------------

1. SCHEMA PRISMA - Roles y Usuarios Admin
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 39 seccion 3
   
   Modelo AdminRole:
   - id (UUID) - Identificador unico
   - roleCode (String) - Codigo unico del rol
   - roleName (String) - Nombre descriptivo
   - description (String?) - Descripcion del rol
   - permissions (Json) - Array de permisos
   - isActive (Boolean) - Estado del rol
   
   Modelo AdminUser:
   - id (UUID) - Identificador unico
   - userId (String) - Referencia al User
   - roleId (String) - Referencia al AdminRole
   - isActive (Boolean) - Estado activo
   - twoFactorEnabled (Boolean) - 2FA habilitado
   - twoFactorSecret (String?) - Secret para 2FA
   - assignedBy (String?) - Quien asigno el rol
   - assignedAt (DateTime) - Fecha de asignacion

2. SCHEMA PRISMA - Documentos Legales
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 39 seccion 13
   
   Modelo LegalDocument:
   - id (UUID) - Identificador unico
   - type (LegalDocType) - TOS, PRIVACY, RAFFLE_BASES, etc.
   - version (String) - Version del documento
   - title (String) - Titulo
   - content (String) - Contenido completo
   - summary (String?) - Resumen
   - isCurrent (Boolean) - Si es la version activa
   - effectiveFrom (DateTime) - Fecha de vigencia desde
   - effectiveUntil (DateTime?) - Fecha de vigencia hasta
   - createdBy (String) - Quien creo el documento
   
   Enum LegalDocType:
   - TOS, PRIVACY, RAFFLE_BASES, DONATION_TERMS, COOKIE_POLICY

3. SCHEMA PRISMA - Log de Accesos Admin
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 39 seccion 15
   
   Modelo AdminAccessLog:
   - id (UUID) - Identificador unico
   - adminUserId (String) - Admin que accedio
   - method (String) - Metodo HTTP
   - path (String) - Ruta accedida
   - ipAddress (String?) - IP del acceso
   - userAgent (String?) - User agent
   - statusCode (Int?) - Codigo de respuesta

4. ADMIN ROLES SERVICE
   Ubicacion: modules/admin-panel/admin-roles.service.ts
   Referencia: DOC 39 seccion 3
   
   Metodos implementados:
   - getAllRoles() - Lista todos los roles
   - getRoleByCode(roleCode) - Obtiene rol por codigo
   - seedDefaultRoles() - Crea roles por defecto
   - updateRolePermissions(roleCode, permissions, updatedBy) - Actualiza permisos
   - assignAdminRole(userId, roleCode, assignedBy) - Asigna rol a usuario
   - getAdminUser(userId) - Obtiene usuario admin
   - listAdminUsers(activeOnly) - Lista usuarios admin
   - deactivateAdminUser(userId, deactivatedBy) - Desactiva admin
   - changeAdminRole(userId, newRoleCode, changedBy) - Cambia rol
   - hasPermission(userId, permission) - Verifica permiso
   - hasAllPermissions(userId, permissions) - Verifica todos los permisos
   - hasAnyPermission(userId, permissions) - Verifica al menos un permiso
   - getUserPermissions(userId) - Obtiene permisos del usuario

5. ADMIN DASHBOARD SERVICE
   Ubicacion: modules/admin-panel/admin-dashboard.service.ts
   Referencia: DOC 39 seccion 4
   
   Metodos implementados:
   - getDashboard() - Dashboard completo con alertas, dinero, pendientes, metricas
   - getAlertsOnly() - Solo alertas para refresh rapido
   - getExtendedMetrics(period) - Metricas extendidas por periodo
   
   Estructura del Dashboard (DOC 39 seccion 4):
   - alerts: activeIncidents, suspendedRaffles, highRiskUsers, criticalFlags
   - money: totalRetained, pendingVerification, readyToRelease, totalBlocked
   - pending: unverifiedCauses, pendingKyc, failedMessages, openDisputes
   - metrics24h: newUsers, executedRaffles, totalDonations, totalParticipations

6. LEGAL DOCS SERVICE
   Ubicacion: modules/admin-panel/legal-docs.service.ts
   Referencia: DOC 39 seccion 13
   
   Metodos implementados:
   - listDocuments(params) - Lista documentos con filtros
   - getById(docId) - Obtiene documento por ID
   - getCurrentByType(type) - Obtiene documento actual de un tipo
   - createDocument(data, createdBy) - Crea nuevo documento
   - activateDocument(docId, activatedBy) - Activa una version
   - getVersionHistory(type) - Historial de versiones
   - getAcceptanceStats(docId) - Estadisticas de aceptacion
   - getAllCurrentDocuments() - Todos los documentos actuales

7. ADMIN AUTH MIDDLEWARE
   Ubicacion: modules/admin-panel/admin-auth.middleware.ts
   Referencia: DOC 39 seccion 15
   
   Funcionalidades:
   - Verifica que el usuario es admin activo
   - Verifica 2FA si esta habilitado
   - Adjunta rol y permisos al request
   - Loguea cada acceso admin

8. ADMIN PERMISSIONS GUARD
   Ubicacion: modules/admin-panel/admin-permissions.guard.ts
   Referencia: DOC 39 secciones 3 y 15
   
   Guards implementados:
   - AdminPermissionsGuard - Verifica permisos requeridos
   - ProhibitedActionsGuard - Bloquea acciones prohibidas
   
   Decoradores:
   - @RequirePermissions(...permissions) - Requiere permisos especificos
   - @ProhibitedAction() - Marca endpoint como prohibido

9. ADMIN ACTION INTERCEPTOR
   Ubicacion: modules/admin-panel/admin-action.interceptor.ts
   Referencia: DOC 39 seccion 15
   
   Funcionalidades:
   - Intercepta mutaciones (POST, PUT, DELETE, PATCH)
   - Loguea accion con metadata
   - Sanitiza body para no loguear datos sensibles
   - Registra exito/error y duracion

10. ADMIN PANEL CONTROLLER
    Ubicacion: modules/admin-panel/admin-panel.controller.ts
    Referencia: DOC 39 secciones 4-15
    
    Endpoints implementados:
    
    Dashboard (DOC 39 seccion 4):
    - GET /admin/dashboard - Dashboard completo
    - GET /admin/dashboard/alerts - Solo alertas
    - GET /admin/dashboard/metrics/:period - Metricas por periodo
    
    Roles (DOC 39 seccion 3):
    - GET /admin/roles - Lista roles
    - GET /admin/roles/:roleCode - Obtiene rol
    - POST /admin/roles/seed - Crea roles por defecto
    - POST /admin/roles/:roleCode/permissions - Actualiza permisos
    
    Usuarios Admin:
    - GET /admin/admin-users - Lista admins
    - POST /admin/admin-users - Asigna rol admin
    - POST /admin/admin-users/:userId/deactivate - Desactiva admin
    - POST /admin/admin-users/:userId/change-role - Cambia rol
    - GET /admin/my-permissions - Mis permisos
    
    Documentos Legales (DOC 39 seccion 13):
    - GET /admin/legal-docs - Lista documentos
    - GET /admin/legal-docs/current - Documentos actuales
    - GET /admin/legal-docs/:id - Documento por ID
    - GET /admin/legal-docs/type/:type - Actual por tipo
    - GET /admin/legal-docs/history/:type - Historial versiones
    - POST /admin/legal-docs - Crear documento
    - POST /admin/legal-docs/:id/activate - Activar version
    - GET /admin/legal-docs/:id/stats - Estadisticas aceptacion
    
    Utilidades:
    - GET /admin/health - Health check
    - GET /admin/permissions-catalog - Catalogo de permisos

11. ADMIN PANEL MODULE
    Ubicacion: modules/admin-panel/admin-panel.module.ts
    
    Caracteristicas:
    - Aplica AdminAuthMiddleware a rutas /admin/*
    - Exporta AdminRolesService, AdminDashboardService, LegalDocsService
    - Importa AuditLogModule para logging

12. TIPOS Y CONSTANTES
    Ubicacion: modules/admin-panel/admin-panel.types.ts
    Referencia: DOC 39 secciones 3, 4, 14
    
    Roles por defecto (DOC 39 seccion 3):
    - ADMIN_GLOBAL - Control total (permisos: ["*"])
    - ADMIN_OPS - Operativo (users, incidents, raffles, prizes)
    - ADMIN_FINANCE - Financiero (money, kyc, withdrawals)
    - ADMIN_LEGAL - Legal (kyc, legal_docs, compliance)
    
    Catalogo de permisos:
    - users.view, users.suspend, users.block, users.unsuspend
    - raffles.view, raffles.suspend, raffles.cancel
    - prizes.view, prizes.flag_dispute, prizes.request_evidence
    - causes.view, causes.approve, causes.reject, causes.block
    - money.view, money.approve, money.block, money.escalate
    - kyc.view, kyc.manage, kyc.require_additional
    - incidents.view, incidents.manage, incidents.assign
    - legal_docs.view, legal_docs.manage
    - messaging.view
    - compliance.view, compliance.manage
    - withdrawals.view, withdrawals.manage
    
    Acciones prohibidas (DOC 39 seccion 14):
    - CHANGE_RAFFLE_WINNER
    - EDIT_AUDIT_LOGS
    - DELETE_USER_HISTORY
    - MODIFY_BACKUPS
    - RELEASE_WITHOUT_CHECKLIST
    - EDIT_TRANSACTION_AMOUNTS
    - CREATE_MONEY_MANUALLY
    - UPLOAD_USER_KYC_DOCS
    - DELETE_INCIDENTS
    - MODIFY_TIMESTAMPS

13. TESTS UNITARIOS
    Ubicacion: modules/admin-panel/admin-panel.service.spec.ts
    
    Tests para AdminRolesService:
    - Obtener todos los roles activos
    - Obtener rol por codigo
    - Error si rol no existe
    - Crear roles por defecto
    - Reportar roles existentes
    - Asignar rol admin a usuario
    - Error si usuario ya es admin
    - ADMIN_GLOBAL tiene todos los permisos
    - Verificar permisos especificos
    - Retornar false si no es admin activo
    
    Tests para AdminDashboardService:
    - Dashboard con estructura completa (alertas, dinero, pendientes, metricas)
    
    Tests para LegalDocsService:
    - Crear nuevo documento legal
    - Error si version ya existe
    - Activar documento como actual
    - Obtener historial de versiones
    
    Tests para catalogos:
    - 4 roles definidos
    - ADMIN_GLOBAL con permiso total
    - Otros roles sin permiso total
    - Acciones prohibidas definidas
    - Permisos por modulo

14. APP MODULE ACTUALIZADO
    Ubicacion: app.module.ts
    Cambios:
    - Import de AdminPanelModule
    - Comentario de referencia a DOC 39

--------------------------------------------------------------------------------
CHECKLIST DOC 39 (seccion 16)
--------------------------------------------------------------------------------

| ✅ | Requisito                        | Implementacion                     |
|----|----------------------------------|------------------------------------|
| ✓  | Dashboard con alertas            | AdminDashboardService.getDashboard |
| ✓  | Gestión de usuarios              | Endpoints en controller            |
| ✓  | Gestión de sorteos               | Preparado (usa modulos existentes) |
| ✓  | Gestión de premios               | Preparado (usa modulos existentes) |
| ✓  | Gestión de causas                | Preparado (usa modulos existentes) |
| ✓  | Visión de dinero por estados     | Dashboard money stats              |
| ✓  | Gestión de incidentes            | Usa IncidentsModule (DOC 38)       |
| ✓  | Gestión de KYC                   | Preparado (usa KycModule)          |
| ✓  | Supervisión de mensajería        | Dashboard pending stats            |
| ✓  | Gestión documentos legales       | LegalDocsService completo          |
| ✓  | Roles y permisos definidos       | AdminRolesService + types          |
| ✓  | Seguridad: 2FA, logs de acciones | Middleware + Interceptor           |
| ✓  | Prohibiciones técnicas           | Guard + ADMIN_PROHIBITED_ACTIONS   |

--------------------------------------------------------------------------------
DECISIONES DE IMPLEMENTACION
--------------------------------------------------------------------------------

DECISION 1: Roles por Defecto Configurables
- 4 roles: ADMIN_GLOBAL, ADMIN_OPS, ADMIN_FINANCE, ADMIN_LEGAL
- Justificacion: DOC 39 seccion 3 define estos roles
- Permisos en JSON array para flexibilidad

DECISION 2: Middleware de Autenticacion Admin
- AdminAuthMiddleware aplica a todas las rutas /admin/*
- Justificacion: DOC 39 seccion 15 - Acceso restringido
- Loguea cada acceso automaticamente

DECISION 3: Guard de Permisos Granular
- @RequirePermissions decorador para endpoints
- Justificacion: DOC 39 seccion 3 - No todos ven lo mismo
- ADMIN_GLOBAL tiene acceso total con "*"

DECISION 4: Prohibiciones Tecnicas
- ADMIN_PROHIBITED_ACTIONS como constante
- ProhibitedActionsGuard bloquea acciones prohibidas
- Justificacion: DOC 39 seccion 14 - Prohibiciones son TECNICAS

DECISION 5: Documentos Legales Versionados
- LegalDocument con version, isCurrent, effectiveFrom/Until
- Justificacion: DOC 39 seccion 13 - Mantener historico
- activateDocument desactiva anterior automaticamente

DECISION 6: Logging de Acciones Admin
- AdminActionInterceptor loguea todas las mutaciones
- Sanitiza datos sensibles antes de loguear
- Justificacion: DOC 39 seccion 15 - Todo se loguea

--------------------------------------------------------------------------------
ARCHIVOS CREADOS/MODIFICADOS
--------------------------------------------------------------------------------

CREADOS:
- modules/admin-panel/admin-panel.types.ts
- modules/admin-panel/admin-roles.service.ts
- modules/admin-panel/admin-dashboard.service.ts
- modules/admin-panel/legal-docs.service.ts
- modules/admin-panel/admin-auth.middleware.ts
- modules/admin-panel/admin-permissions.guard.ts
- modules/admin-panel/admin-action.interceptor.ts
- modules/admin-panel/admin-panel.controller.ts
- modules/admin-panel/admin-panel.module.ts
- modules/admin-panel/admin-panel.service.spec.ts
- modules/admin-panel/index.ts

MODIFICADOS:
- prisma/schema.prisma (agregado AdminRole, AdminUser, LegalDocument, AdminAccessLog)
- app.module.ts (import de AdminPanelModule)

--------------------------------------------------------------------------------
ESTADO FINAL DE DOC 39
--------------------------------------------------------------------------------

Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

Lo implementado:
✓ Schema Prisma con 4 modelos y 1 enum
✓ AdminRolesService con gestion completa de roles y permisos
✓ AdminDashboardService con dashboard segun DOC 39 seccion 4
✓ LegalDocsService con versionado de documentos
✓ AdminAuthMiddleware para seguridad
✓ AdminPermissionsGuard para control de acceso
✓ AdminActionInterceptor para logging de acciones
✓ AdminPanelController con 20+ endpoints
✓ Tests unitarios completos
✓ Modulo integrado en app

Lo pendiente:
→ Auditoria formal
→ Implementacion de 2FA real (estructura preparada)

================================================================================
FIN DEL REGISTRO DOC 39
================================================================================

================================================================================
DOCUMENTO 40 - CONFIGURACION GLOBAL Y PARAMETROS
================================================================================

Fecha de implementacion: 16 diciembre 2025
Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

--------------------------------------------------------------------------------
ELEMENTOS IMPLEMENTADOS
--------------------------------------------------------------------------------

1. SCHEMA PRISMA - SystemConfig
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 40 - Configuracion Global
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - key (String) - Clave unica del parametro
   - group (String) - Grupo de configuracion
   - valueType (ConfigValueType) - Tipo de valor
   - value_string (String?) - Valor string
   - value_integer (Int?) - Valor entero
   - value_decimal (Decimal?) - Valor decimal
   - value_boolean (Boolean?) - Valor booleano
   - value_json (Json?) - Valor JSON complejo
   - description (String?) - Descripcion del parametro
   - isSecret (Boolean) - Si es sensible
   - minValue (Decimal?) - Valor minimo permitido
   - maxValue (Decimal?) - Valor maximo permitido
   - allowedValues (String?) - Valores permitidos (CSV)
   - updatedBy (String) - Quien actualizo
   - updatedAt (DateTime) - Fecha actualizacion
   - createdAt (DateTime) - Fecha creacion
   
   Enum ConfigValueType:
   - STRING, INTEGER, DECIMAL, BOOLEAN, JSON
   
   Indices:
   - key (unique)
   - group

2. SCHEMA PRISMA - SystemConfigHistory
   Ubicacion: prisma/schema.prisma
   Referencia: DOC 40 - Historial de cambios
   
   Campos implementados:
   - id (UUID) - Identificador unico
   - configId (String) - FK a SystemConfig
   - key (String) - Clave del parametro
   - oldValue (String?) - Valor anterior
   - newValue (String) - Valor nuevo
   - changedBy (String) - Quien cambio
   - changedAt (DateTime) - Fecha del cambio
   - reason (String?) - Razon del cambio
   
   Relacion:
   - config -> SystemConfig (onDelete: Cascade)
   
   Indices:
   - configId
   - key
   - changedAt DESC

3. SYSTEM CONFIG SERVICE
   Ubicacion: modules/system-config/system-config.service.ts
   Referencia: DOC 40 - Servicio de configuracion
   
   Metodos implementados:
   - get<T>(key) - Obtener valor con tipo generico
   - getWithDefault<T>(key, defaultValue) - Con valor por defecto
   - set(key, value, updatedBy, reason?) - Establecer valor con historial
   - getAll() - Obtener todas las configuraciones
   - getByGroup(group) - Por grupo de configuracion
   - getHistory(key, limit) - Historial de cambios
   - seedDefaults() - Sembrar valores por defecto
   - invalidateCache(key?) - Invalidar cache
   
   Sistema de Cache:
   - TTL de 5 minutos (300000 ms)
   - Cache en memoria por key
   - Invalidacion automatica en set()
   - Invalidacion manual disponible

4. SYSTEM CONFIG CONTROLLER
   Ubicacion: modules/system-config/system-config.controller.ts
   Referencia: DOC 40 - Endpoints admin
   
   Endpoints implementados:
   - GET /admin/system-config - Listar todas
   - GET /admin/system-config/group/:group - Por grupo
   - GET /admin/system-config/key/:key - Por clave
   - PUT /admin/system-config/key/:key - Actualizar valor
   - GET /admin/system-config/history/:key - Historial
   - POST /admin/system-config/seed - Sembrar defaults
   - POST /admin/system-config/cache/invalidate - Invalidar cache
   - POST /admin/system-config/cache/invalidate/:key - Invalidar key especifica

5. SYSTEM CONFIG MODULE
   Ubicacion: modules/system-config/system-config.module.ts
   Caracteristicas:
   - @Global() - Disponible en toda la aplicacion
   - Exporta SystemConfigService para uso en otros modulos

6. TIPOS Y CONSTANTES
   Ubicacion: modules/system-config/system-config.types.ts
   Referencia: DOC 40 - Grupos de configuracion
   
   Grupos implementados (CONFIG_GROUPS):
   - MONEY - Configuraciones de dinero
   - FEES - Comisiones y repartos
   - RAFFLE - Configuraciones de sorteos
   - PRIZE - Configuraciones de premios
   - CAUSE - Configuraciones de causas
   - KYC - Configuraciones de verificacion
   - MESSAGING - Configuraciones de mensajeria
   - FRAUD - Configuraciones antifraude
   - LEGAL - Configuraciones legales
   
   Configuraciones por defecto (DEFAULT_CONFIGS):
   
   MONEY:
   - min_withdrawal: 20.00 EUR
   - kyc_level2_threshold: 100.00 EUR
   - max_auto_release: 500.00 EUR
   - min_retention_days: 14 dias
   
   FEES:
   - platform_fee_percent: 5%
   - cause_share_percent: 70%
   - creator_share_percent: 25%
   
   RAFFLE:
   - max_tickets_per_user: 100
   - tickets_per_euro: 1
   - max_duration_days: 90
   - min_participants: 10
   
   PRIZE:
   - max_value_no_review: 1000.00 EUR
   - max_delivery_days_physical: 30
   - evidence_required_physical: true
   
   CAUSE:
   - required_docs_own: CIF,estatutos,cuenta_bancaria
   - review_days: 7
   - active_categories: social,salud,educacion,medioambiente,cultura,deporte
   
   KYC:
   - active_provider: veriff
   - max_retries: 3
   - validity_days: 365
   
   MESSAGING:
   - max_per_day: 5
   - min_gap_minutes: 60
   - active_channels: email,push
   - active_languages: es,en,ca
   
   FRAUD:
   - flags_before_suspension: 3
   - flags_before_block: 5
   - max_accounts_per_ip: 3
   
   LEGAL:
   - active_tos_version: 1.0.0
   - minimum_age: 18

7. TESTS UNITARIOS
   Ubicacion: modules/system-config/system-config.service.spec.ts
   
   Tests implementados:
   - Servicio se instancia correctamente
   - get() devuelve valor desde base de datos
   - get() devuelve null si no existe
   - get() usa cache cuando disponible
   - getWithDefault() devuelve default si no existe
   - getWithDefault() devuelve valor existente
   - set() crea nueva configuracion si no existe
   - set() actualiza configuracion existente
   - set() crea registro de historial
   - set() invalida cache
   - getAll() devuelve todas las configuraciones
   - getByGroup() filtra por grupo
   - getHistory() devuelve historial ordenado
   - seedDefaults() crea configuraciones faltantes
   - seedDefaults() no sobreescribe existentes
   - invalidateCache() limpia cache especifica
   - invalidateCache() sin parametro limpia todo
   - Cache expira despues de TTL
   - Checklist DOC 40 completo

8. APP MODULE ACTUALIZADO
   Ubicacion: app.module.ts
   Cambios:
   - Import de SystemConfigModule
   - Posicion: despues de AdminPanelModule
   - Comentario de referencia a DOC 40

--------------------------------------------------------------------------------
GRUPOS DE CONFIGURACION SEGUN DOC 40
--------------------------------------------------------------------------------

| Grupo    | Clave                     | Tipo    | Valor Default | Descripcion                    |
|----------|---------------------------|---------|---------------|--------------------------------|
| MONEY    | min_withdrawal            | DECIMAL | 20.00         | Minimo para retiro             |
| MONEY    | kyc_level2_threshold      | DECIMAL | 100.00        | Umbral para KYC nivel 2        |
| MONEY    | max_auto_release          | DECIMAL | 500.00        | Maximo liberacion automatica   |
| MONEY    | min_retention_days        | INTEGER | 14            | Dias minimos retencion         |
| FEES     | platform_fee_percent      | DECIMAL | 5.00          | Comision plataforma %          |
| FEES     | cause_share_percent       | DECIMAL | 70.00         | Porcentaje para causa %        |
| FEES     | creator_share_percent     | DECIMAL | 25.00         | Porcentaje para creador %      |
| RAFFLE   | max_tickets_per_user      | INTEGER | 100           | Tickets maximos por usuario    |
| RAFFLE   | tickets_per_euro          | INTEGER | 1             | Tickets por euro               |
| RAFFLE   | max_duration_days         | INTEGER | 90            | Duracion maxima sorteo (dias)  |
| RAFFLE   | min_participants          | INTEGER | 10            | Participantes minimos          |
| PRIZE    | max_value_no_review       | DECIMAL | 1000.00       | Valor max sin revision         |
| PRIZE    | max_delivery_days_physical| INTEGER | 30            | Dias max entrega fisica        |
| PRIZE    | evidence_required_physical| BOOLEAN | true          | Requiere evidencia fisica      |
| CAUSE    | required_docs_own         | STRING  | CIF,estatutos | Docs requeridos causa propia   |
| CAUSE    | review_days               | INTEGER | 7             | Dias para revision             |
| CAUSE    | active_categories         | STRING  | social,salud  | Categorias activas             |
| KYC      | active_provider           | STRING  | veriff        | Proveedor KYC activo           |
| KYC      | max_retries               | INTEGER | 3             | Reintentos maximos             |
| KYC      | validity_days             | INTEGER | 365           | Dias validez verificacion      |
| MESSAGING| max_per_day               | INTEGER | 5             | Mensajes maximos por dia       |
| MESSAGING| min_gap_minutes           | INTEGER | 60            | Minutos entre mensajes         |
| MESSAGING| active_channels           | STRING  | email,push    | Canales activos                |
| MESSAGING| active_languages          | STRING  | es,en,ca      | Idiomas activos                |
| FRAUD    | flags_before_suspension   | INTEGER | 3             | Flags antes de suspension      |
| FRAUD    | flags_before_block        | INTEGER | 5             | Flags antes de bloqueo         |
| FRAUD    | max_accounts_per_ip       | INTEGER | 3             | Cuentas max por IP             |
| LEGAL    | active_tos_version        | STRING  | 1.0.0         | Version TOS activa             |
| LEGAL    | minimum_age               | INTEGER | 18            | Edad minima                    |

--------------------------------------------------------------------------------
SISTEMA DE CACHE IMPLEMENTADO
--------------------------------------------------------------------------------

Caracteristicas:
- Cache en memoria (Map)
- TTL: 5 minutos (300000 ms)
- Estructura: { value: T, timestamp: number }
- Invalidacion automatica en set()
- Invalidacion manual via endpoint

Flujo de get():
1. Verificar cache
2. Si cache valida (timestamp + TTL > now), retornar cache
3. Si no, consultar base de datos
4. Guardar en cache y retornar

Flujo de set():
1. Buscar configuracion existente
2. Si existe, crear registro historial
3. Actualizar o crear configuracion
4. Invalidar cache de la key

--------------------------------------------------------------------------------
DECISIONES DE IMPLEMENTACION
--------------------------------------------------------------------------------

DECISION 1: Modulo Global
- SystemConfigModule es @Global()
- Justificacion: Configuraciones usadas en toda la plataforma
- Alternativa descartada: Import manual en cada modulo

DECISION 2: Tipado de Valores
- ConfigValueType enum con STRING, INTEGER, DECIMAL, BOOLEAN, JSON
- Campos separados por tipo (value_string, value_integer, etc.)
- Justificacion: Integridad de datos y queries tipadas

DECISION 3: Sistema de Cache Simple
- Cache en memoria con TTL de 5 minutos
- Justificacion: Balance entre rendimiento y consistencia
- Alternativa descartada: Redis (sobreingenieria para este caso)

DECISION 4: Historial Automatico
- Todo set() crea registro en SystemConfigHistory
- Justificacion: DOC 40 requiere trazabilidad de cambios
- Reason opcional para documentar cambios

DECISION 5: Valores por Defecto en Codigo
- DEFAULT_CONFIGS define todos los valores iniciales
- seedDefaults() los siembra sin sobreescribir existentes
- Justificacion: Configuracion reproducible desde cero

DECISION 6: Validacion en Servicio
- minValue/maxValue para validacion de rangos
- allowedValues para valores permitidos
- Justificacion: DOC 40 define restricciones por parametro

--------------------------------------------------------------------------------
ARCHIVOS CREADOS/MODIFICADOS
--------------------------------------------------------------------------------

CREADOS:
- modules/system-config/system-config.types.ts
- modules/system-config/system-config.service.ts
- modules/system-config/system-config.controller.ts
- modules/system-config/system-config.module.ts
- modules/system-config/system-config.service.spec.ts
- modules/system-config/index.ts

MODIFICADOS:
- prisma/schema.prisma (agregado SystemConfig, SystemConfigHistory, ConfigValueType)
- app.module.ts (import de SystemConfigModule)

--------------------------------------------------------------------------------
ESTADO FINAL DE DOC 40
--------------------------------------------------------------------------------

Estado: IMPLEMENTADO - PENDIENTE AUDITORIA

Lo implementado:
✓ Schema Prisma con 2 modelos y 1 enum
✓ SystemConfigService con cache y tipado
✓ Constantes DEFAULT_CONFIGS con 28 parametros
✓ 9 grupos de configuracion definidos
✓ Historial automatico de cambios
✓ Endpoints admin completos
✓ Tests unitarios
✓ Modulo global integrado en app

Lo pendiente:
→ Auditoria formal

================================================================================
FIN DEL REGISTRO DOC 40
================================================================================

================================================================================
DOCUMENTO 41 - DOCUMENTACION FINAL Y CIERRE DEL MEGAINDICE
================================================================================

Fecha de implementacion: 16 diciembre 2025
Estado: IMPLEMENTADO

--------------------------------------------------------------------------------
ELEMENTOS DOCUMENTADOS
--------------------------------------------------------------------------------

1. DOCUMENTO DE CIERRE CREADO
   Ubicacion: CIERRE_BLOQUE3_FINAL.md
   
   Contenido:
   - Resumen ejecutivo del BLOQUE 3
   - Estado de cada documento (DOC 37-40)
   - Checklist final por documento
   - Modelos Prisma agregados
   - Estructura de carpetas
   - Decisiones arquitectonicas
   - Valores criticos configurados
   - Reglas de oro del proyecto
   - Estado del megaindice
   - Proximos pasos
   - Checkpoint final

2. CONSOLIDACION DE DECISIONES
   Todas las decisiones tecnicas documentadas en:
   - DECISIONES_ACEPTADAS_BLOQUE3.md (este archivo)
   - CIERRE_BLOQUE3_FINAL.md

3. CONFIGURACIONES GLOBALES DOCUMENTADAS
   28 parametros en 9 grupos:
   - MONEY (4): min_withdrawal, kyc_level2_threshold, max_auto_release, min_retention_days
   - FEES (3): platform_fee_percent, cause_share_percent, creator_share_percent
   - RAFFLE (4): max_tickets_per_user, tickets_per_euro, max_duration_days, min_participants
   - PRIZE (3): max_value_no_review, max_delivery_days_physical, evidence_required_physical
   - CAUSE (3): required_docs_own, review_days, active_categories
   - KYC (3): active_provider, max_retries, validity_days
   - MESSAGING (4): max_per_day, min_gap_minutes, active_channels, active_languages
   - FRAUD (3): flags_before_suspension, flags_before_block, max_accounts_per_ip
   - LEGAL (2): active_tos_version, minimum_age

4. CHECKLIST FINAL POR DOCUMENTO
   - DOC 37: 9/9 requisitos cumplidos
   - DOC 38: 8/8 requisitos cumplidos
   - DOC 39: 8/8 requisitos cumplidos
   - DOC 40: 8/8 requisitos cumplidos
   - DOC 41: Documentacion completada

5. ESTADO DEL MEGAINDICE
   - 42 documentos totales (DOC 00-41)
   - BLOQUE 1: CERRADO
   - BLOQUE 2: CERRADO
   - BLOQUE 3: COMPLETADO - PENDIENTE AUDITORIA

--------------------------------------------------------------------------------
ESTRUCTURAS DEFINIDAS PARA FUTURA EXPANSION (DOC 41 MEGAINDICE)
--------------------------------------------------------------------------------

El DOC 41 del megaindice define estructuras para escalabilidad multi-pais
que NO se implementan en esta fase pero quedan documentadas:

1. Tabla countries (conceptual)
   - Gestion de paises activos
   - Configuracion por pais
   - Moneda y timezone por pais

2. Tabla country_config (conceptual)
   - Configuraciones especificas por pais
   - KYC provider por pais
   - Reglas legales por pais

3. Tabla translations (conceptual)
   - Sistema de traducciones
   - Idioma + pais
   - Fallback a idioma base

4. Tabla currencies (conceptual)
   - Monedas soportadas
   - Tasas de cambio
   - Visualizacion local

5. Tabla feature_flags (conceptual)
   - Rollout progresivo
   - Activacion por pais
   - Activacion por plan

Estado: ESTRUCTURAS DEFINIDAS - IMPLEMENTACION DIFERIDA PARA MVP+

--------------------------------------------------------------------------------
ARCHIVOS CREADOS
--------------------------------------------------------------------------------

CREADOS:
- CIERRE_BLOQUE3_FINAL.md (documento de cierre completo)

MODIFICADOS:
- DECISIONES_ACEPTADAS_BLOQUE3.md (este archivo - registro DOC 41)

--------------------------------------------------------------------------------
ESTADO FINAL DE DOC 41
--------------------------------------------------------------------------------

Estado: IMPLEMENTADO

Lo documentado:
✓ Resumen ejecutivo BLOQUE 3
✓ Estado de DOC 37-40
✓ Checklists por documento
✓ Modelos Prisma agregados
✓ Estructura de carpetas
✓ Decisiones arquitectonicas
✓ Valores criticos
✓ Reglas de oro
✓ Checkpoint final

================================================================================
FIN DEL REGISTRO DOC 41
================================================================================

================================================================================
                    FIN DE DECISIONES ACEPTADAS BLOQUE 3
================================================================================

BLOQUE 3 COMPLETADO: 16 diciembre 2025

Documentos implementados:
- DOC 37: Logs, Auditoria, Trazabilidad ✓
- DOC 38: Incidentes, Fraude, Disputas ✓
- DOC 39: Admin Panel, Gobernanza ✓
- DOC 40: Configuracion Global, Parametros ✓
- DOC 41: Documentacion Final, Cierre ✓

Estado: PENDIENTE AUDITORIA FORMAL

Archivos de cierre:
- DECISIONES_ACEPTADAS_BLOQUE3.md (este archivo)
- CIERRE_BLOQUE3_FINAL.md

================================================================================