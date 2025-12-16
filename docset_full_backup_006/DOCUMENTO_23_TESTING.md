# DOCUMENTO 23 — TESTING Y QA

## 23.1. Estrategia de Testing

### Pirámide de Tests
1. **Unit Tests** (70%) - Motores, servicios, utils
2. **Integration Tests** (20%) - API endpoints, BD
3. **E2E Tests** (10%) - Flujos críticos completos

### Cobertura Mínima
- Motores económicos: 90%
- Servicios críticos: 80%
- Controllers: 70%
- Global: 80%

## 23.2. Unit Testing

### Framework: Jest
```typescript
// economic.engine.spec.ts
describe('EconomicEngine', () => {
  describe('calculateN1Commission', () => {
    it('should apply Free plan multiplier (5%)', () => {
      const result = engine.calculateN1(100, 'free');
      expect(result.netAmount).toBe(5);
    });

    it('should apply Elite plan multiplier (100%)', () => {
      const result = engine.calculateN1(100, 'elite');
      expect(result.netAmount).toBe(100);
    });

    it('should never create N3 commission', () => {
      const result = engine.calculateCommissions(transaction);
      expect(result.n3).toBeUndefined();
    });
  });
});
```

### Mocking
```typescript
jest.mock('../repositories/transaction.repository');
const mockTransactionRepo = {
  create: jest.fn(),
  findById: jest.fn(),
};
```

## 23.3. Integration Testing

### Framework: Supertest + Jest
```typescript
// auth.e2e-spec.ts
describe('Auth (e2e)', () => {
  it('/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      })
      .expect(201);

    expect(response.body.user.plan_type).toBe('free');
    expect(response.body.access_token).toBeDefined();
  });

  it('should assign referrer on registration', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'referred@example.com',
        password: 'SecurePass123!',
        name: 'Referred User',
        referral_code: 'PROMO123'
      })
      .expect(201);

    expect(response.body.user.referred_by).toBe(promoterId);
  });
});
```

## 23.4. E2E Testing

### Flujos Críticos
1. **Registro completo con referido**
2. **Compra con comisiones N1+N2**
3. **Upgrade de plan**
4. **Donación a causa**
5. **Participación en sorteo**

### Cypress/Playwright
```typescript
describe('Purchase Flow', () => {
  it('should complete purchase and generate commissions', () => {
    cy.login('buyer@test.com');
    cy.visit('/marketplace');
    cy.get('[data-testid="product-1"]').click();
    cy.get('[data-testid="buy-button"]').click();
    cy.get('[data-testid="donation-input"]').type('5');
    cy.get('[data-testid="checkout-button"]').click();
    cy.url().should('include', '/success');
    
    // Verify commissions created
    cy.login('promoter@test.com');
    cy.visit('/dashboard/commissions');
    cy.contains('Pending: $3.00'); // 30% for Pro
  });
});
```

## 23.5. Tests Anti-Fraude

```typescript
describe('Anti-Fraud', () => {
  it('should detect self-referral', async () => {
    const result = await antifraudService.checkReferral(
      userId,
      referralCode,
      { ip: '192.168.1.1', deviceId: 'device123' }
    );
    expect(result.suspicious).toBe(true);
  });

  it('should block rapid successive transactions', async () => {
    for (let i = 0; i < 10; i++) {
      await transactionService.create(smallTransaction);
    }
    await expect(transactionService.create(smallTransaction))
      .rejects.toThrow('Rate limit exceeded');
  });
});
```

## 23.6. Test Database

### Estrategia
- Base de datos de test separada
- Seed data consistente
- Cleanup después de cada test suite
- Transacciones rollback en integration tests

```typescript
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE users CASCADE`;
  await seedTestData();
});
```

## 23.7. CI/CD Integration

```yaml
# .github/workflows/test.yml
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:15
  steps:
    - uses: actions/checkout@v3
    - run: npm ci
    - run: npm run test:unit
    - run: npm run test:integration
    - run: npm run test:e2e
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v3
```

## 23.8. QA Checklist

### Pre-Deploy
- [ ] Todos los tests pasan
- [ ] Cobertura >= 80%
- [ ] No vulnerabilidades críticas
- [ ] Lint sin errores
- [ ] Build exitoso

### Post-Deploy
- [ ] Health check OK
- [ ] Smoke tests pasan
- [ ] Métricas normales
- [ ] No errores en logs
