# DOCUMENTO 28 — IMPLEMENTACIÓN FASE 3 (MOTOR ECONÓMICO UNIVERSAL)

## Propósito
Definir el NÚCLEO ECONÓMICO del sistema: reparto de comisiones, MLM, donaciones.

## Ubicación del Código

```
packages/core/src/
  economic/EconomicEngineService.ts
  commissions/CommissionEngine.ts
  donations/DonationEngine.ts
  common/types/EconomicResult.ts
```

**REGLA:** Ninguna fórmula económica en controladores, servicios API ni frontend.

## Interfaces Principales

### EconomicEngineService
```typescript
export class EconomicEngineService {
  constructor(
    private readonly txRepo: TransactionsRepository,
    private readonly settingsRepo: EconomicSettingsRepository,
    private readonly mlmSettingsRepo: MLMSettingsRepository,
    private readonly planRules: PlanRulesProvider,
    private readonly commissionEngine: CommissionEngine,
    private readonly donationEngine: DonationEngine,
    private readonly balancesEngine: BalancesEngine,
    private readonly auditLog: AuditLogService
  ) {}

  async processTransaction(transactionId: string): Promise<EconomicResult> {
    // Implementación completa en este documento
  }
}
```

### CommissionEngine
```typescript
export class CommissionEngine {
  async calculateCommissions(params: {
    baseCommissionAmount: number;
    promoter: UserEntity;
    upline?: UserEntity | null;
    mlmSettings: MLMSettings;
    planCapabilities: PlanCapabilities;
    promoterDonationPreference: number;
  }): Promise<CommissionBreakdown> {}
}
```

### DonationEngine
```typescript
export class DonationEngine {
  async calculateDonations(params: {
    donationAmount: number;
    platformFeePct: number;
    cause: CauseEntity;
    causeOwner?: UserEntity | null;
    promoter?: UserEntity | null;
    promoterDonationFromCommission: number;
  }): Promise<DonationBreakdown> {}
}
```

## Modelo de Datos Económico

### transactions
- id, payment_provider, payment_id, buyer_id, promoter_id, upline_id
- cause_id, total_amount, products_amount, donation_amount
- status (pending, paid, failed, processed), created_at, processed_at

### transaction_items
- transaction_id, product_id, unit_price, quantity, line_total
- commission_total_pct

### commissions
- id, transaction_id, transaction_item_id, user_id
- role (promoter, upline, platform, creator)
- amount, commission_type (product, donation, bonus), created_at

### donations
- id, transaction_id, cause_id
- amount_cause, amount_platform_fee, amount_cause_owner
- amount_promoter_extra, created_at

### balances
- id, user_id, balance_type (commission, donation, fee)
- amount, currency, created_at

## Reglas de Configuración Admin

```
mlm_total_pct + platform_pct + creator_pct = 100%
level1_pct + level2_pct <= mlm_total_pct
```

Valores SIEMPRE de mlm_settings, NUNCA hardcodeados.

## Flujo processTransaction

```typescript
async processTransaction(transactionId: string): Promise<EconomicResult> {
  // 1. Cargar transacción con items y relaciones
  const tx = await txRepo.getFullTransaction(transactionId);

  // 2. Verificar idempotencia
  if (tx.status !== 'paid' || tx.processed_at)
    throw new BusinessError("TRANSACTION_ALREADY_PROCESSED_OR_INVALID");

  // 3. Cargar settings
  const mlmSettings = await mlmSettingsRepo.getCurrent();
  const ecoSettings = await settingsRepo.getCurrent();

  // 4. Calcular comisiones por item
  for (const item of tx.items) {
    const commissionBase = item.line_total * (item.commission_total_pct / 100);
    // Validar límites, calcular breakdown
  }

  // 5. Calcular donaciones
  const donationBreakdown = await donationEngine.calculateDonations({...});

  // 6. Persistir resultados
  await this.persistEconomicResults({...});

  // 7. Marcar transacción procesada
  await txRepo.markAsProcessed(tx.id);

  // 8. Auditoría
  await auditLog.logEconomicProcessing({...});

  return buildEconomicResultObject({...});
}
```

## Cálculo de Comisiones

```typescript
// Bloques según mlm_settings
const mlmAmount = baseCommissionAmount * (mlmSettings.mlm_total_pct / 100);
const platformAmount = baseCommissionAmount * (mlmSettings.platform_pct / 100);
const creatorAmount = baseCommissionAmount * (mlmSettings.creator_pct / 100);

// Dentro del bloque MLM
const level1Base = mlmAmount * (mlmSettings.level1_pct / 100);
const level2Base = mlmAmount * (mlmSettings.level2_pct / 100);

// Aplicar plan
const promoterFinal = level1Base * planCapabilities.commission_multiplier;
const uplineFinal = upline ? level2Base : 0;

// Donación voluntaria del promotor
const promoterDonation = promoterFinal * (promoterDonationPreference / 100);
const promoterNet = promoterFinal - promoterDonation;
```

## Cálculo de Donaciones

```typescript
const platformFee = donationAmount * (platformFeePct / 100);
const netAfterPlatform = donationAmount - platformFee;
const causeOwnerAmount = netAfterPlatform * (causeOwnerPct / 100);
const causeAmount = netAfterPlatform - causeOwnerAmount;
const totalForCause = causeAmount + promoterDonationFromCommission;
```

## Seguridad Anti-Fraude

- Verificar tx.status === 'paid' y processed_at == null
- payment_id no duplicado
- total_amount === products_amount + donation_amount
- Loggear discrepancias, NO procesar si hay error

## Testing Obligatorio

### EconomicEngine
- 1 producto, comisión estándar, con promotor y upline
- Sin upline → parte va a plataforma
- promoterDonationPreference = 0%, 50%, 100%
- commission_total_pct > max → error

### CommissionEngine
- Suma: promoter + upline + platform + creator = base
- Aplicación de plan multiplier

### DonationEngine
- donationAmount > 0 con fee plataforma
- causeOwnerPct > 0
- promoterDonationFromCommission sumado a causa

### Integration
- Webhook dispara processTransaction
- Se crean registros en commissions y donations
- No procesar duplicados
