# I Love to Help - Backup Documental Completo

## Versión: docset_full_backup_008
**Fecha**: 14 de diciembre de 2025
**Estado**: DOCUMENTO 32 COMPLETADO — Reglas de Producto ANCLA

---

## Índice de Documentos

| Doc | Título | Descripción |
|-----|--------|-------------|
| 00 | Explicación General | Visión del proyecto, conceptos clave |
| 01 | Blueprint | Arquitectura conceptual completa |
| 02 | Visión Estratégica | Objetivos y diferenciadores |
| 03 | Actores y Roles | Users, Promoters, Creators, Admins |
| 04 | Modelos Económicos | Comisiones, MLM (N1+N2), donaciones |
| 05 | Arquitectura | 6 capas, infraestructura |
| 06 | Módulos Clave | Usuarios, productos, causas, sorteos |
| 07 | Tableros | Dashboards por rol |
| 08 | Sistema de Planes | Free/Pro/Premium/Elite |
| 09 | Motores Internos | 10 engines del sistema |
| 10 | Flujos Funcionales | Registro, compra, donación |
| 11 | Principios Técnicos | 10 reglas inquebrantables |
| 12 | Roadmap | 15 semanas de implementación |
| 13 | Addendums | Fórmulas, estados, códigos |
| 14 | Modelo de Datos | 20 tablas SQL completas |
| 15 | Endpoints | ~53 endpoints API REST |
| 16 | Implementación Motores | Código TypeScript referencia |
| 17 | Estructura Repo | Monorepo arquitectura |
| 18 | Despliegue | Docker, variables, CI/CD |
| 19 | Config Admin | Panel admin, settings |
| 20 | OpenAPI | Especificación resumen |
| 21 | OpenAPI Completo | 53 endpoints expandidos |
| 22 | Seguridad | Auth, validaciones, anti-fraude |
| 23 | Testing | Unit, integration, E2E, QA |
| 24 | CI/CD | Pipeline, versioning, deploy |
| 25 | Inicio Implementación | Guía paso a paso para crear el proyecto |
| 26 | Fase 1 Auth Users Plans | Implementación Auth, Users, Plans |
| 27 | Fase 2 Marketplace | Marketplace, Productos, Promociones |
| 28 | Fase 3 Motor Económico | Motor Económico Universal |
| 29 | Sistema Sorteos Externo | Microservicio sorteos independiente |
| 30 | Preferencias Dashboard | Sistema preferencias y ordenamiento |
| 31 | Anuncios Dinámicos | Sistema anuncios en dashboard |
| **32** | **Reglas Producto ANCLA** | **Límites NO negociables, antifraude, sorteos ≠ ecommerce** |
| **33** | **KYC y Verificación** | **Sistema verificación identidad, liberación fondos, antifraude** |

---

## Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + Refresh Tokens
- **Cache**: Redis
- **Testing**: Jest + Supertest + Cypress
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel (web) + Railway (api)

---

## Reglas Críticas

1. **MLM = 2 NIVELES EXACTOS** (N1 + N2, nunca N3)
2. **Todo cálculo de dinero en Motor Económico**
3. **Transacciones inmutables**
4. **Free NO crea productos/premios/tienda**
5. **Aprobación admin obligatoria**
6. **Validaciones SIEMPRE en backend**
7. **SORTEOS ≠ ECOMMERCE** (Doc 32 - ANCLA)
8. **Sin evidencia = Sin dinero** (antifraude)
9. **Causa social SIEMPRE obligatoria**

---

## Conexión Supabase

```
Host: db.gzmgibwuxcpnceqqrnac.supabase.co
Database: postgres
User: postgres
Port: 5432
```

---

## Estado Actual

✅ **DOCUMENTO 33 COMPLETADO** — KYC, Verificación y Liberación de Fondos

**Documentos ANCLA del proyecto:**
- **Doc 32**: Sorteos ≠ Ecommerce, límites NO negociables
- **Doc 33**: Sin verificación = Sin dinero (pero la app sigue funcionando)

---

## Reglas Críticas de Dinero (Doc 33)

1. **NADIE recibe dinero sin verificación**
2. **NADIE está obligado a verificarse para usar la app**
3. **KYC solo se pide cuando hay evento disparador**
4. **Fondos retenidos hasta verificación completa**
5. **Checklist obligatorio antes de liberar**

---

## Backups Anteriores Preservados

- /docs/backup/ (Docs 0-20)
- /backups/docset_full_backup_002/ (Docs 0-21)
- /backups/docset_full_backup_004/ (Docs 0-24)
- /backups/docset_full_backup_006/ (Docs 0-25)
- /backups/docset_full_backup_007/ (Docs 0-31)
- /backups/docset_full_backup_008/ (Docs 0-33) ← ACTUAL

---

```
VERSION: DOCUMENTO_33_DEFINITIVO
CHECKPOINT: DOCUMENTO_33_DEFINITIVO
```

## Backups Anteriores Preservados

- /docs/backup/ (Docs 0-20)
- /backups/docset_full_backup_002/ (Docs 0-21)
- /backups/docset_full_backup_004/ (Docs 0-24)
- /backups/docset_full_backup_006/ (Docs 0-25) ← ACTUAL
