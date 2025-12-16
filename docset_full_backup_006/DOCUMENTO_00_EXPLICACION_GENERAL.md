# DOCUMENTO 0 — EXPLICACIÓN GENERAL

## ¿Qué es "I Love to Help"?

Plataforma híbrida que combina:
- **Marketplace solidario** con productos/servicios
- **Sistema de donaciones** integrado en cada transacción
- **Causas y campañas** sociales verificadas
- **MLM de 2 niveles** (N1 Promotor + N2 Afiliador) — NUNCA N3
- **Sorteos y premios** vinculados a donaciones
- **Sistema de planes** (Free 5%, Pro 30%, Premium 70%, Elite 100%)

## Principios Fundamentales

1. **Todo cálculo económico SOLO en Motor Económico**
2. **Transacciones inmutables** — nunca modificar, solo crear nuevas
3. **MLM = 2 niveles exactos** — N1 y N2, prohibido N3
4. **Aprobación admin obligatoria** para productos, premios, sorteos
5. **Validaciones SIEMPRE en backend** — frontend solo UX
6. **Causas siempre tienen destino** — toda donación va a causa válida

## Stack Tecnológico

- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + Refresh Tokens
- **Cache**: Redis
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions

## Conexión Supabase

```
Host: db.gzmgibwuxcpnceqqrnac.supabase.co
Database: postgres
User: postgres
Port: 5432
```
