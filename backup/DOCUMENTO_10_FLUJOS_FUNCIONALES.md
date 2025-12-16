# DOCUMENTO 10 — CAPÍTULO 9: FLUJOS FUNCIONALES

## 9.1. Promoción de Producto con Causa Activa
1. Promotor ingresa a tablero
2. Selecciona producto (aprobado)
3. Sistema verifica rol y plan
4. Selecciona/confirma causa activa
5. Genera enlace único: `/p/{productId}?ref={promotorId}&cause={causeId}`
6. Cada click registra: promotor, producto, causa, timestamp, IP

**Regla:** Causa activa siempre prevalece sobre causa base

## 9.2. Compra con Donación
1. Comprador click en enlace promotor
2. Ve producto + causa activa
3. Agrega al carrito
4. Campo donación: default 1€ (editable)
5. Procede al pago
6. Pasarela recibe 2 componentes: producto + donación
7. Cada uno = evento económico separado

## 9.3. Distribución Económica (Motor Universal)
1. Pasarela confirma transacción
2. Backend recibe webhook
3. Identifica: producto, promotor, afiliador, causa, montos
4. Motor aplica: plan promotor, plan afiliador, comisiones, causa, fee
5. Registra: comisiones, donaciones, recibos, auditoría

**Regla:** Cálculos NUNCA en frontend, NUNCA duplicados

## 9.4. Creación de Producto y Aprobación
1. Usuario Pro+ crea producto
2. Sistema valida plan
3. Usuario ingresa datos
4. Estado: `pending_review`
5. Admin revisa
6. APRUEBA → `approved` → visible en marketplace
7. RECHAZA → `rejected` + razón

## 9.5. Creación de Tienda Personal
1. Promotor debe ser Pro/Premium/Elite
2. Se genera: `/store/{userid}`
3. Incluye productos marketplace + propios
4. Free NO puede tener tienda

## 9.6. Invitación MLM
1. Promotor genera enlace: `/signup?ref={promotorId}`
2. Nueva persona se registra
3. Sistema asigna: `invited_by = {promotorId}`
4. Estructura: N2 (invitador) ← N1 (nuevo)

**Reglas:** NO nivel 3, niveles NUNCA cambian

## 9.7. Creación de Sorteo
1. Usuario Premium/Elite selecciona crear
2. Sistema valida plan, premio
3. Define reglas, fechas, método
4. Estado: `pending_review`
5. Admin aprueba → `active`

## 9.8. Selección de Ganador
1. Fecha final alcanzada
2. Bloquea nuevas participaciones
3. Motor toma lista de boletos
4. Selección random AUDITADA
5. Registra en auditoría
6. Notifica ganador y participantes
7. Estado: `completed`
