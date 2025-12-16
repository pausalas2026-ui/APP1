# DOCUMENTO 17 — ESTRUCTURA DEL REPOSITORIO

## Monorepo Structure

```
APP1/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── deploy-staging.yml
│       └── deploy-production.yml
│
├── apps/
│   ├── web/                    # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/           # App Router
│   │   │   │   ├── (auth)/    # Rutas autenticación
│   │   │   │   ├── (public)/  # Rutas públicas
│   │   │   │   ├── (dashboard)/ # Paneles por rol
│   │   │   │   ├── api/       # API Routes (proxy)
│   │   │   │   └── layout.tsx
│   │   │   ├── components/
│   │   │   │   ├── ui/        # Componentes base
│   │   │   │   ├── forms/     # Formularios
│   │   │   │   ├── layout/    # Layout components
│   │   │   │   └── features/  # Por feature
│   │   │   ├── hooks/
│   │   │   ├── lib/
│   │   │   ├── stores/        # Zustand stores
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   └── package.json
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── users/
│       │   │   ├── products/
│       │   │   ├── transactions/
│       │   │   ├── donations/
│       │   │   ├── causes/
│       │   │   ├── commissions/
│       │   │   ├── raffles/
│       │   │   ├── prizes/
│       │   │   ├── notifications/
│       │   │   └── admin/
│       │   ├── engines/        # Motores de negocio
│       │   │   ├── economic.engine.ts
│       │   │   ├── commission.engine.ts
│       │   │   ├── donation.engine.ts
│       │   │   ├── raffle.engine.ts
│       │   │   ├── audit.engine.ts
│       │   │   └── index.ts
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   ├── decorators/
│       │   │   ├── filters/
│       │   │   ├── interceptors/
│       │   │   └── pipes/
│       │   ├── config/
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── shared/                 # Código compartido
│   │   ├── types/             # TypeScript types
│   │   ├── constants/         # Constantes
│   │   ├── utils/             # Utilidades
│   │   └── validators/        # Validadores Zod
│   │
│   ├── ui/                    # Design system
│   │   ├── components/
│   │   ├── styles/
│   │   └── package.json
│   │
│   └── config/                # Configs compartidas
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── services/
│   ├── email/                 # Servicio emails
│   ├── storage/               # Servicio storage
│   └── payments/              # Servicio pagos
│
├── docs/
│   ├── backup/               # Documentación backup
│   ├── api/                  # OpenAPI specs
│   └── guides/               # Guías desarrollo
│
├── scripts/
│   ├── setup.sh
│   ├── seed.ts
│   └── deploy.sh
│
├── docker/
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── docker-compose.yml
│
├── .env.example
├── .gitignore
├── package.json              # Root package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Convenciones de Nombres

### Archivos
- Componentes: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utils: `camelCase.ts`
- Types: `PascalCase.types.ts`
- Constants: `SCREAMING_SNAKE.ts`
- Tests: `*.spec.ts` o `*.test.ts`

### Carpetas
- Siempre `kebab-case`
- Features agrupadas por dominio

### Variables
- Variables: `camelCase`
- Constantes: `SCREAMING_SNAKE`
- Types/Interfaces: `PascalCase`
- Enums: `PascalCase`

## Dependencias Principales

### Frontend (apps/web)
```json
{
  "next": "14.x",
  "react": "18.x",
  "typescript": "5.x",
  "tailwindcss": "3.x",
  "zustand": "4.x",
  "react-query": "5.x",
  "zod": "3.x",
  "react-hook-form": "7.x"
}
```

### Backend (apps/api)
```json
{
  "@nestjs/core": "10.x",
  "@nestjs/jwt": "10.x",
  "@prisma/client": "5.x",
  "prisma": "5.x",
  "class-validator": "0.14.x",
  "class-transformer": "0.5.x",
  "bcrypt": "5.x"
}
```

### Monorepo Tools
```json
{
  "turbo": "1.x",
  "pnpm": "8.x"
}
```
