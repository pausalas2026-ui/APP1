# DOCUMENTO 4 — MODELOS ECONÓMICOS

## Flujo Económico de una Venta

```
Precio Producto: 100€
Comisión Total Definida: 15€
Donación Carrito: 5€
---
Creador recibe: 85€ (100 - 15)
Promotor N1 (Pro 30%): 15€ × 30% = 4.50€
Afiliador N2 (10% de N1): 15€ × 10% × [su plan] 
Causa recibe: 5€ (donación) + donación voluntaria promotor
Plataforma: fee de procesamiento
```

## Sistema MLM — 2 NIVELES EXACTOS

### Nivel 1 (N1) — Promotor Directo
- Quien comparte el enlace que genera la venta
- Recibe comisión × multiplicador de su plan

### Nivel 2 (N2) — Afiliador
- Quien invitó al promotor N1
- Recibe % de la comisión del N1 × su propio multiplicador

### ⚠️ REGLA ABSOLUTA: NO EXISTE N3
- El sistema NUNCA calcula comisiones más allá del nivel 2
- Esta es una restricción de diseño inquebrantable

## Multiplicadores por Plan

```javascript
const PLAN_MULTIPLIERS = {
  free: 0.05,    // 5%
  pro: 0.30,     // 30%
  premium: 0.70, // 70%
  elite: 1.00    // 100%
};
```

## Ejemplo Completo

```
Venta: Producto de 100€
Comisión total: 20€
N2 percent: 10%

Promotor N1 (Premium):
  - Bruto: 20€
  - Con multiplicador: 20€ × 0.70 = 14€
  - Donación voluntaria (20%): 14€ × 0.20 = 2.80€
  - Recibe: 14€ - 2.80€ = 11.20€

Afiliador N2 (Pro):
  - Bruto: 20€ × 10% = 2€
  - Con multiplicador: 2€ × 0.30 = 0.60€

Causa recibe: 2.80€ (de promotor) + donación carrito
```

## Donación Voluntaria del Promotor

- Promotor puede destinar % de su comisión a su causa activa
- Configurable por el promotor (0% - 100%)
- Se aplica DESPUÉS del multiplicador de plan
