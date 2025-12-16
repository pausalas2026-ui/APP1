# DOCUMENTO 20 — OPENAPI SPECIFICATION (Resumen)

## Info
```yaml
openapi: 3.0.3
info:
  title: I Love to Help API
  version: 1.0.0
  description: API para plataforma híbrida de marketplace solidario
```

## Servers
```yaml
servers:
  - url: http://localhost:3001/api
    description: Development
  - url: https://api.ilovetohelp.com/api
    description: Production
```

## Security
```yaml
securityDefinitions:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

## Tags
- Auth
- Users
- Plans
- Causes
- Campaigns
- Products
- Marketplace
- Donations
- Transactions
- Commissions
- Prizes
- Raffles
- Feed
- Notifications
- Admin

## Schemas Principales

### User
```yaml
User:
  type: object
  properties:
    id: { type: string, format: uuid }
    email: { type: string, format: email }
    name: { type: string }
    referral_code: { type: string }
    plan_type: { type: string, enum: [free, pro, premium, elite] }
    plan_multiplier: { type: number }
    active_cause_id: { type: string, format: uuid }
```

### Product
```yaml
Product:
  type: object
  properties:
    id: { type: string, format: uuid }
    title: { type: string }
    description: { type: string }
    price: { type: number }
    commission_total: { type: number }
    status: { type: string, enum: [draft, pending, approved, active, paused, archived] }
```

### Transaction
```yaml
Transaction:
  type: object
  properties:
    id: { type: string, format: uuid }
    type: { type: string, enum: [purchase, donation, commission, refund, fee] }
    amount: { type: number }
    status: { type: string, enum: [pending, processing, completed, failed, refunded] }
```

### Commission
```yaml
Commission:
  type: object
  properties:
    id: { type: string, format: uuid }
    level: { type: integer, enum: [1, 2] }
    gross_amount: { type: number }
    plan_multiplier: { type: number }
    net_amount: { type: number }
```

## Responses Estándar
```yaml
Success:
  200: OK
  201: Created
  204: No Content

Errors:
  400: Bad Request
  401: Unauthorized
  403: Forbidden
  404: Not Found
  409: Conflict
  422: Unprocessable Entity
  429: Too Many Requests
  500: Internal Server Error
```
