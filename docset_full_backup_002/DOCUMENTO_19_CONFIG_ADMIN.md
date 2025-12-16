# DOCUMENTO 19 — CONFIGURACIÓN ADMIN Y MLM

## Panel de Administración

### Configuraciones Globales

#### Tabla: settings
```sql
-- Configuración económica
INSERT INTO settings (key, value, category) VALUES
('platform_fee_percentage', '0.10', 'economic'),
('tax_rate', '0.00', 'economic'),
('default_donation_percentage', '0.05', 'economic'),
('min_donation_amount', '0.01', 'economic'),
('max_donation_amount', '10000', 'economic');

-- Configuración MLM
INSERT INTO settings (key, value, category) VALUES
('commission_rate_n1', '0.05', 'mlm'),
('commission_rate_n2', '0.01', 'mlm'),
('mlm_max_levels', '2', 'mlm');

-- Configuración planes
INSERT INTO settings (key, value, category) VALUES
('plan_free_multiplier', '0.05', 'plans'),
('plan_pro_multiplier', '0.30', 'plans'),
('plan_premium_multiplier', '0.70', 'plans'),
('plan_elite_multiplier', '1.00', 'plans'),
('plan_free_product_limit', '5', 'plans'),
('plan_pro_product_limit', '50', 'plans'),
('plan_premium_product_limit', '500', 'plans'),
('plan_elite_product_limit', '-1', 'plans');

-- Configuración sorteos
INSERT INTO settings (key, value, category) VALUES
('raffle_entry_rate', '1', 'raffles'),
('raffle_winner_reset_entries', 'true', 'raffles');
```

### API Admin para Configuración

#### GET /admin/settings
```json
{
  "status": "success",
  "data": {
    "economic": {
      "platform_fee_percentage": 0.10,
      "tax_rate": 0.00,
      "default_donation_percentage": 0.05
    },
    "mlm": {
      "commission_rate_n1": 0.05,
      "commission_rate_n2": 0.01,
      "mlm_max_levels": 2
    },
    "plans": {
      "plan_free_multiplier": 0.05,
      "plan_pro_multiplier": 0.30,
      "plan_premium_multiplier": 0.70,
      "plan_elite_multiplier": 1.00
    }
  }
}
```

#### PUT /admin/settings/:key
```json
{
  "value": "0.12"
}
```

## Sistema MLM Detallado

### Estructura de Red

```
                    [Afiliador N2]
                         |
                    [Promotor N1]
                    /    |    \
              [Compra] [Compra] [Compra]
```

### Flujo de Comisiones

1. **Compra ocurre** ($100)
2. **Identificar promotor** (código promo usado)
3. **Identificar afiliador** (quién invitó al promotor)
4. **Calcular comisión N1**:
   - Base rate: 5%
   - Plan multiplier: según plan promotor
   - Si promotor es Pro (30%): $100 × 5% × 30% = $1.50
5. **Calcular comisión N2**:
   - Rate fijo: 1%
   - $100 × 1% = $1.00
6. **Registrar comisiones** como pendientes
7. **Admin aprueba** (o automático si configurado)
8. **Pagar comisiones**

### Reglas MLM Estrictas

1. **MÁXIMO 2 NIVELES** - No hay nivel 3, 4, etc.
2. **Promotor no gana de sus propias compras**
3. **Afiliador solo gana cuando su red genera ventas**
4. **Comisiones se calculan sobre subtotal** (sin impuestos ni donación)
5. **Plan afecta SOLO al multiplicador del N1**
6. **N2 siempre es 1% fijo** sin multiplicador

### Tabla affiliates

```sql
-- Relación promotor-afiliador
SELECT 
  p.name as promoter_name,
  a.name as affiliator_name,
  aff.created_at as relationship_date
FROM affiliates aff
JOIN users p ON aff.promoter_id = p.id
JOIN users a ON aff.affiliator_id = a.id
WHERE aff.is_active = true;
```

### Código Promocional

- Generado automáticamente al activar rol promotor
- Formato: `USER_XXXXXX` (6 caracteres alfanuméricos)
- Único por usuario
- Rastreable en tracking_events

### Dashboard Promotor

```typescript
interface PromoterDashboard {
  promoCode: string;
  totalSalesGenerated: number;
  totalCommissionsEarned: number;
  pendingCommissions: number;
  paidCommissions: number;
  conversionRate: number;
  recentSales: Sale[];
  networkSize: number; // Solo si también es afiliador
}
```

### Dashboard Afiliador

```typescript
interface AffiliatorDashboard {
  totalPromotorsRecruited: number;
  activePromotors: number;
  networkSalesTotal: number;
  totalCommissionsEarned: number;
  pendingCommissions: number;
  topPromotors: Promotor[];
  recentNetworkActivity: Activity[];
}
```

## Gestión de Usuarios Admin

### Cambiar Estado Usuario
```
PUT /admin/users/:id/status
{
  "status": "suspended",
  "reason": "Violación de términos"
}
```

### Asignar Rol Manual
```
POST /admin/users/:id/roles
{
  "role": "seller",
  "reason": "Aprobación manual vendedor"
}
```

### Cambiar Plan Manual
```
POST /admin/users/:id/plan
{
  "plan": "premium",
  "reason": "Promoción especial"
}
```

## Aprobación de Comisiones

### Flujo Manual
1. Comisión creada con status `pending`
2. Admin revisa en panel
3. Admin aprueba → status `approved`
4. Sistema procesa pago → status `paid`

### Flujo Automático
```sql
-- Configuración para aprobación automática
INSERT INTO settings (key, value, category) VALUES
('commission_auto_approve', 'true', 'mlm'),
('commission_auto_approve_max', '100', 'mlm');
```

## Reportes Admin

### Ventas por Período
```sql
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as transactions,
  SUM(total_amount) as total_sales,
  SUM(platform_fee) as platform_revenue,
  SUM(donation_amount) as total_donations
FROM transactions
WHERE status = 'completed'
AND created_at BETWEEN :start AND :end
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Comisiones por Plan
```sql
SELECT 
  u.plan,
  COUNT(c.id) as total_commissions,
  SUM(c.amount) as total_paid,
  AVG(c.amount) as avg_commission
FROM commissions c
JOIN users u ON c.beneficiary_id = u.id
WHERE c.status = 'paid'
GROUP BY u.plan;
```

### Top Causas
```sql
SELECT 
  c.title,
  c.goal_amount,
  c.current_amount,
  ROUND((c.current_amount / c.goal_amount) * 100, 2) as progress_percentage,
  COUNT(d.id) as donation_count
FROM causes c
LEFT JOIN donations d ON c.id = d.cause_id
WHERE c.status = 'active'
GROUP BY c.id
ORDER BY progress_percentage DESC
LIMIT 10;
```
