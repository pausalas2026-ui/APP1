# DOCUMENTO 3 — CAPÍTULO 2: ACTORES Y ROLES

## 2.1. Plataforma / Administrador
- Aprueba productos, premios, causas, sorteos
- Modifica reglas generales, visualiza auditorías
- Gestiona planes, comisiones, disputas
- Ve todo, puede modificar parámetros globales

## 2.2. Comprador / Donante
- Compra productos, dona a causas
- Participa en sorteos, ve historial
- NO puede: crear productos, promover, ganar comisiones

## 2.3. Promotor / Colaborador (Actor Principal)
- Comparte productos, causas, sorteos, campañas
- Genera enlaces únicos con tracking
- Gana comisiones, elige % que dona (0-100%)
- Puede invitar otros promotores (MLM N1 y N2)

### Restricciones por Plan:
| Acción | Free | Pro | Premium | Elite |
|--------|------|-----|---------|-------|
| Crear productos | No | Sí | Sí | Sí |
| Crear premios | No | No | Sí | Sí |
| Tienda personal | No | Sí | Sí | Sí |
| Multiplicador | 5% | 30% | 70% | 100% |

## 2.4. Generador de Causa
- Crea causas y campañas
- Configura destino de fondos
- Ve estadísticas de recaudación
- Recibe parte del motor económico

## 2.5. Causa Destino
- Institución que recibe dinero final
- Entidad administrativa (no login tradicional)
- Para liquidaciones, auditoría, transparencia

## 2.6. Creador de Productos / Proveedor
- Publica productos en marketplace
- Define comisiones para promotores
- Solo Pro, Premium, Elite pueden crear
- Requiere aprobación del administrador

## 2.7. Creador de Premios
- Solo Premium y Elite
- Crea premios para sorteos
- Pasa revisión del administrador

## 2.8. Red MLM
- Nivel 1: Promotor que genera conversión
- Nivel 2: Usuario que invitó al promotor
- NO hay nivel 3 ni superior
- Campo obligatorio: invited_by_user_id

## 2.9. Roles Técnicos
- Administrador técnico, Moderador, Auditor

## 2.10. Roles Híbridos
- Un usuario puede ser múltiples roles simultáneamente
- Cada endpoint verifica: rol + plan + permisos específicos
