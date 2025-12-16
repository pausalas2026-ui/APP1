# DOCUMENTO 13 — CAPÍTULO 12: ADDENDUMS Y ANEXOS

## Anexo A: Fórmulas Económicas

### Comisión Promotor N1
```
comision_n1 = comision_total × multiplicador_plan × (100% - donacion_voluntaria%)
```

### Comisión Afiliador N2
```
comision_n2 = comision_total × porcentaje_n2 × multiplicador_plan_n2
```

### Donación a Causa
```
donacion_causa = donacion_carrito + (comision_n1 × donacion_voluntaria%)
```

### Fee Plataforma
```
fee = precio_producto × porcentaje_plataforma
```

## Anexo B: Estados de Entidades

### Producto
- draft → pending → approved → active → paused → archived

### Sorteo
- draft → pending → approved → active → closed → completed

### Transacción
- pending → processing → completed | failed | refunded

### Causa
- pending → active → paused → completed | cancelled

## Anexo C: Códigos de Error
```
E1001: Usuario no autorizado
E1002: Plan insuficiente
E1003: Producto no aprobado
E1004: Causa inválida
E1005: Sorteo cerrado
E2001: Error de pago
E2002: Saldo insuficiente
E3001: Límite alcanzado
```

## Anexo D: Webhooks
- payment.completed
- transaction.created
- commission.calculated
- raffle.winner.selected
- plan.upgraded
- plan.downgraded

## Anexo E: Rate Limits
| Endpoint | Free | Pro | Premium | Elite |
|----------|------|-----|---------|-------|
| API calls/min | 60 | 120 | 300 | 600 |
| Uploads/día | 5 | 20 | 50 | ilimitado |
| Productos | 0 | 10 | 50 | ilimitado |

## Anexo F: Tiempos de Retención
- Logs auditoría: 7 años
- Transacciones: permanente
- Sesiones: 30 días
- Cache: 1 hora
