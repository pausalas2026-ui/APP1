# DOCUMENTO 18 — GUÍA DE DESPLIEGUE

## Entornos

### Development
- Local con Docker
- Database: PostgreSQL local o Supabase dev
- Hot reload habilitado

### Staging
- Vercel Preview (frontend)
- Railway/Render (backend)
- Supabase staging project

### Production
- Vercel Production (frontend)
- Railway/Fly.io (backend)
- Supabase production project

## Variables de Entorno

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Auth
JWT_SECRET=super-secret-key-change-in-production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=xxx

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=xxx

# Storage
STORAGE_BUCKET=ilovetohelp-assets

# App
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## Docker Compose (Local)

```yaml
version: '3.8'
services:
  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001/api/v1
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ilovetohelp
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

## CI/CD Pipeline

### GitHub Actions - CI
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

### Deploy Staging
```yaml
name: Deploy Staging
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

## Migraciones Database

```bash
# Generar migración
pnpm --filter api prisma migrate dev --name nombre_migracion

# Aplicar migraciones (staging/production)
pnpm --filter api prisma migrate deploy

# Reset database (solo dev)
pnpm --filter api prisma migrate reset
```

## Comandos de Despliegue

```bash
# Build completo
pnpm build

# Deploy frontend a Vercel
vercel --prod

# Deploy backend a Railway
railway up

# Seed database
pnpm --filter api seed
```

## Checklist Pre-Deploy

### Production
- [ ] Variables de entorno configuradas
- [ ] Migraciones aplicadas
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] SSL configurado
- [ ] CORS configurado
- [ ] Rate limiting habilitado
- [ ] Logging configurado
- [ ] Monitoring activo
- [ ] Backup database configurado

## Rollback

```bash
# Revertir última migración
pnpm --filter api prisma migrate resolve --rolled-back nombre_migracion

# Rollback Vercel
vercel rollback

# Rollback Railway
railway rollback
```

## Monitoreo

- **Logs**: Vercel Logs, Railway Logs
- **Errors**: Sentry
- **Performance**: Vercel Analytics
- **Uptime**: UptimeRobot
- **Database**: Supabase Dashboard
