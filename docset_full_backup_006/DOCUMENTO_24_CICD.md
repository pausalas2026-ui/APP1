# DOCUMENTO 24 — CI/CD Y PIPELINE

## 24.1. Estrategia de Branches

### Gitflow Simplificado
```
main        → Producción (protegida)
staging     → Pre-producción
develop     → Desarrollo activo
feature/*   → Nuevas funcionalidades
bugfix/*    → Correcciones
hotfix/*    → Fixes urgentes producción
release/*   → Preparación releases
```

### Reglas de Protección
- `main`: Requiere PR + 1 approval + CI pass
- `staging`: Requiere PR + CI pass
- `develop`: CI debe pasar

## 24.2. Pipeline Principal

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: |
            apps/api/dist
            apps/web/.next

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    steps:
      - uses: actions/download-artifact@v3
      - name: Deploy to Staging
        run: |
          # Deploy API to Railway/Render staging
          # Deploy Web to Vercel preview

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/download-artifact@v3
      - name: Deploy to Production
        run: |
          # Deploy API to Railway/Render production
          # Deploy Web to Vercel production
```

## 24.3. Versionado Semántico

### Formato
```
MAJOR.MINOR.PATCH
v1.2.3
```

### Reglas
- **MAJOR**: Breaking changes
- **MINOR**: Nuevas features (backward compatible)
- **PATCH**: Bug fixes

### Automatización
```yaml
# Usando semantic-release
- name: Release
  uses: cycjimmy/semantic-release-action@v4
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## 24.4. Despliegue

### Entornos
| Entorno | Branch | URL | Auto-deploy |
|---------|--------|-----|-------------|
| Development | develop | dev.ilovetohelp.com | Sí |
| Staging | staging | staging.ilovetohelp.com | Sí |
| Production | main | ilovetohelp.com | Manual approval |

### Rollback
```bash
# Revertir a versión anterior
git revert HEAD --no-edit
git push origin main
# O restaurar tag específico
git checkout v1.2.2
```

## 24.5. Docker Build

```dockerfile
# docker/Dockerfile.api
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:api

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

## 24.6. Database Migrations

```yaml
migrate:
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Run Migrations
      run: |
        npx prisma migrate deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Reglas de Migración
- Siempre backward compatible
- No eliminar columnas en uso
- Agregar columnas como nullable primero
- Tests de migración en staging primero

## 24.7. Secrets Management

### GitHub Secrets
```
DATABASE_URL
JWT_SECRET
SUPABASE_URL
SUPABASE_SERVICE_KEY
STRIPE_SECRET_KEY
SENDGRID_API_KEY
```

### Rotación
- JWT_SECRET: Cada 90 días
- API Keys: Según proveedor
- Passwords: Cada 180 días

## 24.8. Monitoring Post-Deploy

### Health Checks
```typescript
// Endpoint /health
{
  "status": "healthy",
  "version": "1.2.3",
  "uptime": 86400,
  "database": "connected",
  "redis": "connected"
}
```

### Alertas
- Deploy fallido → Slack
- Error rate > 1% → PagerDuty
- Response time > 2s → Slack
- Database connection lost → PagerDuty

## 24.9. Feature Flags

```typescript
// Para deploys graduales
const features = {
  NEW_CHECKOUT: {
    enabled: true,
    rollout: 20, // 20% de usuarios
    plans: ['elite', 'premium'] // Solo estos planes
  }
};
```

## 24.10. Checklist Pre-Deploy

- [ ] Todos los tests pasan
- [ ] Code review aprobado
- [ ] Changelog actualizado
- [ ] Migrations probadas en staging
- [ ] Feature flags configurados
- [ ] Rollback plan documentado
- [ ] Comunicación a equipo
