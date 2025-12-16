# DOCUMENTO 9 — MOTORES INTERNOS

## Principios Generales
- Patrón Service/UseCase
- Modulares, inyectables, desacoplados
- Sin UI, sin API directa
- Validaciones internas, registran auditoría

## 9.1. Motor Económico Universal ⭐ (NÚCLEO)
Controla CADA flujo de dinero:
- Ventas, comisiones, causas, donaciones
- Porcentajes, multiplicadores, MLM, residual

**Responsabilidades:**
1. Recibir evento económico
2. Validar datos producto/campaña
3. Verificar plan y rol
4. Determinar comisiones N1 y N2
5. Aplicar multiplicadores del plan
6. Aplicar donación voluntaria del promotor
7. Calcular reparto a causa destino
8. Calcular fee plataforma
9. Registrar en tabla inmutable
10. Disparar notificaciones

**Regla absoluta:** NINGÚN cálculo de dinero fuera de este motor

## 9.2. Motor de Causas
- Crear/validar causas, campañas
- Asegurar causa destino asignada
- Causa activa siempre prevalece

## 9.3. Motor de Marketplace
- Validar productos, inventario
- Gestionar aprobaciones
- TODOS los productos requieren aprobación admin

## 9.4. Motor de Comisiones y MLM
- Calcular N1 y N2
- Aplicar multiplicadores por plan
- Registrar liquidaciones
- NO existe nivel 3

## 9.5. Motor de Donaciones
- Donaciones del carrito, directas
- Distribuir según fórmula
- Cada donación = evento separado

## 9.6. Motor de Sorteos
- Premios, sorteos, participación
- Selección ganador auditada
- Todo sorteo requiere aprobación

## 9.7. Motor de Feed
- Prioridad por plan
- Ranking por actividad
- Elite = máxima, Free = mínima

## 9.8. Motor de Auditoría
- Todo evento crítico registrado
- Ningún registro puede modificarse

## 9.9. Motor de Planes (PlanRules)
- Capa de reglas puras
- getMultiplier(), canCreate*()
- Sin acceso a BD

## 9.10. Motor de Notificaciones
- Email, push, mensajes internos
- Desacoplado, funciona por colas
