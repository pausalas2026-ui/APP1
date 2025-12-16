# DOCUMENTO 1 — BLUEPRINT ARQUITECTÓNICO

## Visión del Sistema

I Love to Help es una plataforma que conecta:
- Compradores que quieren apoyar causas
- Promotores que difunden productos y ganan comisiones
- Creadores de productos que ofrecen artículos
- Generadores de causas que recaudan fondos
- Administradores que supervisan todo

## Flujo Principal

```
[Comprador] → [Producto] → [Carrito + Donación] → [Pago]
                              ↓
              [Motor Económico procesa TODO]
                              ↓
    ┌─────────────┬─────────────┬─────────────┐
    ↓             ↓             ↓             ↓
[Vendedor]  [Promotor N1]  [Afiliador N2]  [Causa]
  recibe      comisión       comisión      donación
```

## Arquitectura 6 Capas

1. **Presentación** — UI/UX (Next.js, React Native)
2. **Comunicación** — API REST + Auth JWT
3. **Lógica** — 10 Motores internos (CEREBRO)
4. **Persistencia** — PostgreSQL + Redis + Prisma
5. **Servicios Externos** — Pagos, Email, SMS, Storage
6. **Infraestructura** — Docker, CDN, Monitoring

## Entidades Principales (20 tablas)

users, user_roles, user_plans_history, products, product_images, 
product_inventory, causes, campaigns, transactions, donations, 
commissions, affiliates, prizes, raffles, raffle_entries, 
raffle_winners, tracking_events, audit_logs, notifications, settings
