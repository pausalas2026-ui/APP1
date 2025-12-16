# DOCUMENTO 20 — OPENAPI BASE

## OpenAPI Specification (Resumen)

```yaml
openapi: 3.0.3
info:
  title: I Love To Help API
  version: 1.0.0
  description: API para plataforma de marketplace con donaciones, MLM y sorteos

servers:
  - url: http://localhost:3001/api/v1
    description: Development
  - url: https://api.ilovetohelp.com/v1
    description: Production

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
        status:
          type: string
          enum: [active, suspended, banned]
        plan:
          type: string
          enum: [free, pro, premium, elite]

    Product:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        description:
          type: string
        price:
          type: number
          format: decimal
        status:
          type: string
          enum: [draft, active, paused, sold_out, deleted]

    Transaction:
      type: object
      properties:
        id:
          type: string
          format: uuid
        subtotal:
          type: number
        donationAmount:
          type: number
        taxAmount:
          type: number
        totalAmount:
          type: number
        platformFee:
          type: number
        sellerReceives:
          type: number
        status:
          type: string
          enum: [pending, processing, completed, failed, refunded, cancelled]

    Cause:
      type: object
      properties:
        id:
          type: string
          format: uuid
        title:
          type: string
        goalAmount:
          type: number
        currentAmount:
          type: number
        status:
          type: string
          enum: [draft, active, completed, cancelled]

    Commission:
      type: object
      properties:
        id:
          type: string
          format: uuid
        level:
          type: integer
          enum: [1, 2]
        rate:
          type: number
        planMultiplier:
          type: number
        amount:
          type: number
        status:
          type: string
          enum: [pending, approved, paid, cancelled]

    Raffle:
      type: object
      properties:
        id:
          type: string
          format: uuid
        prizeId:
          type: string
          format: uuid
        status:
          type: string
          enum: [active, closed, processing, completed]
        winnerId:
          type: string
          format: uuid
          nullable: true

    Error:
      type: object
      properties:
        status:
          type: string
          example: error
        code:
          type: string
        message:
          type: string

  responses:
    Unauthorized:
      description: Token inválido o expirado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    Forbidden:
      description: Sin permisos para esta acción
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

    NotFound:
      description: Recurso no encontrado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'

security:
  - bearerAuth: []

tags:
  - name: Auth
    description: Autenticación y registro
  - name: Users
    description: Gestión de usuarios
  - name: Products
    description: Marketplace de productos
  - name: Transactions
    description: Compras y ventas
  - name: Donations
    description: Sistema de donaciones
  - name: Causes
    description: Causas y campañas
  - name: Commissions
    description: Sistema MLM
  - name: Raffles
    description: Sistema de sorteos
  - name: Admin
    description: Administración del sistema
```

## Endpoints Documentados

### POST /auth/login
```yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        required: [email, password]
        properties:
          email:
            type: string
          password:
            type: string
responses:
  200:
    description: Login exitoso
    content:
      application/json:
        schema:
          type: object
          properties:
            accessToken:
              type: string
            refreshToken:
              type: string
            user:
              $ref: '#/components/schemas/User'
```

### POST /transactions
```yaml
requestBody:
  content:
    application/json:
      schema:
        type: object
        required: [items]
        properties:
          items:
            type: array
            items:
              type: object
              properties:
                productId:
                  type: string
                quantity:
                  type: integer
          donationPercentage:
            type: number
            default: 0.05
          causeId:
            type: string
          promoCode:
            type: string
responses:
  201:
    description: Transacción creada
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/Transaction'
```

---

## NOTA IMPORTANTE

Este es el Documento 20 - OpenAPI Base (esquema parcial).
Documento 21 contiene la versión expandida completa de todos los endpoints.
