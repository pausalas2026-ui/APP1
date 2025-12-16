# DOCUMENTO 21 — OPENAPI COMPLETO

## Endpoints Expandidos (~53 endpoints)

### AUTH (8 endpoints)
```yaml
/auth/register:
  post:
    summary: Registro de usuario
    requestBody:
      content:
        application/json:
          schema:
            type: object
            required: [email, password, name]
            properties:
              email: { type: string }
              password: { type: string }
              name: { type: string }
              referral_code: { type: string }

/auth/login:
  post:
    summary: Iniciar sesión
    responses:
      200:
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token: { type: string }
                refresh_token: { type: string }
                user: { $ref: '#/components/schemas/User' }

/auth/refresh:
  post:
    summary: Renovar tokens

/auth/logout:
  post:
    summary: Cerrar sesión

/auth/verify-email:
  post:
    summary: Verificar email

/auth/forgot-password:
  post:
    summary: Solicitar reset password

/auth/reset-password:
  post:
    summary: Resetear password

/auth/me:
  get:
    summary: Usuario actual
```

### USERS (7 endpoints)
```yaml
/users/me:
  get:
    summary: Perfil actual
  patch:
    summary: Actualizar perfil

/users/{id}:
  get:
    summary: Ver usuario público

/users/me/dashboard:
  get:
    summary: Datos dashboard

/users/me/affiliates:
  get:
    summary: Mis afiliados N1 y N2

/users/me/commissions:
  get:
    summary: Mis comisiones

/users/me/cause:
  post:
    summary: Cambiar causa activa
```

### PLANS (5 endpoints)
```yaml
/plans:
  get:
    summary: Listar planes disponibles

/plans/{type}:
  get:
    summary: Detalle de plan

/plans/upgrade:
  post:
    summary: Upgrade de plan

/plans/downgrade:
  post:
    summary: Downgrade de plan

/users/me/plan-history:
  get:
    summary: Historial de planes
```

### CAUSES (6 endpoints)
```yaml
/causes:
  get:
    summary: Listar causas activas
  post:
    summary: Crear causa

/causes/{id}:
  get:
    summary: Detalle causa
  patch:
    summary: Editar causa

/causes/{id}/campaigns:
  get:
    summary: Campañas de la causa

/causes/{id}/stats:
  get:
    summary: Estadísticas de la causa
```

### CAMPAIGNS (4 endpoints)
```yaml
/campaigns:
  get:
    summary: Listar campañas
  post:
    summary: Crear campaña

/campaigns/{id}:
  get:
    summary: Detalle campaña
  patch:
    summary: Editar campaña
```

### PRODUCTS (7 endpoints)
```yaml
/products:
  get:
    summary: Catálogo público
  post:
    summary: Crear producto (Pro+)

/products/{id}:
  get:
    summary: Detalle producto
  patch:
    summary: Editar producto
  delete:
    summary: Archivar producto

/products/me:
  get:
    summary: Mis productos

/products/{id}/promote:
  post:
    summary: Generar enlace promoción
```

### MARKETPLACE (3 endpoints)
```yaml
/marketplace:
  get:
    summary: Feed productos

/marketplace/featured:
  get:
    summary: Productos destacados

/marketplace/search:
  get:
    summary: Buscar productos
```

### DONATIONS (4 endpoints)
```yaml
/donations:
  post:
    summary: Donar directamente

/donations/cart:
  post:
    summary: Donación desde carrito

/donations/me:
  get:
    summary: Mis donaciones

/donations/{id}:
  get:
    summary: Detalle donación
```

### TRANSACTIONS (3 endpoints)
```yaml
/transactions/purchase:
  post:
    summary: Comprar producto

/transactions/me:
  get:
    summary: Mis transacciones

/transactions/{id}:
  get:
    summary: Detalle transacción
```

### COMMISSIONS (4 endpoints)
```yaml
/commissions/me:
  get:
    summary: Todas mis comisiones

/commissions/me/pending:
  get:
    summary: Comisiones pendientes

/commissions/me/available:
  get:
    summary: Comisiones disponibles para retiro

/commissions/withdraw:
  post:
    summary: Solicitar retiro
```

### PRIZES & RAFFLES (9 endpoints)
```yaml
/prizes:
  get:
    summary: Listar premios
  post:
    summary: Crear premio (Premium+)

/prizes/{id}:
  get:
    summary: Detalle premio

/raffles:
  get:
    summary: Listar sorteos
  post:
    summary: Crear sorteo

/raffles/{id}:
  get:
    summary: Detalle sorteo

/raffles/{id}/enter:
  post:
    summary: Participar en sorteo

/raffles/{id}/entries:
  get:
    summary: Entradas del sorteo

/raffles/{id}/winner:
  get:
    summary: Ganador del sorteo
```

### FEED (4 endpoints)
```yaml
/feed:
  get:
    summary: Feed personalizado

/feed/trending:
  get:
    summary: Tendencias

/feed/causes:
  get:
    summary: Feed de causas

/feed/products:
  get:
    summary: Feed de productos
```

### NOTIFICATIONS (4 endpoints)
```yaml
/notifications:
  get:
    summary: Mis notificaciones

/notifications/{id}/read:
  patch:
    summary: Marcar como leída

/notifications/read-all:
  post:
    summary: Marcar todas como leídas

/notifications/preferences:
  get:
    summary: Preferencias
  patch:
    summary: Actualizar preferencias
```

### ADMIN (10 endpoints)
```yaml
/admin/users:
  get:
    summary: Listar usuarios

/admin/users/{id}:
  patch:
    summary: Modificar usuario

/admin/products/pending:
  get:
    summary: Productos pendientes

/admin/products/{id}/approve:
  post:
    summary: Aprobar producto

/admin/products/{id}/reject:
  post:
    summary: Rechazar producto

/admin/raffles/pending:
  get:
    summary: Sorteos pendientes

/admin/raffles/{id}/approve:
  post:
    summary: Aprobar sorteo

/admin/audit-logs:
  get:
    summary: Logs de auditoría

/admin/stats:
  get:
    summary: Estadísticas globales

/admin/settings:
  get:
    summary: Configuración
  patch:
    summary: Actualizar configuración
```

### HEALTH (2 endpoints)
```yaml
/health:
  get:
    summary: Estado del sistema

/health/db:
  get:
    summary: Estado de la base de datos
```

## Total: ~53 endpoints
