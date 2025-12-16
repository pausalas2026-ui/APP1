# DOCUMENTO 16 — IMPLEMENTACIÓN DE MOTORES

## Motor Económico Universal (EconomicEngine)

### Estructura
```typescript
// services/economic/economic.engine.ts
class EconomicEngine {
  constructor(
    private transactionRepo: TransactionRepository,
    private commissionRepo: CommissionRepository,
    private donationRepo: DonationRepository,
    private planRules: PlanRulesEngine,
    private auditEngine: AuditEngine,
    private notificationEngine: NotificationEngine
  ) {}

  async processTransaction(input: TransactionInput): Promise<TransactionResult> {
    // 1. Validar datos de entrada
    // 2. Verificar plan y rol del promotor
    // 3. Calcular comisión N1
    // 4. Calcular comisión N2 (si existe afiliador)
    // 5. Aplicar multiplicadores por plan
    // 6. Procesar donación voluntaria del promotor
    // 7. Calcular distribución a causa
    // 8. Calcular fee plataforma
    // 9. Registrar transacción inmutable
    // 10. Disparar notificaciones
  }
}
```

### Flujo de Cálculo
```typescript
interface CommissionCalculation {
  grossAmount: number;        // Comisión bruta
  planMultiplier: number;     // 0.05 | 0.30 | 0.70 | 1.00
  netAmount: number;          // Después de multiplicador
  voluntaryDonation: number;  // Parte donada a causa
  finalAmount: number;        // Lo que recibe el promotor
}
```

## Motor de Comisiones (CommissionEngine)

```typescript
class CommissionEngine {
  calculateN1Commission(
    totalCommission: number,
    promoterPlan: PlanType
  ): CommissionCalculation {
    const multiplier = this.planRules.getMultiplier(promoterPlan);
    const netAmount = totalCommission * multiplier;
    return { grossAmount: totalCommission, planMultiplier: multiplier, netAmount };
  }

  calculateN2Commission(
    totalCommission: number,
    n2Percent: number,
    affiliatorPlan: PlanType
  ): CommissionCalculation {
    const n2Gross = totalCommission * (n2Percent / 100);
    const multiplier = this.planRules.getMultiplier(affiliatorPlan);
    const netAmount = n2Gross * multiplier;
    return { grossAmount: n2Gross, planMultiplier: multiplier, netAmount };
  }
}
```

## Motor de Planes (PlanRulesEngine)

```typescript
class PlanRulesEngine {
  private readonly MULTIPLIERS = {
    free: 0.05,
    pro: 0.30,
    premium: 0.70,
    elite: 1.00
  };

  getMultiplier(plan: PlanType): number {
    return this.MULTIPLIERS[plan];
  }

  canCreateProduct(plan: PlanType): boolean {
    return plan !== 'free';
  }

  canCreatePrize(plan: PlanType): boolean {
    return plan === 'premium' || plan === 'elite';
  }

  canHaveShop(plan: PlanType): boolean {
    return plan !== 'free';
  }

  getFeedPriority(plan: PlanType): number {
    return { free: 1, pro: 2, premium: 3, elite: 4 }[plan];
  }
}
```

## Motor de Causas (CauseEngine)

```typescript
class CauseEngine {
  async assignActiveCause(userId: string, causeId: string): Promise<void> {
    // Validar que la causa existe y está activa
    // Actualizar user.active_cause_id
    // Registrar en auditoría
  }

  async distributeDonation(donation: Donation): Promise<void> {
    // Incrementar cause.total_raised
    // Si hay campaña, incrementar campaign.current_amount
    // Registrar en auditoría
  }
}
```

## Motor de Sorteos (RaffleEngine)

```typescript
class RaffleEngine {
  async selectWinner(raffleId: string): Promise<RaffleWinner> {
    // Obtener todas las entradas
    // Generar seed aleatorio (auditable)
    // Seleccionar ganador
    // Registrar en raffle_winners
    // Auditar proceso completo
    // Notificar ganador
  }
}
```

## Motor de Feed (FeedEngine)

```typescript
class FeedEngine {
  async generateFeed(userId: string): Promise<FeedItem[]> {
    // Obtener preferencias usuario
    // Calcular score por item:
    //   - Plan del creador (Elite > Premium > Pro > Free)
    //   - Actividad reciente
    //   - Relevancia
    // Ordenar por score
    // Aplicar personalización
  }
}
```

## Motor de Auditoría (AuditEngine)

```typescript
class AuditEngine {
  async log(entry: AuditEntry): Promise<void> {
    // NUNCA modificar registros existentes
    // Generar hash de integridad
    // Insertar nuevo registro
  }
}
```

## Motor de Notificaciones (NotificationEngine)

```typescript
class NotificationEngine {
  async send(notification: NotificationInput): Promise<void> {
    // Determinar canal (email, push, interno)
    // Encolar para envío asíncrono
    // Registrar en tabla notifications
  }
}
```
