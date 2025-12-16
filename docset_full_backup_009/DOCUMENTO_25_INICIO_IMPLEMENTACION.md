# DOCUMENTO 25 — INICIO CONTROLADO DE IMPLEMENTACIÓN

## Propósito
Guía paso a paso para crear el repositorio, estructura y código base sin romper nada.

## FASE 0: REGLAS GENERALES
- Autorizado a iniciar creación del proyecto
- SOLO siguiendo las fases de este documento, en orden
- Respetar 100% todos los documentos 0–24
- No implementar lógica económica, MLM o sorteos "de memoria"
- Commits limpios y pequeños
- Verificar que todo compila
- Mantener repo en estado "verde"

## FASE 1: CREACIÓN DEL REPOSITORIO Y MONOREPO

### 1.1 Estructura de monorepo
```
ilovetohelp/
├── apps/
│   ├── web/
│   └── admin-web/
├── services/
│   └── api/
├── packages/
│   ├── core/
│   ├── types/
│   ├── config/
│   └── ui/
├── infra/
│   ├── docker/
│   └── scripts/
└── docs/
    ├── openapi/
    └── blueprint/
```

## FASE 2: CONFIGURACIÓN BÁSICA (NODE + TS)

### 2.1 package.json raíz con workspaces
### 2.2 tsconfig.base.json
### 2.3 ESLint / Prettier

## FASE 3: SCAFFOLDING DEL BACKEND (services/api)

### 3.1 Crear proyecto NestJS
### 3.2 Vincular con tsconfig.base.json
### 3.3 Crear módulos vacíos:
- auth, users, products, causes, donations
- commissions, raffles, admin, dashboard

## FASE 4: SCAFFOLDING DEL FRONTEND (apps/web)

### 4.1 Crear proyecto Next.js + TypeScript + Tailwind
### 4.2 Conectar alias de imports
### 4.3 Estructura mínima de páginas:
- Landing: /
- Login: /login
- Dashboard: /dashboard
- Admin: /admin

## FASE 5: CREAR LOS PAQUETES COMPARTIDOS

### 5.1 packages/core — Motores (esqueleto)
- EconomicEngineService
- CommissionEngine
- DonationEngine
- CauseEngine
- MarketplaceEngine
- RaffleEngine
- FeedEngine
- PlanRules
- AuditLogService
- NotificationService

### 5.2 packages/types — modelos y DTOs base
### 5.3 packages/config — constantes y reglas
### 5.4 packages/ui — componentes base

## FASE 6: OPENAPI REAL

### docs/openapi/openapi-ilovetohelp.yaml
- Todos los paths, esquemas y respuestas
- Basado en Documentos 20 y 21

## FASE 7: TESTING BÁSICO

- Configurar Jest
- Al menos un test por módulo crítico
- Verificar estructura montada

## FASE 8: PRIMER WORKFLOW CI MÍNIMO

### .github/workflows/ci-basic.yml
- Checkout
- Instalación dependencias
- Lint
- Type-check
- Tests básicos

## CHECKLIST FINAL

- [ ] Backup docset_full_backup_006 creado
- [ ] Estructura monorepo apps/, services/, packages/, infra/, docs/
- [ ] services/api arranca con /health
- [ ] apps/web arranca con landing placeholder
- [ ] packages/core tiene clases de motores definidas
- [ ] docs/openapi/openapi-ilovetohelp.yaml existe y es válido
- [ ] Jest configurado con al menos un test
- [ ] Workflow CI básico creado

## SIGUIENTE DOCUMENTO

**Documento 26**: Guía de implementación Fase 1 de lógica real (Auth + Users + Plans)
