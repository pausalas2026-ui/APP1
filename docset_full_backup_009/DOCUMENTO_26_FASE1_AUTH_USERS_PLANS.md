# DOCUMENTO 26 — IMPLEMENTACIÓN FASE 1 (AUTH, USERS, PLANS)

## Propósito
Guía completa de implementación real para el backend: Autenticación, Usuarios y Planes.

## Estructura de Carpetas (services/api)

```
services/api/src/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.dto.ts
      auth.module.ts
    users/
      users.controller.ts
      users.service.ts
      users.dto.ts
      users.module.ts
    plans/
      plans.controller.ts
      plans.service.ts
      plans.dto.ts
      plans.module.ts
  middlewares/
    auth.middleware.ts
  guards/
    role.guard.ts
    plan.guard.ts
  infrastructure/
    orm/
      prisma.service.ts
```

## AUTH — DTOs

```typescript
export class RegisterDTO {
  email: string;
  password: string;
  name: string;
  referral_code?: string | null;
}

export class LoginDTO {
  email: string;
  password: string;
}

export class RefreshTokenDTO {
  refresh_token: string;
}
```

## AUTH — Service

### Registro
```typescript
const hashedPassword = await argon2.hash(dto.password);

const user = await prisma.user.create({
  data: {
    email: dto.email,
    password: hashedPassword,
    name: dto.name,
    referred_by: inviter?.id ?? null,
    roles: ['promoter', 'buyer'],
    plan_type: 'free'
  }
});
```

### Login
```typescript
const user = await prisma.user.findUnique({ where: { email: dto.email } });
if (!user) throw new AuthError("INVALID_CREDENTIALS");

const valid = await argon2.verify(user.password, dto.password);
if (!valid) throw new AuthError("INVALID_CREDENTIALS");

return this.generateTokens(user);
```

### Refresh Token
- Verificar token válido y no expirado
- Regenerar access_token
- Rotar refresh_token

## USERS — Endpoints

### GET /users/me
Devuelve: id, email, name, phone, roles, plan_type, donation_preference

### PUT /users/me
Validaciones: name (string), phone (opcional)
NO permitir modificar plan_type ni roles

### PUT /users/me/donation-preference
```typescript
if (dto.donation_percentage < 0 || dto.donation_percentage > 100)
  throw new ValidationError();

await prisma.user.update({
  where: { id: userId },
  data: { donation_preference: dto.donation_percentage }
});
```

## PLANS — Capabilities

```typescript
export const PLAN_CAPABILITIES = {
  free: {
    can_create_products: false,
    can_create_prizes: false,
    commission_multiplier: 0.05
  },
  pro: {
    can_create_products: true,
    can_create_prizes: false,
    commission_multiplier: 0.30
  },
  premium: {
    can_create_products: true,
    can_create_prizes: true,
    commission_multiplier: 0.70
  },
  elite: {
    can_create_products: true,
    can_create_prizes: true,
    commission_multiplier: 1.00
  }
};
```

### GET /plans/me
Devuelve: plan_type, capabilities

### POST /plans/change
- Validar plan destino existe
- Crear registro en user_plan_history
- Cambiar plan a "pending_activation"
- Responder "Pendiente de pago"

## Testing Obligatorio

- Test auth.controller responde a rutas
- Test registro básico
- Test login credenciales inválidas
- Test login credenciales válidas
- Test /users/me (requiere auth)
- Test /plans/me

Cobertura mínima: 60%
