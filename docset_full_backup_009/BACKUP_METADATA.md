# BACKUP METADATA - docset_full_backup_008

## Información del Respaldo

| Campo | Valor |
|-------|-------|
| **Fecha de creación** | 11 de diciembre de 2025 |
| **Versión del backup** | 008 |
| **Total de documentos** | 32 archivos (Docs 0-31 + README) |
| **Estado** | COMPLETO Y VERIFICADO |

---

## Documentos Incluidos

| # | Documento | Módulo | Estado |
|---|-----------|--------|--------|
| 00 | DOCUMENTO_00_EXPLICACION_GENERAL.md | Introducción | ✅ |
| 01 | DOCUMENTO_01_BLUEPRINT.md | Blueprint | ✅ |
| 02 | DOCUMENTO_02_VISION_ESTRATEGICA.md | Visión | ✅ |
| 03 | DOCUMENTO_03_ACTORES_ROLES.md | Actores y Roles | ✅ |
| 04 | DOCUMENTO_04_MODELOS_ECONOMICOS.md | Modelo Económico | ✅ |
| 05 | DOCUMENTO_05_ARQUITECTURA.md | Arquitectura | ✅ |
| 06 | DOCUMENTO_06_MODULOS_CLAVE.md | Módulos Clave | ✅ |
| 07 | DOCUMENTO_07_TABLEROS.md | Tableros/Dashboards | ✅ |
| 08 | DOCUMENTO_08_SISTEMA_PLANES.md | Sistema de Planes | ✅ |
| 09 | DOCUMENTO_09_MOTORES_INTERNOS.md | Motores Internos | ✅ |
| 10 | DOCUMENTO_10_FLUJOS_FUNCIONALES.md | Flujos | ✅ |
| 11 | DOCUMENTO_11_PRINCIPIOS_TECNICOS.md | Principios Técnicos | ✅ |
| 12 | DOCUMENTO_12_ROADMAP.md | Roadmap | ✅ |
| 13 | DOCUMENTO_13_ADDENDUMS.md | Addendums | ✅ |
| 14 | DOCUMENTO_14_MODELO_DATOS.md | Modelo de Datos | ✅ |
| 15 | DOCUMENTO_15_ENDPOINTS.md | Endpoints API | ✅ |
| 16 | DOCUMENTO_16_IMPLEMENTACION_MOTORES.md | Implementación Motores | ✅ |
| 17 | DOCUMENTO_17_ESTRUCTURA_REPO.md | Estructura Repositorio | ✅ |
| 18 | DOCUMENTO_18_DESPLIEGUE.md | Despliegue | ✅ |
| 19 | DOCUMENTO_19_CONFIG_ADMIN.md | Config Admin | ✅ |
| 20 | DOCUMENTO_20_OPENAPI.md | OpenAPI Base | ✅ |
| 21 | DOCUMENTO_21_OPENAPI_COMPLETO.md | OpenAPI Completo | ✅ |
| 22 | DOCUMENTO_22_SEGURIDAD.md | Seguridad | ✅ |
| 23 | DOCUMENTO_23_TESTING.md | Testing | ✅ |
| 24 | DOCUMENTO_24_CICD.md | CI/CD | ✅ |
| 25 | DOCUMENTO_25_INICIO_IMPLEMENTACION.md | Inicio Implementación | ✅ |
| 26 | DOCUMENTO_26_FASE1_AUTH_USERS_PLANS.md | FASE 1: Auth/Users/Plans | ✅ |
| 27 | DOCUMENTO_27_FASE2_MARKETPLACE_PRODUCTOS.md | FASE 2: Marketplace | ✅ |
| 28 | DOCUMENTO_28_FASE3_MOTOR_ECONOMICO.md | FASE 3: Motor Económico | ✅ |
| 29 | DOCUMENTO_29_SISTEMA_SORTEOS_EXTERNO.md | Módulo 0.a.20: Sorteos | ✅ |
| 30 | DOCUMENTO_30_PREFERENCIAS_DASHBOARD.md | Módulo 0.a.21: Preferencias | ✅ |
| 31 | DOCUMENTO_31_ANUNCIOS_DINAMICOS.md | Módulo 0.a.22: Anuncios | ✅ |

---

## Configuración Técnica Consolidada

### Stack Tecnológico
- **Frontend**: Next.js + TypeScript + TailwindCSS
- **Backend**: NestJS (Node.js)
- **Base de datos**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: JWT + Refresh Tokens + Argon2id

### Credenciales Supabase
- **Host**: db.gzmgibwuxcpnceqqrnac.supabase.co
- **User**: postgres
- **Password**: Mikasalas2

### Arquitectura
- Monorepo con pnpm workspaces
- apps/web, apps/admin-web
- services/api, services/lottery-engine
- packages/core, packages/types, packages/config, packages/ui

---

## Reglas Críticas del Sistema

### MLM - EXACTAMENTE 2 NIVELES
- **N1 (Promotor)**: 70% de comisión
- **N2 (Affiliator)**: 30% de comisión
- **NO EXISTE NIVEL 3**

### Planes y Multiplicadores
| Plan | Multiplicador |
|------|---------------|
| Free | 5% |
| Pro | 30% |
| Premium | 70% |
| Elite | 100% |

### Modelo de 4 Actores
1. Plataforma
2. Promotor
3. Generador de causa
4. Causa destino

---

## Estado de Implementación

| Fase | Descripción | Estado |
|------|-------------|--------|
| Documentación | Docs 0-31 recibidos | ✅ COMPLETO |
| FASE 1 | Estructura monorepo | ⏸️ EN ESPERA |
| FASE 2 | Config Node + TS | ⏸️ EN ESPERA |
| FASE 3 | NestJS Backend | ⏸️ EN ESPERA |
| FASE 4 | Next.js Frontend | ⏸️ EN ESPERA |
| FASE 5 | Packages compartidos | ⏸️ EN ESPERA |
| FASE 6 | OpenAPI spec | ⏸️ EN ESPERA |
| FASE 7 | Testing básico | ⏸️ EN ESPERA |
| FASE 8 | CI/CD básico | ⏸️ EN ESPERA |

---

## Instrucciones Acumuladas

1. NO iniciar implementación hasta recibir todos los documentos
2. Realizar backups después de cada submódulo
3. Seguir documentos al 100% sin interpretaciones libres
4. Generar addendums retroactivos cuando un módulo impacte otros
5. NO hardcodear porcentajes - usar admin_settings
6. MLM es EXACTAMENTE 2 niveles - nunca crear nivel 3
7. Motor de sorteos DEBE ser microservicio independiente
8. Todos los IDs con HMAC-256 para sorteos

---

**VERSION: BACKUP_008_COMPLETE**
**Timestamp: 2025-12-11**
