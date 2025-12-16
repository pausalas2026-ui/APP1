# I LOVE TO HELP - Backup Completo de Documentación
## docset_full_backup_002

### Fecha de Backup
11 de diciembre de 2025

### Contenido del Backup

| # | Documento | Descripción |
|---|-----------|-------------|
| 00 | DOCUMENTO_00_EXPLICACION_GENERAL.md | Explicación general del proyecto |
| 01 | DOCUMENTO_01_BLUEPRINT.md | Blueprint arquitectónico |
| 02 | DOCUMENTO_02_VISION_ESTRATEGICA.md | Visión y estrategia |
| 03 | DOCUMENTO_03_ACTORES_ROLES.md | Actores y roles del sistema |
| 04 | DOCUMENTO_04_MODELOS_ECONOMICOS.md | Modelos económicos |
| 05 | DOCUMENTO_05_ARQUITECTURA.md | Arquitectura técnica (6 capas) |
| 06 | DOCUMENTO_06_MODULOS_CLAVE.md | Módulos principales |
| 07 | DOCUMENTO_07_TABLEROS.md | Dashboards por rol |
| 08 | DOCUMENTO_08_SISTEMA_PLANES.md | Sistema de planes (Free/Pro/Premium/Elite) |
| 09 | DOCUMENTO_09_MOTORES_INTERNOS.md | 10 motores del sistema |
| 10 | DOCUMENTO_10_FLUJOS_FUNCIONALES.md | Flujos funcionales |
| 11 | DOCUMENTO_11_PRINCIPIOS_TECNICOS.md | Principios técnicos |
| 12 | DOCUMENTO_12_ROADMAP.md | Roadmap del proyecto (12 sprints) |
| 13 | DOCUMENTO_13_ADDENDUMS.md | Addendums y clarificaciones |
| 14 | DOCUMENTO_14_MODELO_DATOS.md | Modelo de datos (20 tablas) |
| 15 | DOCUMENTO_15_ENDPOINTS.md | Endpoints API REST |
| 16 | DOCUMENTO_16_IMPLEMENTACION_MOTORES.md | Implementación de motores |
| 17 | DOCUMENTO_17_ESTRUCTURA_REPO.md | Estructura del repositorio (monorepo) |
| 18 | DOCUMENTO_18_DESPLIEGUE.md | Guía de despliegue |
| 19 | DOCUMENTO_19_CONFIG_ADMIN.md | Configuración admin y MLM |
| 20 | DOCUMENTO_20_OPENAPI.md | OpenAPI base (schemas) |
| 21 | DOCUMENTO_21_OPENAPI_COMPLETO.md | **OpenAPI completo (~53 endpoints)** |

### Elementos Incluidos

#### Modelos de Datos
- 20 tablas: users, user_roles, user_plans_history, products, product_images, product_inventory, causes, campaigns, transactions, donations, commissions, affiliates, prizes, raffles, raffle_entries, raffle_winners, tracking_events, audit_logs, notifications, settings

#### Motores de Negocio
1. Motor Económico Universal
2. Motor de Comisiones/MLM
3. Motor de Donaciones
4. Motor de Causas
5. Motor de Marketplace
6. Motor de Sorteos
7. Motor de Feed
8. Motor de Auditoría
9. Motor de Planes
10. Motor de Notificaciones

#### Reglas MLM
- MÁXIMO 2 niveles (N1: Promotor, N2: Afiliador)
- NO existe nivel 3
- Multiplicadores por plan: Free 5%, Pro 30%, Premium 70%, Elite 100%
- N2 siempre 1% fijo

#### Configuración Económica
- Platform fee: 10%
- Default donation: 5%
- Commission rate N1: 5%
- Commission rate N2: 1%

### Backups Anteriores
- `/docs/backup/` - Backup inicial (Docs 0-20)

### Estado
✅ Backup completado para Documentos 0-21
⏳ Esperando Documentos 22-25:
  - Doc 22: Reglas avanzadas de seguridad
  - Doc 23: Pruebas unitarias e integración
  - Doc 24: CI/CD automatizado
  - Doc 25: Anexos de negocio

### 🚫 IMPORTANTE
**NO SE DEBE GENERAR CÓDIGO** hasta:
1. Recibir todos los documentos faltantes (22-25)
2. Recibir instrucción explícita del usuario

### Credenciales Supabase (Referencia)
- Host: db.gzmgibwuxcpnceqqrnac.supabase.co
- User: postgres
- Port: 5432
- Database: postgres
