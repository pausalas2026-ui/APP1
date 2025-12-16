# DOCUMENTO 3 — ACTORES Y ROLES

## Roles del Sistema

### 1. Usuario Base (user)
- Puede comprar productos
- Puede donar a causas
- Puede participar en sorteos
- Historial de compras y donaciones

### 2. Promotor (promoter)
- Todo lo de usuario +
- Genera enlaces de promoción
- Gana comisiones N1
- Puede invitar afiliados (N2)
- Selecciona causa activa
- Dashboard de métricas

### 3. Creador de Productos (creator)
- Todo lo de promotor +
- Crea productos (requiere Pro+)
- Define comisiones para promotores
- Ve estadísticas de ventas

### 4. Generador de Causas (cause_generator)
- Todo lo de usuario +
- Crea causas y campañas
- Ve estadísticas de recaudación
- Gestiona contenido de causa

### 5. Creador de Premios (prize_creator)
- Requiere Premium o Elite
- Crea premios y sorteos
- Define condiciones de participación

### 6. Administrador (admin)
- Acceso total al sistema
- Aprueba productos, causas, sorteos
- Gestiona usuarios y roles
- Configura parámetros económicos
- Ve auditoría completa

## Matriz de Permisos

| Acción | user | promoter | creator | cause_gen | admin |
|--------|------|----------|---------|-----------|-------|
| Comprar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Donar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Promover | ✗ | ✓ | ✓ | ✓ | ✓ |
| Crear productos | ✗ | ✗ | ✓ | ✗ | ✓ |
| Crear causas | ✗ | ✗ | ✗ | ✓ | ✓ |
| Aprobar | ✗ | ✗ | ✗ | ✗ | ✓ |

## Combinación Rol + Plan

- **Rol** define QUÉ puede hacer
- **Plan** define CUÁNTO gana y límites
- Usuario puede tener múltiples roles
