# DOCUMENTO 21 — OPENAPI COMPLETO (TODOS LOS ENDPOINTS EXPANDIDOS)
## "I LOVE TO HELP — API CONTRACTUAL FINAL PARA IMPLEMENTACIÓN"

---

## 1. AUTH (Autenticación y Gestión de Sesión)

### 1.1 POST /auth/register
Registrar usuario.
- **Tags**: [Auth]
- **Security**: none
- **RequestBody**:
```json
{
  "email": "string",
  "password": "string",
  "name": "string",
  "referral_code": "string | null"
}
```
- **Responses**:
  - 200: Usuario creado
  - 400: VALIDATION_ERROR
  - 409: Email ya existe

### 1.2 POST /auth/login
Iniciar sesión.
- **RequestBody**:
```json
{
  "email": "string",
  "password": "string"
}
```
- **Responses**:
  - 200: `{ access_token, refresh_token, user }`
  - 401: AUTH_INVALID_TOKEN

### 1.3 POST /auth/refresh
- **RequestBody**: `{ refresh_token }`
- **Responses**:
  - 200: nuevo token
  - 401: refresh inválido

### 1.4 GET /auth/logout
Invalidate refresh token.

---

## 2. USERS (Perfil y Ajustes del Usuario)

### 2.1 GET /users/me
Retorna el usuario autenticado.
- **Security**: bearerAuth

### 2.2 PUT /users/me
Actualizar datos del perfil.

### 2.3 PUT /users/me/donation-preference
Actualiza el porcentaje que el promotor dona voluntariamente.
```json
{
  "donation_percentage": 0-100
}
```

### 2.4 GET /admin/users (ADMIN_ONLY)
Listado de usuarios con filtros.

---

## 3. PLANS

### 3.1 GET /plans/me
Ver capacidades del plan actual.

### 3.2 POST /plans/change
Solicitar cambio de plan.
```json
{
  "target_plan": "pro | premium | elite"
}
```

### 3.3 ADMIN — Configuración de planes
- **GET /admin/plans/config**
- **PUT /admin/plans/config**

Permite configurar:
- multiplicadores MLM
- límites de creación
- capacidades especiales

---

## 4. CAUSES (Causas y Campañas)

### 4.1 POST /causes
Crear causa (creador de causa).

### 4.2 GET /causes
Listar causas públicas.

### 4.3 GET /causes/{id}
Detalle de causa.

### 4.4 ADMIN — aprobar / rechazar
- **POST /admin/causes/{id}/approve**
- **POST /admin/causes/{id}/reject**

### 4.5 POST /causes/{id}/campaigns
Crear campaña dentro de causa.

### 4.6 GET /causes/{id}/campaigns
Listar campañas.

### 4.7 GET /causes/{id}/stats
Estadísticas administrativas o del creador.

---

## 5. PRODUCTS (Marketplace)

### 5.1 POST /products
Crear producto.
- **Security**: bearerAuth + plan >= pro
- **RequestBody**:
```json
{
  "title": "...",
  "description": "...",
  "price": 99.99,
  "commission_total": 20,
  "is_promotable_by_others": true,
  "base_cause_id": "uuid | null",
  "images": ["url1", "url2"],
  "stock": 50
}
```

### 5.2 PUT /products/{id}
Editar producto si status = pending.

### 5.3 GET /products
Listar productos aprobados.

### 5.4 GET /products/{id}
Ver detalle.

### 5.5 ADMIN aprobación de producto
- **POST /admin/products/{id}/approve**
- **POST /admin/products/{id}/reject**

### 5.6 PUT /products/{id}/inventory
Actualizar inventario.

### 5.7 GET /me/products
Mis productos.

---

## 6. PROMOTIONS (Enlaces promocionales)

### 6.1 POST /promotions/product/{id}
Genera un enlace promocional trackeable.

### 6.2 GET /promotions/stats
Estadísticas del promotor.

---

## 7. TRACKING

### 7.1 POST /tracking/clicks
```json
{
  "promotion_id": "uuid",
  "product_id": "uuid",
  "promoter_id": "uuid",
  "cause_id": "uuid"
}
```

---

## 8. CART & CHECKOUT

### 8.1 POST /cart
Crear o actualizar carrito.

### 8.2 POST /checkout
Crear sesión de pago.

### 8.3 POST /webhooks/payments/{provider}
Webhook desde Stripe/PayPal.

---

## 9. DONATIONS

### 9.1 POST /donations
Donación directa.

### 9.2 GET /me/donations
Mis donaciones.

### 9.3 ADMIN — estadísticas
**GET /admin/donations/stats**

---

## 10. COMMISSIONS — MLM

### 10.1 GET /me/commissions
Resumen del promotor.

### 10.2 GET /me/affiliates
Lista de afiliados.

### 10.3 ADMIN — revisiones
**GET /admin/users/{id}/commissions**

---

## 11. RAFFLES (Sorteos)

### 11.1 POST /prizes
Crear premio.

### 11.2 ADMIN aprobar premio
- **POST /admin/prizes/{id}/approve**
- **POST /admin/prizes/{id}/reject**

### 11.3 POST /raffles
Crear sorteo.

### 11.4 ADMIN aprobar sorteo
- **POST /admin/raffles/{id}/approve**
- **POST /admin/raffles/{id}/reject**

### 11.5 POST /raffles/{id}/entries
Participación en sorteo.

### 11.6 ADMIN seleccionar ganador
**POST /admin/raffles/{id}/draw-winner**

---

## 12. DASHBOARDS

### 12.1 GET /dashboard/promoter
Dashboard del promotor.

### 12.2 GET /dashboard/cause-creator
Dashboard del creador de causas.

### 12.3 GET /dashboard/admin
Dashboard administrativo.

---

## 13. ADMIN — CONFIGURACIÓN GLOBAL

### 13.1 GET /admin/mlm-settings
Obtener configuración MLM.

### 13.2 PUT /admin/mlm-settings
Actualizar configuración MLM.

### 13.3 GET /admin/economic-settings
Obtener configuración económica.

### 13.4 PUT /admin/economic-settings
Actualizar configuración económica.

---

## 14. AUDITORÍA & LOGS

### 14.1 GET /admin/audit-logs
Listado de logs de auditoría con filtros.

---

## Resumen de Endpoints por Categoría

| Categoría | Endpoints |
|-----------|-----------|
| Auth | 4 |
| Users | 4 |
| Plans | 4 |
| Causes | 7 |
| Products | 8 |
| Promotions | 2 |
| Tracking | 1 |
| Cart/Checkout | 3 |
| Donations | 3 |
| Commissions | 3 |
| Raffles | 6 |
| Dashboards | 3 |
| Admin Config | 4 |
| Audit | 1 |
| **TOTAL** | **~53 endpoints** |

---

## FIN DEL DOCUMENTO 21

Este documento define el contrato API completo para la implementación del backend.
Cada endpoint tiene estructura formal para generación de OpenAPI.
