# DOCUMENTO 19 — CONFIGURACIÓN Y ADMINISTRACIÓN

## Panel de Administración

### Funciones Principales
1. **Gestión de Usuarios**
   - Ver todos los usuarios
   - Cambiar roles
   - Cambiar planes
   - Suspender/reactivar cuentas

2. **Aprobaciones**
   - Productos pendientes
   - Premios pendientes
   - Sorteos pendientes
   - Causas pendientes

3. **Economía**
   - Ver transacciones globales
   - Estadísticas de comisiones
   - Balance de causas
   - Retiros pendientes

4. **Auditoría**
   - Logs completos
   - Filtros avanzados
   - Exportar reportes

5. **Configuración**
   - Parámetros globales
   - Fees plataforma
   - Límites por plan

## Settings Globales (tabla settings)

```json
{
  "platform_fee_percent": 5,
  "default_donation_amount": 1.00,
  "min_withdrawal_amount": 10.00,
  "max_products_free": 0,
  "max_products_pro": 10,
  "max_products_premium": 50,
  "max_products_elite": -1,
  "referral_bonus": 1.00,
  "commission_n2_default_percent": 10,
  "raffle_min_entries": 10,
  "email_verification_required": true,
  "maintenance_mode": false
}
```

## Gestión de Roles

### Asignación
```typescript
// Solo admin puede asignar roles
POST /api/admin/users/:id/roles
{
  "role": "promoter" | "creator" | "cause_generator" | "admin"
}
```

### Permisos por Rol
| Acción | user | promoter | creator | cause_gen | admin |
|--------|------|----------|---------|-----------|-------|
| Comprar | ✓ | ✓ | ✓ | ✓ | ✓ |
| Promover | ✗ | ✓ | ✓ | ✓ | ✓ |
| Crear productos | ✗ | ✗ | ✓ | ✗ | ✓ |
| Crear causas | ✗ | ✗ | ✗ | ✓ | ✓ |
| Aprobar | ✗ | ✗ | ✗ | ✗ | ✓ |
| Admin panel | ✗ | ✗ | ✗ | ✗ | ✓ |

## Moderación

### Estados de Contenido
- **Pendiente**: Esperando revisión
- **Aprobado**: Visible públicamente
- **Rechazado**: No publicado, con motivo
- **Suspendido**: Temporalmente oculto

### Flujo de Aprobación
1. Usuario crea contenido → Estado: pendiente
2. Admin recibe notificación
3. Admin revisa
4. Admin aprueba o rechaza
5. Usuario recibe notificación del resultado

## Reportes

### Dashboard Admin
- Usuarios registrados (total, hoy, semana)
- Transacciones (volumen, cantidad)
- Donaciones totales
- Comisiones generadas
- Productos activos
- Sorteos activos
- Causas activas

### Exportación
- CSV de transacciones
- CSV de usuarios
- PDF de auditoría
- JSON de configuración
