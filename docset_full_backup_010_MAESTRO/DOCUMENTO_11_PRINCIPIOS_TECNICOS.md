# DOCUMENTO 11 — PRINCIPIOS TÉCNICOS INQUEBRANTABLES

## 1. Todo cálculo de dinero SOLO en motor económico
- Ningún cálculo fuera del motor
- Backend-only, nunca frontend

## 2. Transacciones inmutables
- Ningún registro puede modificarse
- Correcciones = nuevas transacciones
- IDs + timestamps + hash integridad

## 3. Plan define capacidades, no roles
- Plan = multiplicador + funciones
- Rol = permisos de acción
- Combinación define acceso total

## 4. Causas siempre tienen destino
- Toda donación → causa válida
- Causa activa prevalece
- Nunca fondos sin destino

## 5. MLM máximo 2 niveles
- N1 = Promotor directo
- N2 = Afiliador (quien invitó al N1)
- NUNCA nivel 3

## 6. Aprobación admin obligatoria
- Productos, premios, sorteos
- Antes de ser públicos
- Admin puede rechazar/suspender

## 7. Validaciones siempre en backend
- Frontend solo UX
- Backend valida todo
- Nunca confiar en cliente

## 8. Auditoría de todo evento crítico
- Creación, modificación, eliminación
- Eventos económicos
- Cambios de rol/plan
- Logs inmutables

## 9. Separación de contextos
- Cada motor independiente
- Comunicación por interfaces
- Testing aislado

## 10. Idempotencia en operaciones
- Reintentar = mismo resultado
- IDs únicos por operación
- Protección contra duplicados
