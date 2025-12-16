# DOCUMENTO 13 — ADDENDUMS Y CLARIFICACIONES

## Addendum 1: Redondeo de Valores
- Siempre a 2 decimales
- Método: ROUND_HALF_UP
- Aplicar DESPUÉS de cada cálculo

## Addendum 2: Múltiples Roles
- Usuario puede tener varios roles simultáneos
- Permisos son UNIÓN de todos los roles
- Panel muestra opciones según todos los roles activos

## Addendum 3: Límites del Sistema
| Concepto | Límite |
|----------|--------|
| Productos por vendedor Free | 5 |
| Productos por vendedor Pro | 50 |
| Productos por vendedor Premium | 500 |
| Productos por vendedor Elite | Ilimitado |
| Imágenes por producto | 10 |
| Tamaño imagen | 5MB |
| Causas activas por ONG | 10 |
| Premios activos simultáneos | 50 |

## Addendum 4: Estados de Transacción
```
PENDING → PROCESSING → COMPLETED
                    ↘ FAILED
                    ↘ REFUNDED
                    ↘ CANCELLED
```

## Addendum 5: Comisiones MLM
- **Nivel 1 (Promotor)**: % del total venta (según plan promotor)
- **Nivel 2 (Afiliador)**: 1% del total venta
- **MÁXIMO 2 NIVELES** - No hay nivel 3

## Addendum 6: Sorteos
- Entradas se acumulan por compra (1 entrada = $1 gastado)
- Entradas NO son transferibles
- Al ganar, entradas se resetean a 0
- Sorteo puede ser: ACTIVO, CERRADO, EN_PROCESO, FINALIZADO

## Addendum 7: Donaciones
- Mínimo: $0.01
- Máximo por transacción: $10,000
- Redondeo al centavo más cercano
- Usuario puede cambiar % sugerido

## Addendum 8: Planes y Upgrades
- Upgrade: efectivo inmediatamente
- Downgrade: efectivo al final del período
- Prorratea NO aplica
- Free siempre disponible sin pago

## Addendum 9: Auditoría
- Retención mínima: 7 años
- Campos obligatorios: actor, acción, target, timestamp, ip, datos_previos, datos_nuevos
- Logs NUNCA se borran, solo archivan

## Addendum 10: Notificaciones
- Email obligatorio para: compras, ventas, ganador sorteo, nueva comisión
- Push opcional configurable por usuario
- In-app para todo tipo de eventos

## Addendum 11: Cálculos Económicos Paso a Paso
```
1. subtotal = Σ(precio × cantidad)
2. donation = subtotal × donation_percentage
3. total_before_tax = subtotal + donation
4. tax = total_before_tax × tax_rate
5. total = total_before_tax + tax
6. platform_fee = subtotal × platform_percentage
7. seller_receives = subtotal - platform_fee
8. commission_n1 = subtotal × rate_n1 × plan_multiplier
9. commission_n2 = subtotal × rate_n2 (fixed 1%)
10. entries = floor(total)
```
