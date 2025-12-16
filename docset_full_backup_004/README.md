# I Love to Help - Backup Documental Completo

## Versión: docset_full_backup_004
**Fecha**: Documentos 0-24 completos
**Estado**: Pre-implementación

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

---

## Conexión Supabase

```
Host: db.gzmgibwuxcpnceqqrnac.supabase.co
Database: postgres
User: postgres
Port: 5432
```

---

## Próximo Paso

Esperando **DOCUMENTO 25 - INICIO DE IMPLEMENTACIÓN** para comenzar codificación.

**⚠️ NO iniciar código sin autorización explícita.**
