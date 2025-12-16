# DOCUMENTO 27 — IMPLEMENTACIÓN FASE 2 (MARKETPLACE, PRODUCTOS, PROMOCIONES)

## Propósito
Guía para implementar el marketplace, productos y sistema de promociones.

## Estructura de Carpetas

```
services/api/src/modules/
  products/
    products.controller.ts
    products.service.ts
    products.dto.ts
    products.module.ts
  promotions/
    promotions.controller.ts
    promotions.service.ts
    promotions.dto.ts
    promotions.module.ts
```

## PRODUCTS — DTOs

### CreateProductDTO
```typescript
export class CreateProductDTO {
  title: string;
  description: string;
  price: number;
  commission_total: number;
  is_promotable_by_others: boolean;
  base_cause_id?: string | null;
  images: string[];
  stock: number;
}
```

### Validaciones Obligatorias
- title: min 3 chars
- price > 0
- commission_total entre 0 y MAX (economic_settings.max_commission_pct)
- images.length >= 1
- stock >= 0
- base_cause_id debe existir y estar aprobada
- Usuario debe tener plan que permita crear productos

## PRODUCTS — Service

### Crear Producto
```typescript
async createProduct(userId: string, dto: CreateProductDTO) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!PLAN_CAPABILITIES[user.plan_type].can_create_products)
    throw new ForbiddenException("PLAN_NOT_ALLOWED");

  const economicSettings = await prisma.economicSettings.findFirst();
  if (dto.commission_total > economicSettings.max_commission_pct)
    throw new ValidationException("COMMISSION_TOO_HIGH");

  if (dto.base_cause_id) {
    const cause = await prisma.cause.findUnique({ where: { id: dto.base_cause_id } });
    if (!cause || cause.status !== "approved")
      throw new ValidationException("INVALID_CAUSE");
  }

  return prisma.product.create({
    data: { ...dto, owner_id: userId, status: "pending" }
  });
}
```

### Aprobación Admin
```typescript
async approveProduct(adminId, productId) {
  await prisma.product.update({
    where: { id: productId },
    data: {
      status: "approved",
      approved_at: new Date(),
      approved_by: adminId
    }
  });
}
```

## PRODUCTS — Endpoints (OpenAPI)

- POST /products
- PUT /products/{id}
- GET /products
- GET /products/{id}
- POST /admin/products/{id}/approve
- POST /admin/products/{id}/reject

## PROMOTIONS — Service

### Generar Enlace Promocional
```typescript
async generatePromotionalLink(userId, productId, causeId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.status !== "approved")
    throw new ValidationException("PRODUCT_NOT_APPROVED");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.roles.includes("promoter"))
    throw new ForbiddenException("NOT_PROMOTER");

  const cause = await prisma.cause.findUnique({ where: { id: causeId } });
  if (!cause || cause.status !== "approved")
    throw new ValidationException("INVALID_CAUSE");

  const promotion = await prisma.promotion.create({
    data: { promoter_id: userId, product_id: productId, cause_id: causeId }
  });

  const url = `${APP_URL}/p/${productId}?ref=${promotion.id}&cause=${causeId}`;
  return { promotion_id: promotion.id, url };
}
```

## TRACKING — POST /tracking/clicks

Registrar:
- promotion_id
- product_id
- promoter_id
- cause_id
- ip_hash
- user_agent
- timestamp

## Testing Obligatorio

### Crear Producto
- Success → estado pending
- plan free → error PLAN_NOT_ALLOWED
- comisión > max → error
- causa inválida → error

### Aprobación Admin
- Solo admin puede aprobar
- Producto queda approved

### Generar Promoción
- Promotor no válido → error
- Producto not approved → error
- Causa inválida → error
- Válido → retorna URL

### Tracking
- Registra correctamente
- No acepta promotion_id inexistente
