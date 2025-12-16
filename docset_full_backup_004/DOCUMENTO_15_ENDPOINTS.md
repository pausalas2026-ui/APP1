# DOCUMENTO 15 — ENDPOINTS API

## Autenticación
```
POST   /api/auth/register     - Registro con código afiliación
POST   /api/auth/login        - Login, devuelve JWT
POST   /api/auth/refresh      - Refresh token
POST   /api/auth/logout       - Invalidar tokens
POST   /api/auth/verify-email - Verificar email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

## Usuarios
```
GET    /api/users/me          - Perfil actual
PATCH  /api/users/me          - Actualizar perfil
GET    /api/users/:id         - Ver usuario (público)
GET    /api/users/me/dashboard - Dashboard datos
GET    /api/users/me/affiliates - Mis afiliados
GET    /api/users/me/commissions - Mis comisiones
POST   /api/users/me/cause    - Cambiar causa activa
```

## Planes
```
GET    /api/plans             - Listar planes
GET    /api/plans/:type       - Detalle plan
POST   /api/plans/upgrade     - Upgrade plan
POST   /api/plans/downgrade   - Downgrade plan
GET    /api/users/me/plan-history
```

## Causas
```
GET    /api/causes            - Listar causas activas
POST   /api/causes            - Crear causa
GET    /api/causes/:id        - Detalle causa
PATCH  /api/causes/:id        - Editar causa
GET    /api/causes/:id/campaigns
GET    /api/causes/:id/stats
```

## Campañas
```
GET    /api/campaigns         - Listar campañas
POST   /api/campaigns         - Crear campaña
GET    /api/campaigns/:id     - Detalle
PATCH  /api/campaigns/:id     - Editar
```

## Productos
```
GET    /api/products          - Catálogo público
POST   /api/products          - Crear (Pro+)
GET    /api/products/:id      - Detalle
PATCH  /api/products/:id      - Editar
DELETE /api/products/:id      - Archivar
GET    /api/products/me       - Mis productos
POST   /api/products/:id/promote - Generar enlace promoción
```

## Marketplace
```
GET    /api/marketplace       - Feed productos
GET    /api/marketplace/featured
GET    /api/marketplace/search?q=
```

## Donaciones
```
POST   /api/donations         - Donar directamente
POST   /api/donations/cart    - Donación desde carrito
GET    /api/donations/me      - Mis donaciones
GET    /api/donations/:id     - Detalle donación
```

## Transacciones
```
POST   /api/transactions/purchase - Comprar producto
GET    /api/transactions/me   - Mis transacciones
GET    /api/transactions/:id  - Detalle
```

## Comisiones
```
GET    /api/commissions/me    - Mis comisiones
GET    /api/commissions/me/pending
GET    /api/commissions/me/available
POST   /api/commissions/withdraw - Solicitar retiro
```

## Premios y Sorteos
```
GET    /api/prizes            - Listar premios
POST   /api/prizes            - Crear (Premium+)
GET    /api/prizes/:id        - Detalle
GET    /api/raffles           - Listar sorteos
POST   /api/raffles           - Crear sorteo
GET    /api/raffles/:id       - Detalle sorteo
POST   /api/raffles/:id/enter - Participar
GET    /api/raffles/:id/entries
GET    /api/raffles/:id/winner
```

## Feed
```
GET    /api/feed              - Feed personalizado
GET    /api/feed/trending
GET    /api/feed/causes
GET    /api/feed/products
```

## Notificaciones
```
GET    /api/notifications     - Mis notificaciones
PATCH  /api/notifications/:id/read
POST   /api/notifications/read-all
GET    /api/notifications/preferences
PATCH  /api/notifications/preferences
```

## Admin
```
GET    /api/admin/users       - Listar usuarios
PATCH  /api/admin/users/:id   - Modificar usuario
GET    /api/admin/products/pending
POST   /api/admin/products/:id/approve
POST   /api/admin/products/:id/reject
GET    /api/admin/raffles/pending
POST   /api/admin/raffles/:id/approve
GET    /api/admin/audit-logs
GET    /api/admin/stats
GET    /api/admin/settings
PATCH  /api/admin/settings
```

## Webhooks (internos)
```
POST   /api/webhooks/payment  - Callback pasarela
POST   /api/webhooks/email    - Callback email
```

## Health
```
GET    /api/health            - Estado del sistema
GET    /api/health/db         - Estado BD
```
