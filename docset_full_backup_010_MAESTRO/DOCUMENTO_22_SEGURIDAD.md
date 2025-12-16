# DOCUMENTO 22 — SEGURIDAD AVANZADA

## 22.1. Autenticación y Tokens

### JWT Configuration
- Access Token: 15 minutos - 1 hora
- Refresh Token: 7-30 días
- Rotación automática de refresh tokens
- Blacklist de tokens revocados

### Validaciones
- Email verification obligatorio
- Rate limiting por IP y usuario
- Detección de intentos de fuerza bruta
- Bloqueo temporal tras N intentos fallidos

## 22.2. Autorización por Capas

### Capa 1: Autenticación
- JWT válido y no expirado
- Usuario no bloqueado

### Capa 2: Roles
```typescript
@Roles('admin', 'promoter')
@UseGuards(RolesGuard)
```

### Capa 3: Planes
```typescript
@RequirePlan('pro', 'premium', 'elite')
@UseGuards(PlanGuard)
```

### Capa 4: Ownership
- Verificar que el recurso pertenece al usuario
- O que tiene permisos de admin

## 22.3. Validación de Datos

### Backend Validation
```typescript
class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  commission_total: number;
}
```

### Sanitización
- Escape de HTML/XSS
- SQL injection prevention (Prisma)
- Path traversal prevention

## 22.4. Control de Errores

### Error Responses Estándar
```typescript
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/users"
}
```

### Códigos de Error Internos
```
AUTH_001: Token inválido
AUTH_002: Token expirado
AUTH_003: Usuario bloqueado
AUTH_004: Email no verificado
PLAN_001: Plan insuficiente
PLAN_002: Límite alcanzado
ECON_001: Transacción fallida
ECON_002: Saldo insuficiente
```

## 22.5. Anti-Fraude

### Detección de Patrones
- Auto-referidos (mismo dispositivo/IP)
- Transacciones sospechosas
- Cambios de plan abusivos
- Múltiples cuentas

### Medidas
- Verificación adicional
- Bloqueo temporal
- Revisión manual
- Notificación a admin

## 22.6. Auditoría de Seguridad

### Eventos Auditados
- Login/logout
- Cambios de password
- Cambios de rol/plan
- Transacciones económicas
- Accesos admin
- Errores de autorización

### Formato de Log
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "actor_id": "uuid",
  "action": "USER_LOGIN",
  "ip": "192.168.1.1",
  "user_agent": "...",
  "success": true,
  "metadata": {}
}
```

## 22.7. Headers de Seguridad

```typescript
// Helmet.js configuration
app.use(helmet({
  contentSecurityPolicy: true,
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: true,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: true,
  xssFilter: true,
}));
```

## 22.8. Rate Limiting

```typescript
// Por endpoint
@Throttle(60, 60) // 60 requests per minute
@Get('products')
async getProducts() {}

// Por plan
const limits = {
  free: 60,
  pro: 120,
  premium: 300,
  elite: 600
};
```

## 22.9. CORS Configuration

```typescript
app.enableCors({
  origin: ['https://ilovetohelp.com', 'https://app.ilovetohelp.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 86400,
});
```

## 22.10. Encriptación

- Passwords: bcrypt (cost factor 12)
- Datos sensibles: AES-256
- Comunicación: TLS 1.3
- Tokens: signed + encrypted
