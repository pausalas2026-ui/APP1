# DOCUMENTO 16 — IMPLEMENTACIÓN DE MOTORES

## Motor 1: Motor Económico

### Función Principal
```typescript
function calculateTransaction(input: TransactionInput): TransactionBreakdown {
  // 1. Calcular subtotal
  const subtotal = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0);
  
  // 2. Calcular donación
  const donationAmount = round(subtotal * donationPercentage, 2);
  
  // 3. Calcular impuestos
  const taxableAmount = subtotal + donationAmount;
  const taxAmount = round(taxableAmount * taxRate, 2);
  
  // 4. Total
  const total = round(subtotal + donationAmount + taxAmount, 2);
  
  // 5. Comisión plataforma
  const platformFee = round(subtotal * platformPercentage, 2);
  
  // 6. Vendedor recibe
  const sellerReceives = round(subtotal - platformFee, 2);
  
  // 7. Entradas sorteo
  const raffleEntries = Math.floor(total);
  
  return { subtotal, donationAmount, taxAmount, total, 
           platformFee, sellerReceives, raffleEntries };
}
```

## Motor 2: Motor de Comisiones

### Cálculo Comisiones MLM
```typescript
function calculateCommissions(
  transaction: Transaction,
  promoter: User | null,
  affiliator: User | null
): Commission[] {
  const commissions: Commission[] = [];
  
  // Nivel 1: Promotor
  if (promoter) {
    const planMultiplier = getPlanMultiplier(promoter.plan);
    const baseRate = getSettings('commission_rate_n1'); // ej: 0.05
    const amount = round(transaction.subtotal * baseRate * planMultiplier, 2);
    
    commissions.push({
      beneficiary: promoter.id,
      level: 1,
      rate: baseRate,
      planMultiplier,
      amount,
      status: 'pending'
    });
  }
  
  // Nivel 2: Afiliador (1% fijo)
  if (affiliator) {
    const amount = round(transaction.subtotal * 0.01, 2);
    
    commissions.push({
      beneficiary: affiliator.id,
      level: 2,
      rate: 0.01,
      planMultiplier: 1,
      amount,
      status: 'pending'
    });
  }
  
  return commissions;
}

function getPlanMultiplier(plan: string): number {
  const multipliers = {
    free: 0.05,     // 5%
    pro: 0.30,      // 30%
    premium: 0.70,  // 70%
    elite: 1.00     // 100%
  };
  return multipliers[plan] ?? 0.05;
}
```

## Motor 3: Motor de Donaciones

### Registro de Donación
```typescript
function processDonation(
  transaction: Transaction,
  causeId: UUID,
  percentage: number
): Donation {
  const amount = round(transaction.subtotal * percentage, 2);
  
  // Crear registro
  const donation = createDonation({
    transactionId: transaction.id,
    causeId,
    donorId: transaction.buyerId,
    amount,
    percentageApplied: percentage
  });
  
  // Actualizar progreso causa
  updateCauseProgress(causeId, amount);
  
  // Auditar
  auditLog('donation_created', donation);
  
  return donation;
}
```

## Motor 4: Motor de Causas

### Progreso de Causa
```typescript
function updateCauseProgress(causeId: UUID, amount: number): Cause {
  const cause = getCause(causeId);
  
  cause.currentAmount = round(cause.currentAmount + amount, 2);
  
  if (cause.currentAmount >= cause.goalAmount) {
    cause.status = 'completed';
    notifyONG(cause.ongId, 'goal_reached', cause);
  }
  
  saveCause(cause);
  auditLog('cause_updated', cause);
  
  return cause;
}
```

## Motor 5: Motor del Marketplace

### Validación Publicación
```typescript
function validateProductCreation(seller: User, product: Product): void {
  // Verificar rol
  if (!hasRole(seller, 'seller')) {
    throw new Error('SELLER_ROLE_REQUIRED');
  }
  
  // Verificar plan
  if (seller.plan === 'free') {
    throw new Error('FREE_CANNOT_CREATE_PRODUCTS');
  }
  
  // Verificar límite
  const currentCount = getProductCount(seller.id);
  const limit = getPlanProductLimit(seller.plan);
  
  if (currentCount >= limit) {
    throw new Error('PRODUCT_LIMIT_REACHED');
  }
  
  // Validar datos
  validateProductData(product);
}
```

## Motor 6: Motor de Sorteos

### Ejecución Sorteo
```typescript
function executeRaffle(raffleId: UUID): RaffleResult {
  const raffle = getRaffle(raffleId);
  
  // Verificar estado
  if (raffle.status !== 'active') {
    throw new Error('RAFFLE_NOT_ACTIVE');
  }
  
  // Obtener entradas
  const entries = getRaffleEntries(raffleId);
  
  if (entries.length === 0) {
    throw new Error('NO_ENTRIES');
  }
  
  // Construir pool de tickets
  const ticketPool: UUID[] = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.entriesCount; i++) {
      ticketPool.push(entry.userId);
    }
  }
  
  // Selección aleatoria
  const winnerIndex = secureRandom(0, ticketPool.length - 1);
  const winnerId = ticketPool[winnerIndex];
  
  // Actualizar sorteo
  raffle.winnerId = winnerId;
  raffle.status = 'completed';
  raffle.drawnAt = now();
  
  // Crear registro ganador
  createRaffleWinner({
    raffleId,
    userId: winnerId,
    entriesAtDraw: getEntriesCount(winnerId, raffleId),
    wonAt: now()
  });
  
  // Resetear entradas del ganador
  resetUserEntries(winnerId);
  
  // Notificar
  notifyUser(winnerId, 'raffle_won', raffle);
  
  // Auditar
  auditLog('raffle_completed', raffle);
  
  return raffle;
}
```

## Motor 7: Motor del Feed

### Generar Feed
```typescript
function generateFeed(userId: UUID, page: number): FeedItem[] {
  const events = [];
  
  // Donaciones recientes
  events.push(...getRecentDonations(50));
  
  // Ventas recientes (sin datos sensibles)
  events.push(...getRecentSales(50));
  
  // Ganadores sorteos
  events.push(...getRecentWinners(20));
  
  // Causas completadas
  events.push(...getCompletedCauses(10));
  
  // Mezclar y ordenar por fecha
  return events
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(page * 20, (page + 1) * 20);
}
```

## Motor 8: Motor de Auditoría

### Registro Auditoría
```typescript
function auditLog(
  action: string,
  entity: any,
  oldData?: any
): void {
  const log = {
    actorId: getCurrentUser()?.id,
    action,
    entityType: entity.constructor.name,
    entityId: entity.id,
    oldData: oldData ?? null,
    newData: entity,
    ipAddress: getClientIP(),
    createdAt: now()
  };
  
  saveAuditLog(log);
}
```

## Motor 9: Motor de Planes

### Verificación Permisos
```typescript
function checkPlanPermission(user: User, action: string): boolean {
  const permissions = {
    free: ['buy', 'donate', 'view'],
    pro: ['buy', 'donate', 'view', 'sell', 'promote'],
    premium: ['buy', 'donate', 'view', 'sell', 'promote', 'create_prize'],
    elite: ['buy', 'donate', 'view', 'sell', 'promote', 'create_prize', 'all']
  };
  
  return permissions[user.plan]?.includes(action) ?? false;
}
```

## Motor 10: Motor de Notificaciones

### Envío Notificación
```typescript
async function sendNotification(
  userId: UUID,
  type: string,
  data: any
): Promise<void> {
  // In-app siempre
  await createNotification({
    userId,
    type,
    title: getNotificationTitle(type),
    body: getNotificationBody(type, data),
    data
  });
  
  // Email según tipo
  if (requiresEmail(type)) {
    await sendEmail(userId, type, data);
  }
  
  // Push si configurado
  const prefs = getUserPreferences(userId);
  if (prefs.pushEnabled && prefs.pushTypes.includes(type)) {
    await sendPush(userId, type, data);
  }
}
```
