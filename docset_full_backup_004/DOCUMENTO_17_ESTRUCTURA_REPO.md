# DOCUMENTO 17 — ESTRUCTURA DEL REPOSITORIO

## Monorepo Structure

```
ilovetohelp/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # App Router
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── causes/
│   │   │   │   ├── products/
│   │   │   │   ├── donations/
│   │   │   │   ├── commissions/
│   │   │   │   ├── raffles/
│   │   │   │   ├── notifications/
│   │   │   │   └── admin/
│   │   │   ├── engines/
│   │   │   │   ├── economic/
│   │   │   │   ├── commission/
│   │   │   │   ├── cause/
│   │   │   │   ├── raffle/
│   │   │   │   ├── feed/
│   │   │   │   ├── plan-rules/
│   │   │   │   ├── audit/
│   │   │   │   └── notification/
│   │   │   ├── common/
│   │   │   │   ├── decorators/
│   │   │   │   ├── guards/
│   │   │   │   ├── interceptors/
│   │   │   │   ├── filters/
│   │   │   │   └── pipes/
│   │   │   ├── config/
│   │   │   └── main.ts
│   │   ├── test/
│   │   └── package.json
│   │
│   └── mobile/                 # React Native (futuro)
│
├── packages/
│   ├── database/               # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   ├── shared/                 # Tipos compartidos
│   │   ├── src/
│   │   │   ├── types/
│   │   │   ├── constants/
│   │   │   └── utils/
│   │   └── package.json
│   │
│   └── ui/                     # Componentes compartidos
│       ├── src/
│       └── package.json
│
├── services/
│   ├── email/                  # Servicio email
│   ├── storage/                # Servicio archivos
│   └── queue/                  # Servicio colas
│
├── docs/                       # Documentación
│   └── backup/
│
├── scripts/                    # Scripts utilidad
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   └── docker-compose.yml
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── package.json                # Root package
├── turbo.json                  # Turborepo config
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc
└── README.md
```

## Convenciones de Archivos

### Backend (NestJS)
```
modules/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
│   ├── create-user.dto.ts
│   └── update-user.dto.ts
├── entities/
│   └── user.entity.ts
└── users.spec.ts
```

### Frontend (Next.js)
```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── page.tsx
├── (marketplace)/
│   └── page.tsx
└── layout.tsx
```

## Comandos Principales
```bash
npm run dev           # Desarrollo
npm run build         # Build producción
npm run test          # Tests
npm run lint          # Linting
npm run db:migrate    # Migraciones
npm run db:seed       # Seed datos
```
