################################################################################
#                                                                              #
#                    DOCUMENTO DE ARRANQUE — BLOQUE 3                          #
#                                                                              #
#                         I LOVE TO HELP                                       #
#                   Plataforma de Sorteos con Impacto Social                   #
#                                                                              #
################################################################################

Fecha de creacion: 16 diciembre 2025
Estado: PENDIENTE DE AUTORIZACION
Prerequisitos: BLOQUE 1 CERRADO, BLOQUE 2 CERRADO DEFINITIVAMENTE

================================================================================
1. OBJETIVO EXACTO DE BLOQUE 3
================================================================================

BLOQUE 3 tiene como objetivo implementar las capas de:
- Observabilidad (logging, auditoria, trazabilidad)
- Proteccion (incidentes, fraude, disputas)
- Gobernanza (panel admin, configuracion global)
- Escalabilidad (multi-pais, parametrizacion)

Este bloque transforma la plataforma de un sistema funcional a un sistema
operable, auditable y gobernable en produccion.

RESULTADO ESPERADO:
Al finalizar BLOQUE 3, la plataforma debe poder:
- Registrar TODA accion critica con trazabilidad completa
- Detectar y gestionar incidentes de fraude
- Administrarse via panel de gobernanza
- Configurarse sin cambios de codigo
- Escalarse a nuevos paises/idiomas

================================================================================
2. DOCUMENTOS INVOLUCRADOS (DOC 37-41)
================================================================================

| DOC | Titulo | Proposito |
|-----|--------|-----------|
| 37 | Logs, Auditoria y Trazabilidad | Sistema de logging obligatorio |
| 38 | Incidentes, Fraude y Disputas | Deteccion y gestion de problemas |
| 39 | Admin Panel y Gobernanza | Interfaz de administracion |
| 40 | Config Global y Parametros | Valores configurables sin codigo |
| 41 | Escalabilidad y Cierre Megaindice | Multi-pais y cierre arquitectura |

FUENTE DE VERDAD: docset_full_backup_010_MAESTRO/

================================================================================
3. DEPENDENCIAS EXPLICITAS CON BLOQUE 1 Y BLOQUE 2
================================================================================

DEPENDENCIAS DE BLOQUE 1:
- User, Role, Permission (actores del sistema)
- AuthModule, JwtAuthGuard (autenticacion)
- Sorteo, Premio, Participacion (entidades base)
- Causa (entidad base)
- PrismaService (acceso a datos)

DEPENDENCIAS DE BLOQUE 2:
- SorteosCoreService (validaciones de sorteo)
- ParticipacionesCoreService (registro de participaciones)
- SorteoStatesService (maquina de estados)
- PrizeDeliveriesService (entregas de premios)
- CauseVerificationsService (verificacion de causas)
- DefaultCauseAssignmentsService (causa obligatoria)
- AdminCauseVerificationsService (endpoints admin causas)
- AdminPrizeDeliveriesService (endpoints admin entregas)

INTEGRACIONES REQUERIDAS:
- DOC 37 debe integrarse con TODOS los servicios existentes
- DOC 38 debe consumir logs de DOC 37
- DOC 39 debe exponer funciones de BLOQUE 2 en UI
- DOC 40 debe parametrizar valores hardcodeados en BLOQUE 1 y 2

================================================================================
4. QUE SI ENTRA EN ALCANCE
================================================================================

DOCUMENTO 37 - LOGS Y AUDITORIA:
✓ AuditLogService centralizado
✓ Tabla audit_logs en base de datos
✓ Eventos criticos: login, participacion, entrega, verificacion, dinero
✓ Contexto completo: userId, ip, timestamp, entidad, accion, antes, despues
✓ Retencion configurable
✓ Consultas de auditoria

DOCUMENTO 38 - INCIDENTES Y FRAUDE:
✓ Tabla incidents
✓ Tipos de incidente: fraude, disputa, bloqueo, alerta
✓ Estados de incidente: abierto, en_revision, resuelto, escalado
✓ Reglas de deteccion automatica
✓ Acciones de bloqueo/desbloqueo
✓ Historial de resoluciones

DOCUMENTO 39 - ADMIN PANEL:
✓ Endpoints de gestion de usuarios
✓ Endpoints de gestion de sorteos
✓ Endpoints de gestion de causas
✓ Dashboard de metricas
✓ Gestion de incidentes
✓ Gestion de configuracion

DOCUMENTO 40 - CONFIG GLOBAL:
✓ Tabla system_config
✓ Parametros por categoria
✓ Valores por defecto
✓ Cache de configuracion
✓ Recarga sin reinicio

DOCUMENTO 41 - ESCALABILIDAD:
✓ Tabla countries y country_config
✓ Tabla translations
✓ Feature flags
✓ Configuracion por pais
✓ Documentacion de cierre

================================================================================
5. QUE NO ENTRA EN ALCANCE
================================================================================

EXCLUIDO DE BLOQUE 3:

✗ Liberacion real de dinero a cuentas bancarias
  Motivo: Requiere integracion con pasarela de pagos (fuera de megaindice)

✗ KYC con proveedor externo (Veriff, Onfido)
  Motivo: Requiere contratos y credenciales externas

✗ Envio real de emails/SMS/WhatsApp
  Motivo: Requiere proveedores externos (SendGrid, Twilio)

✗ Frontend/UI del panel admin
  Motivo: Solo backend en este bloque

✗ App movil
  Motivo: Fuera de alcance del megaindice actual

✗ Integraciones con terceros
  Motivo: Requiere APIs y credenciales externas

✗ Despliegue a produccion
  Motivo: Requiere infraestructura configurada

REGLA: Todo lo que requiera servicios externos o credenciales
       queda FUERA del alcance de BLOQUE 3

================================================================================
6. RIESGOS TECNICOS Y DE ARQUITECTURA
================================================================================

RIESGO 1: Impacto en rendimiento por logging
- Descripcion: AuditLog en cada operacion puede afectar latencia
- Mitigacion: Logging asincrono via cola (BullMQ)
- Severidad: MEDIA

RIESGO 2: Volumen de datos de auditoria
- Descripcion: Tabla audit_logs puede crecer rapidamente
- Mitigacion: Politica de retencion y particionado
- Severidad: MEDIA

RIESGO 3: Falsos positivos en deteccion de fraude
- Descripcion: Reglas muy estrictas pueden bloquear usuarios legitimos
- Mitigacion: Umbrales configurables, revision manual obligatoria
- Severidad: ALTA

RIESGO 4: Complejidad de migraciones
- Descripcion: Multiples tablas nuevas pueden causar conflictos
- Mitigacion: Migraciones incrementales, backup previo
- Severidad: MEDIA

RIESGO 5: Dependencias circulares
- Descripcion: AuditLog usado por todos puede causar imports circulares
- Mitigacion: Modulo compartido independiente
- Severidad: BAJA

RIESGO 6: Regresiones en BLOQUE 1 y 2
- Descripcion: Modificaciones para integrar logging pueden romper funcionalidad
- Mitigacion: Tests existentes, no modificar logica de negocio
- Severidad: ALTA

================================================================================
7. ORDEN OBLIGATORIO DE EJECUCION
================================================================================

FASE 3.1: DOCUMENTO 37 - LOGS Y AUDITORIA
------------------------------------------
Orden interno:
1. Definir schema Prisma para audit_logs
2. Crear AuditLogService
3. Crear decorador @Auditable o interceptor
4. Integrar con servicios criticos de BLOQUE 2
5. Tests de auditoria
6. Documentar en DECISIONES_ACEPTADAS_BLOQUE3.md

Criterio de salida: Toda accion critica genera log auditable

FASE 3.2: DOCUMENTO 38 - INCIDENTES Y FRAUDE
--------------------------------------------
Orden interno:
1. Definir schema Prisma para incidents
2. Crear IncidentsService
3. Crear reglas de deteccion
4. Integrar con AuditLogService
5. Endpoints admin de incidentes
6. Tests de deteccion
7. Documentar decisiones

Criterio de salida: Incidentes se detectan y gestionan

FASE 3.3: DOCUMENTO 39 - ADMIN PANEL
------------------------------------
Orden interno:
1. Crear AdminModule centralizado
2. Endpoints de gestion de usuarios
3. Endpoints de gestion de sorteos
4. Endpoints de gestion de causas
5. Dashboard de metricas
6. Integracion con incidentes
7. Tests de endpoints admin
8. Documentar decisiones

Criterio de salida: Administradores pueden gestionar la plataforma

FASE 3.4: DOCUMENTO 40 - CONFIG GLOBAL
--------------------------------------
Orden interno:
1. Definir schema Prisma para system_config
2. Crear ConfigService global
3. Migrar valores hardcodeados a config
4. Cache de configuracion
5. Endpoints de gestion de config
6. Tests de configuracion
7. Documentar decisiones

Criterio de salida: Valores criticos son configurables sin codigo

FASE 3.5: DOCUMENTO 41 - ESCALABILIDAD
--------------------------------------
Orden interno:
1. Definir schema para countries, country_config, translations
2. Crear CountryService
3. Crear TranslationService
4. Feature flags basicos
5. Documentar cierre de megaindice
6. Revision final de arquitectura

Criterio de salida: Plataforma preparada para multi-pais

================================================================================
8. CONDICIONES PARA CONSIDERAR BLOQUE 3 "CERRADO"
================================================================================

CRITERIOS OBLIGATORIOS DE CIERRE:

[ ] DOC 37: AuditLogService implementado y funcionando
[ ] DOC 37: Acciones criticas generan logs
[ ] DOC 37: Logs consultables por admin

[ ] DOC 38: IncidentsService implementado
[ ] DOC 38: Deteccion basica de fraude activa
[ ] DOC 38: Gestion de incidentes funcional

[ ] DOC 39: Endpoints admin completos
[ ] DOC 39: Dashboard de metricas basico
[ ] DOC 39: Gestion de usuarios/sorteos/causas

[ ] DOC 40: system_config implementado
[ ] DOC 40: Valores criticos parametrizados
[ ] DOC 40: Cache de config funcionando

[ ] DOC 41: Estructura multi-pais lista
[ ] DOC 41: Feature flags basicos
[ ] DOC 41: Documentacion de cierre completa

CRITERIOS DE CALIDAD:

[ ] Sin regresiones en BLOQUE 1
[ ] Sin regresiones en BLOQUE 2
[ ] Tests de servicios nuevos
[ ] Migraciones aplicadas sin error
[ ] Codigo compila sin errores
[ ] DECISIONES_ACEPTADAS_BLOQUE3.md completo

ENTREGABLES FINALES:

[ ] Codigo en src 14.04.41/
[ ] Schema Prisma actualizado
[ ] Tests para modulos nuevos
[ ] DECISIONES_ACEPTADAS_BLOQUE3.md
[ ] Backup docset_full_backup_014_POST_BLOQUE3/

================================================================================
9. CHECKLIST DE INICIO (EJECUTAR ANTES DE EMPEZAR)
================================================================================

VERIFICACIONES PREVIAS:

[ ] DECISIONES_ACEPTADAS.md (BLOQUE 1) existe y cerrado
[ ] DECISIONES_ACEPTADAS_BLOQUE2.md existe y cerrado definitivamente
[ ] docset_full_backup_010_MAESTRO/ accesible
[ ] src 14.04.41/ compila sin errores
[ ] Migraciones Prisma sincronizadas

BACKUP OBLIGATORIO:

[ ] Crear docset_full_backup_013_PRE_BLOQUE3/
[ ] Incluir src 14.04.41/ completo
[ ] Incluir documentos de decisiones

LECTURA OBLIGATORIA:

[ ] DOCUMENTO_37_LOGS_AUDITORIA_TRAZABILIDAD.md
[ ] DOCUMENTO_38_INCIDENTES_FRAUDE_DISPUTAS.md
[ ] DOCUMENTO_39_ADMIN_PANEL_GOBERNANZA.md
[ ] DOCUMENTO_40_CONFIG_GLOBAL_PARAMETROS.md
[ ] DOCUMENTO_41_ESCALABILIDAD_CIERRE_MEGAINDICE.md

================================================================================
FIN DEL DOCUMENTO DE ARRANQUE — BLOQUE 3
================================================================================

Estado: PENDIENTE DE AUTORIZACION
Proxima accion: Usuario debe autorizar explicitamente inicio de BLOQUE 3

################################################################################
