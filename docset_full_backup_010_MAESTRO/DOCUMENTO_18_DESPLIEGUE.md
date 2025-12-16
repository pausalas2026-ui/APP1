# DOCUMENTO 18 — DESPLIEGUE Y CONFIGURACIÓN

## Entornos

### Development
- Local con Docker Compose
- Base de datos local o Supabase dev
- Hot reload habilitado
- Logs verbose

### Staging
- Réplica de producción
- Datos de prueba
- Testing E2E automático

### Production
- Alta disponibilidad
- Backups automáticos
- Monitoring completo
- CDN para assets

## Docker Compose (Desarrollo)

```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./apps/api:/app/apps/api
    depends_on:
      - db
      - redis

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./apps/web:/app/apps/web

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=ilovetohelp
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## Variables de Entorno

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Payments
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
SENDGRID_API_KEY=SG.xxx
EMAIL_FROM=noreply@ilovetohelp.com

# Storage
AWS_S3_BUCKET=ilovetohelp-assets
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# App
NODE_ENV=production
API_URL=https://api.ilovetohelp.com
WEB_URL=https://ilovetohelp.com
```

## Despliegue Automático

### CI/CD Pipeline
1. Push a rama → GitHub Actions
2. Lint + Tests
3. Build Docker images
4. Push a registry
5. Deploy a entorno correspondiente

### Estrategia de Branches
- `main` → Production
- `staging` → Staging
- `develop` → Development
- `feature/*` → Features
- `hotfix/*` → Hotfixes

## Supabase Conexión

```
Host: db.gzmgibwuxcpnceqqrnac.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [configurado]
```

## Backups
- Diarios automáticos (Supabase)
- Retención 30 días
- Backups manuales antes de deploys mayores

## Monitoring
- Prometheus + Grafana
- Alertas Slack/Discord
- Logs centralizados (Loki/CloudWatch)
- APM (Application Performance Monitoring)
