# DOCUMENTO 39 – MÓDULO 0.a.39

## PANEL DE ADMINISTRACIÓN DE LA PLATAFORMA (CONTROL GLOBAL, SUPERVISIÓN Y GOBERNANZA)

**Documento operativo crítico**
**Documento de control central del sistema**
**Dirigido a:** Programador IA (nivel no experto)

---

## 1. Para qué existe este documento (peras y manzanas)

Este documento responde a una pregunta básica pero vital:

> **¿Cómo controla la plataforma TODO lo que pasa sin depender de parches, bases de datos manuales o improvisaciones?**

Sin un panel de administración bien definido:
- los problemas se descubren tarde,
- los fraudes escalan,
- los bloqueos se hacen "a mano",
- el sistema se vuelve inmanejable.

👉 **Este documento define qué ve el administrador, qué puede hacer y qué NO puede hacer.**

---

## 2. Principio rector del panel de administración

> **El administrador NO gestiona detalles operativos uno por uno, gestiona ESTADOS, EXCEPCIONES y RIESGOS.**

Esto evita:
- micromanagement,
- errores humanos,
- cambios arbitrarios.

```
┌─────────────────────────────────────────────────────────────┐
│            PRINCIPIO DEL PANEL DE ADMINISTRACIÓN            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     El admin gestiona:                                      │
│     ✅ ESTADOS (cambios de fase)                            │
│     ✅ EXCEPCIONES (lo que sale de lo normal)               │
│     ✅ RIESGOS (alertas, flags, incidentes)                 │
│                                                             │
│     El admin NO gestiona:                                   │
│     ❌ Detalles uno por uno                                 │
│     ❌ Modificaciones directas de datos                     │
│     ❌ Cambios que el sistema debe hacer solo               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Roles administrativos (no todos ven lo mismo)

El sistema debe permitir **roles de administración** (aunque al inicio sea uno solo).

### Roles posibles (conceptuales):

| Rol | Acceso | Descripción |
|-----|--------|-------------|
| **Admin Global** | Todo | Control total de la plataforma |
| **Admin Operativo** | Incidentes, soporte, usuarios | Gestión del día a día |
| **Admin Financiero** | Dinero, liberaciones, KYC | Control de flujos financieros |
| **Admin Legal / Compliance** | KYC, consentimientos, docs legales | Cumplimiento normativo |

> 👉 **Aunque inicialmente sea una sola persona, el diseño debe permitir separar roles.**

### Tabla: `admin_roles`

```sql
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificación
    role_code VARCHAR(50) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Permisos (JSON array de códigos de permiso)
    permissions JSONB NOT NULL DEFAULT '[]',
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Roles por defecto
INSERT INTO admin_roles (role_code, role_name, permissions) VALUES
('ADMIN_GLOBAL', 'Administrador Global', '["*"]'),
('ADMIN_OPS', 'Administrador Operativo', '["users.view", "users.suspend", "incidents.manage", "raffles.view", "raffles.suspend"]'),
('ADMIN_FINANCE', 'Administrador Financiero', '["money.view", "money.approve", "kyc.manage", "withdrawals.manage"]'),
('ADMIN_LEGAL', 'Administrador Legal', '["kyc.view", "consents.view", "legal_docs.manage", "compliance.manage"]');
```

### Tabla: `admin_users`

```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Usuario base
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Rol asignado
    role_id UUID NOT NULL REFERENCES admin_roles(id),
    
    -- Estado
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Auditoría
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id)
);
```

---

## 4. Dashboard principal del administrador

El panel principal debe mostrar **alertas, no solo métricas**.

### Información mínima visible:

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD ADMIN                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🚨 ALERTAS CRÍTICAS                                        │
│  ├─ Incidentes activos: 3                                   │
│  ├─ Sorteos suspendidos: 1                                  │
│  └─ Usuarios con HIGH_RISK: 2                               │
│                                                             │
│  💰 DINERO                                                  │
│  ├─ Retenido total: €12,450                                 │
│  ├─ Pendiente verificación: €3,200                          │
│  └─ Listo para liberar: €8,100                              │
│                                                             │
│  ⚠️ PENDIENTES                                              │
│  ├─ Causas no verificadas: 4                                │
│  ├─ KYC pendientes: 12                                      │
│  └─ Mensajes fallidos: 8                                    │
│                                                             │
│  📊 MÉTRICAS (últimas 24h)                                  │
│  ├─ Nuevos usuarios: 45                                     │
│  ├─ Sorteos ejecutados: 3                                   │
│  └─ Donaciones: €1,890                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> 👉 **Lo importante arriba, lo normal abajo.**

### API: Dashboard stats

```typescript
// GET /api/admin/dashboard
interface AdminDashboard {
  alerts: {
    activeIncidents: number;
    suspendedRaffles: number;
    highRiskUsers: number;
    criticalFlags: number;
  };
  money: {
    totalRetained: number;
    pendingVerification: number;
    readyToRelease: number;
    totalBlocked: number;
  };
  pending: {
    unverifiedCauses: number;
    pendingKyc: number;
    failedMessages: number;
    openDisputes: number;
  };
  metrics24h: {
    newUsers: number;
    executedRaffles: number;
    totalDonations: number;
    totalParticipations: number;
  };
}
```

---

## 5. Gestión de USUARIOS (vista administrativa)

### El admin debe poder ver:

| Campo | Descripción |
|-------|-------------|
| Listado de usuarios | Con filtros y búsqueda |
| Estado | Activo, Suspendido, Bloqueado |
| Flags antifraude | Todos los flags activos |
| Estado KYC | NOT_VERIFIED, PENDING, VERIFIED, REJECTED |
| Historial | Logs resumidos de actividad |

### Acciones permitidas:

| Acción | Código | Descripción |
|--------|--------|-------------|
| ✅ Suspender usuario | `SUSPEND_USER` | Suspensión temporal |
| ✅ Bloquear usuario | `BLOCK_USER` | Bloqueo permanente |
| ✅ Requerir KYC Nivel 2 | `REQUIRE_KYC_L2` | Verificación adicional |
| ✅ Levantar suspensión | `UNSUSPEND_USER` | Si aplica tras revisión |
| ❌ Editar dinero manualmente | - | **PROHIBIDO** |

### API: Gestión de usuarios

```typescript
// GET /api/admin/users
interface AdminUserListParams {
  status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  kycStatus?: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  hasFlags?: boolean;
  flagCode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// GET /api/admin/users/:userId
interface AdminUserDetail {
  user: User;
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  kycStatus: KycStatus;
  flags: EntityFlag[];
  stats: {
    totalParticipations: number;
    totalDonations: number;
    totalWinnings: number;
    moneyBalance: number;
  };
  recentActivity: AuditLogSummary[];
}

// POST /api/admin/users/:userId/suspend
// POST /api/admin/users/:userId/block
// POST /api/admin/users/:userId/unsuspend
// POST /api/admin/users/:userId/require-kyc-l2
```

---

## 6. Gestión de SORTEOS

### El admin puede ver:

| Campo | Descripción |
|-------|-------------|
| Sorteos activos | En curso |
| Sorteos finalizados | Con ganador |
| Sorteos suspendidos | Por revisión o fraude |
| Reglas del sorteo | Configuración |
| Ganador | Si ya se ejecutó |
| Participación agregada | Total participantes, boletos |
| Flags de fraude | Si existen |

### Acciones permitidas:

| Acción | Código | Descripción |
|--------|--------|-------------|
| ✅ Suspender sorteo | `SUSPEND_RAFFLE` | Detener ejecución |
| ✅ Cancelar sorteo | `CANCEL_RAFFLE` | Con motivo obligatorio |
| ✅ Forzar revisión manual | `MANUAL_REVIEW_RAFFLE` | Antes de ejecución |
| ❌ Cambiar ganador | - | **PROHIBIDO** |

### API: Gestión de sorteos

```typescript
// GET /api/admin/raffles
interface AdminRaffleListParams {
  status?: 'DRAFT' | 'ACTIVE' | 'EXECUTED' | 'SUSPENDED' | 'CANCELLED';
  hasFlags?: boolean;
  creatorId?: string;
  page?: number;
  limit?: number;
}

// GET /api/admin/raffles/:raffleId
interface AdminRaffleDetail {
  raffle: Raffle;
  creator: UserSummary;
  prize: Prize;
  cause: Cause;
  stats: {
    totalParticipants: number;
    totalTickets: number;
    totalDonations: number;
  };
  winner?: UserSummary;
  executionLog?: RaffleExecutionLog;
  flags: EntityFlag[];
}

// POST /api/admin/raffles/:raffleId/suspend
interface SuspendRaffleRequest {
  reason: string;
}

// POST /api/admin/raffles/:raffleId/cancel
interface CancelRaffleRequest {
  reason: string;
  refundParticipants?: boolean;
}
```

---

## 7. Gestión de PREMIOS

### El admin puede ver:

| Campo | Descripción |
|-------|-------------|
| Tipo de premio | Físico, digital, experiencia |
| Origen | Plataforma o usuario |
| Valor estimado | Monto declarado |
| Estado de entrega | Pendiente, Declarado, Confirmado |
| Evidencias subidas | Fotos, tracking, etc. |
| Disputas abiertas | Si hay conflicto |

### Acciones permitidas:

| Acción | Código | Descripción |
|--------|--------|-------------|
| ✅ Marcar como "en disputa" | `FLAG_PRIZE_DISPUTE` | Activar flag |
| ✅ Solicitar evidencia adicional | `REQUEST_EVIDENCE` | Al organizador |
| ✅ Bloquear liberación de dinero | `BLOCK_PRIZE_MONEY` | Asociado al premio |

### API: Gestión de premios

```typescript
// GET /api/admin/prizes
interface AdminPrizeListParams {
  status?: 'PENDING' | 'DECLARED' | 'CONFIRMED' | 'DISPUTED';
  origin?: 'PLATFORM' | 'USER';
  hasDispute?: boolean;
  page?: number;
  limit?: number;
}

// GET /api/admin/prizes/:prizeId
interface AdminPrizeDetail {
  prize: Prize;
  raffle: RaffleSummary;
  creator: UserSummary;
  winner?: UserSummary;
  delivery: {
    status: 'PENDING' | 'DECLARED' | 'CONFIRMED' | 'DISPUTED';
    declaredAt?: Date;
    confirmedAt?: Date;
    trackingNumber?: string;
  };
  evidences: PrizeEvidence[];
  disputes: Incident[];
  relatedMoney: MoneySummary[];
}

// POST /api/admin/prizes/:prizeId/flag-dispute
// POST /api/admin/prizes/:prizeId/request-evidence
// POST /api/admin/prizes/:prizeId/block-money
```

---

## 8. Gestión de CAUSAS

### El admin puede ver:

| Campo | Descripción |
|-------|-------------|
| Causas de plataforma | Causas oficiales |
| Causas de usuarios | Creadas por usuarios |
| Estado | Pendiente, Verificada, Rechazada |
| Documentación | Subida por el creador |
| Dinero asociado | Y su estado |

### Acciones permitidas:

| Acción | Código | Descripción |
|--------|--------|-------------|
| ✅ Aprobar causa | `APPROVE_CAUSE` | Pasa a verificada |
| ✅ Rechazar causa | `REJECT_CAUSE` | Con motivo |
| ✅ Bloquear causa | `BLOCK_CAUSE` | Por fraude confirmado |
| ✅ Retirar del catálogo | `UNPUBLISH_CAUSE` | Sin eliminar |

> 👉 **Sin causa verificada, no hay liberación de fondos.**

### API: Gestión de causas

```typescript
// GET /api/admin/causes
interface AdminCauseListParams {
  status?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'BLOCKED';
  origin?: 'PLATFORM' | 'USER';
  page?: number;
  limit?: number;
}

// GET /api/admin/causes/:causeId
interface AdminCauseDetail {
  cause: Cause;
  creator?: UserSummary;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'BLOCKED';
  verification: {
    documents: CauseDocument[];
    verifiedAt?: Date;
    verifiedBy?: string;
    rejectionReason?: string;
  };
  stats: {
    totalRaffles: number;
    totalDonations: number;
    totalRaised: number;
  };
  relatedMoney: {
    retained: number;
    pending: number;
    approved: number;
    released: number;
  };
  flags: EntityFlag[];
}

// POST /api/admin/causes/:causeId/approve
// POST /api/admin/causes/:causeId/reject
interface RejectCauseRequest {
  reason: string;
}
// POST /api/admin/causes/:causeId/block
// POST /api/admin/causes/:causeId/unpublish
```

---

## 9. Gestión de DINERO (visión, no manipulación)

### El admin debe poder ver:

| Vista | Descripción |
|-------|-------------|
| Por estado | GENERADO, RETENIDO, PENDIENTE, APROBADO, LIBERADO, BLOQUEADO |
| Por usuario | Dinero de un usuario específico |
| Por causa | Dinero de una causa específica |
| Por sorteo | Dinero de un sorteo específico |

### Acciones permitidas:

| Acción | Código | Descripción |
|--------|--------|-------------|
| ✅ Aprobar liberación | `APPROVE_RELEASE` | Si checklist completo |
| ✅ Bloquear liberación | `BLOCK_RELEASE` | Con motivo |
| ✅ Escalar a revisión manual | `ESCALATE_REVIEW` | Para casos complejos |
| ❌ Editar montos | - | **PROHIBIDO** |
| ❌ Crear dinero manualmente | - | **PROHIBIDO** |
| ❌ Borrar transacciones | - | **PROHIBIDO** |

```
┌─────────────────────────────────────────────────────────────┐
│              GESTIÓN DE DINERO - ADMIN                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  El admin PUEDE:                                            │
│  ├─ Ver todos los estados                                   │
│  ├─ Filtrar por usuario/causa/sorteo                        │
│  ├─ Aprobar liberación (si todo OK)                         │
│  ├─ Bloquear liberación (con motivo)                        │
│  └─ Escalar a revisión                                      │
│                                                             │
│  El admin NO PUEDE:                                         │
│  ├─ Editar montos                                           │
│  ├─ Crear dinero                                            │
│  ├─ Borrar transacciones                                    │
│  └─ Modificar histórico                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### API: Gestión de dinero

```typescript
// GET /api/admin/money
interface AdminMoneyListParams {
  state?: 'GENERADO' | 'RETENIDO' | 'PENDIENTE' | 'APROBADO' | 'LIBERADO' | 'BLOQUEADO';
  userId?: string;
  causeId?: string;
  raffleId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// GET /api/admin/money/summary
interface AdminMoneySummary {
  byState: {
    state: string;
    count: number;
    totalAmount: number;
  }[];
  totals: {
    totalGenerated: number;
    totalRetained: number;
    totalReleased: number;
    totalBlocked: number;
  };
}

// POST /api/admin/money/:moneyId/approve-release
interface ApproveReleaseRequest {
  notes?: string;
}

// POST /api/admin/money/:moneyId/block-release
interface BlockReleaseRequest {
  reason: string;
}

// POST /api/admin/money/:moneyId/escalate
interface EscalateRequest {
  reason: string;
  priority?: 'HIGH' | 'CRITICAL';
}
```

---

## 10. Gestión de INCIDENTES y FRAUDE (relación con Documento 38)

### El panel debe permitir:

| Funcionalidad | Descripción |
|---------------|-------------|
| Ver incidentes abiertos | Listado con filtros |
| Cambiar estado | REPORTED → TRIAGED → UNDER_REVIEW → etc. |
| Adjuntar notas internas | Documentación del caso |
| Aplicar acciones | Del catálogo definido en Doc 38 |
| Asignar a revisor | Para seguimiento |

> 👉 **Todo cambio genera log automático (Doc 37).**

### API: Gestión de incidentes

```typescript
// GET /api/admin/incidents
interface AdminIncidentListParams {
  status?: 'REPORTED' | 'TRIAGED' | 'UNDER_REVIEW' | 'ACTION_TAKEN' | 'RESOLVED' | 'REJECTED';
  type?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo?: string;
  page?: number;
  limit?: number;
}

// GET /api/admin/incidents/:incidentId
interface AdminIncidentDetail {
  incident: Incident;
  reporter: UserSummary;
  affectedEntity: {
    type: string;
    id: string;
    details: any;
  };
  timeline: IncidentEvent[];
  actions: IncidentAction[];
  notes: IncidentNote[];
  evidences: Evidence[];
}

// POST /api/admin/incidents/:incidentId/triage
interface TriageRequest {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignTo?: string;
  notes?: string;
}

// POST /api/admin/incidents/:incidentId/action
interface ApplyActionRequest {
  actionCode: string;
  targetType?: string;
  targetId?: string;
  notes: string;
}

// POST /api/admin/incidents/:incidentId/resolve
interface ResolveIncidentRequest {
  resolutionType: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'PARTIAL_RESOLUTION' | 'NO_ACTION_NEEDED';
  notes: string;
}
```

---

## 11. Gestión de KYC y VERIFICACIÓN

### El admin puede:

| Funcionalidad | Descripción |
|---------------|-------------|
| Ver usuarios pendientes | Lista de KYC pendientes |
| Ver resultado proveedor | Respuesta de Veriff/Onfido/etc. |
| Forzar verificación adicional | Pedir más documentos |
| Marcar como rechazado/aprobado | Según reglas |

### El admin NO puede:

| ❌ Prohibido | Razón |
|--------------|-------|
| Subir documentos por el usuario | El usuario debe hacerlo |
| Aprobar sin documentos | Violación de compliance |
| Saltar verificación de proveedor | Riesgo legal |

### API: Gestión de KYC

```typescript
// GET /api/admin/kyc/pending
interface AdminKycListParams {
  status?: 'PENDING' | 'IN_REVIEW' | 'PROVIDER_RESPONSE';
  page?: number;
  limit?: number;
}

// GET /api/admin/kyc/:userId
interface AdminKycDetail {
  user: UserSummary;
  kycStatus: KycStatus;
  currentLevel: 'NONE' | 'BASIC' | 'FULL';
  verifications: {
    id: string;
    provider: string;
    startedAt: Date;
    completedAt?: Date;
    result: 'PENDING' | 'APPROVED' | 'REJECTED';
    providerResponse?: any;
    documents: KycDocument[];
  }[];
  triggers: string[]; // Por qué se pidió KYC
}

// POST /api/admin/kyc/:userId/require-additional
interface RequireAdditionalRequest {
  reason: string;
  requiredDocuments: string[];
}

// POST /api/admin/kyc/:userId/manual-approve
interface ManualApproveRequest {
  notes: string;
  approvalLevel: 'BASIC' | 'FULL';
}

// POST /api/admin/kyc/:userId/reject
interface RejectKycRequest {
  reason: string;
}
```

---

## 12. Gestión de MENSAJERÍA (supervisión)

### El admin debe ver:

| Métrica | Descripción |
|---------|-------------|
| Mensajes enviados | Total y por periodo |
| Mensajes fallidos | Con razón del fallo |
| Por idioma | Distribución |
| Por canal | Push, email, internal |
| Volumen por periodo | Gráfica temporal |

> 👉 **Esto sirve para: detectar spam, detectar errores, ajustar reglas.**

### API: Supervisión de mensajería

```typescript
// GET /api/admin/messaging/stats
interface MessagingStats {
  period: '24h' | '7d' | '30d';
  sent: number;
  delivered: number;
  failed: number;
  byChannel: {
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
  }[];
  byLanguage: {
    language: string;
    count: number;
  }[];
  failureReasons: {
    reason: string;
    count: number;
  }[];
}

// GET /api/admin/messaging/failed
interface FailedMessageListParams {
  channel?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}
```

---

## 13. Gestión de CONTENIDO LEGAL

### El admin puede:

| Funcionalidad | Descripción |
|---------------|-------------|
| Subir nuevas versiones | De TOS, Privacy, Bases |
| Versionar documentos | v1.0 → v1.1 → v2.0 |
| Activar nueva versión | Para nuevas aceptaciones |
| Ver histórico | Todas las versiones |

> 👉 **El sistema debe: mantener histórico, no borrar versiones antiguas.**

### API: Gestión de documentos legales

```typescript
// GET /api/admin/legal-docs
interface LegalDocListParams {
  type?: 'TOS' | 'PRIVACY' | 'RAFFLE_BASES' | 'DONATION_TERMS';
  isCurrent?: boolean;
}

// GET /api/admin/legal-docs/:docId
interface LegalDocDetail {
  id: string;
  type: string;
  version: string;
  title: string;
  content: string;
  summary?: string;
  isCurrent: boolean;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  createdAt: Date;
  createdBy: UserSummary;
  acceptanceCount: number; // Cuántos usuarios aceptaron esta versión
}

// POST /api/admin/legal-docs
interface CreateLegalDocRequest {
  type: 'TOS' | 'PRIVACY' | 'RAFFLE_BASES' | 'DONATION_TERMS';
  version: string;
  title: string;
  content: string;
  summary?: string;
  effectiveFrom: Date;
  setAsCurrent?: boolean;
}

// POST /api/admin/legal-docs/:docId/activate
interface ActivateDocRequest {
  effectiveFrom?: Date; // Default: now
}
```

---

## 14. Qué NO debe permitir el panel (reglas duras)

```
┌─────────────────────────────────────────────────────────────┐
│              PROHIBICIONES DEL PANEL ADMIN                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ❌ Cambiar ganadores de sorteos                            │
│  ❌ Editar logs de auditoría                                │
│  ❌ Borrar historiales de usuarios                          │
│  ❌ Modificar backups                                       │
│  ❌ Liberar dinero sin checklist completo                   │
│  ❌ Editar montos de transacciones                          │
│  ❌ Crear dinero manualmente                                │
│  ❌ Subir documentos KYC por el usuario                     │
│  ❌ Eliminar incidentes                                     │
│  ❌ Modificar timestamps                                    │
│                                                             │
│  Estas restricciones son TÉCNICAS, no solo de política.     │
│  El sistema NO debe ofrecer estas opciones.                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 15. Seguridad del panel de administración

### Requisitos de seguridad:

| Requisito | Implementación |
|-----------|----------------|
| Acceso restringido | Solo usuarios con rol admin |
| Autenticación fuerte | 2FA obligatorio |
| Sesiones limitadas | Timeout de inactividad |
| IP whitelist | Opcional, recomendado |
| Registro de acciones | Todo se loguea |

> 👉 **Cada acción del admin también se loguea.**

### Middleware de seguridad:

```typescript
// admin-auth.middleware.ts

@Injectable()
export class AdminAuthMiddleware implements NestMiddleware {
  
  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    
    // 1. Verificar que es admin
    const adminUser = await this.adminService.getAdminUser(user.id);
    if (!adminUser || !adminUser.isActive) {
      throw new ForbiddenException('Acceso denegado');
    }
    
    // 2. Verificar 2FA
    if (!req.session.twoFactorVerified) {
      throw new UnauthorizedException('Se requiere verificación 2FA');
    }
    
    // 3. Adjuntar rol y permisos
    req.adminRole = adminUser.role;
    req.adminPermissions = adminUser.role.permissions;
    
    // 4. Log de acceso
    await this.auditService.log({
      eventType: 'ADMIN_ACCESS',
      entityType: 'ADMIN_PANEL',
      entityId: req.path,
      actorId: user.id,
      actorType: 'ADMIN',
      metadata: {
        method: req.method,
        path: req.path,
        ip: req.ip
      },
      category: 'SECURITY'
    });
    
    next();
  }
}
```

### Log de acciones administrativas:

```typescript
// admin-action.interceptor.ts

@Injectable()
export class AdminActionInterceptor implements NestInterceptor {
  
  async intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    
    // Solo loguear mutaciones (POST, PUT, DELETE)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const result = await lastValueFrom(next.handle());
      
      await this.auditService.log({
        eventType: 'ADMIN_ACTION',
        entityType: this.extractEntityType(req.path),
        entityId: req.params.id || 'N/A',
        actorId: req.user.id,
        actorType: 'ADMIN',
        metadata: {
          action: req.path,
          method: req.method,
          body: this.sanitizeBody(req.body),
          result: result?.id || 'success'
        },
        category: 'OPERATIONAL'
      });
      
      return result;
    }
    
    return next.handle();
  }
}
```

---

## 16. Checklist para el programador IA

### Antes de cerrar este módulo:

| ✅ | Requisito |
|----|-----------|
| ☐ | Dashboard con alertas (no solo métricas) |
| ☐ | Gestión de usuarios (ver, suspender, bloquear) |
| ☐ | Gestión de sorteos (ver, suspender, cancelar) |
| ☐ | Gestión de premios (ver, disputas, evidencias) |
| ☐ | Gestión de causas (aprobar, rechazar, bloquear) |
| ☐ | Visión de dinero por estados (sin editar montos) |
| ☐ | Gestión de incidentes (estados, acciones) |
| ☐ | Gestión de KYC (ver, requerir adicional) |
| ☐ | Supervisión de mensajería |
| ☐ | Gestión de documentos legales (versiones) |
| ☐ | Roles y permisos definidos |
| ☐ | Seguridad: 2FA, logs de acciones |
| ☐ | Prohibiciones técnicas implementadas |

---

## 17. CHECKPOINT DE RESPALDO (ADMIN)

### IA del programador:

**Antes de implementar el panel administrativo:**

1. ✅ Realiza respaldo completo del proyecto.
2. ✅ No borres ni edites backups previos.
3. ✅ Registra:

```
CHECKPOINT: DOCUMENTO_39_ADMIN_PANEL
VERSION: docset_full_backup_009
```

---

## 18. Resumen ejecutivo

### Estructura del panel admin:

| Sección | Funcionalidad principal |
|---------|------------------------|
| **Dashboard** | Alertas + métricas |
| **Usuarios** | Estados, flags, KYC |
| **Sorteos** | Supervisión, suspensión |
| **Premios** | Entregas, disputas |
| **Causas** | Verificación, aprobación |
| **Dinero** | Visión por estados |
| **Incidentes** | Gestión completa |
| **KYC** | Verificaciones pendientes |
| **Mensajería** | Supervisión y errores |
| **Legal** | Documentos versionados |

### Reglas de oro:

1. **Admin gestiona ESTADOS, no detalles**
2. **Todo se loguea**
3. **Sin checklist = Sin liberación**
4. **Prohibiciones son TÉCNICAS, no políticas**
5. **Roles separables desde el diseño**

---

## 19. Cierre

Este panel es el **centro nervioso de la plataforma**.

> Sin él, el sistema existe… pero no se gobierna.

---

```
=========================================================
FIN DEL DOCUMENTO 39
MÓDULO 0.a.39 — PANEL DE ADMINISTRACIÓN
=========================================================
Versión: 1.0
Última actualización: 14 de diciembre de 2025
Backup: docset_full_backup_009
=========================================================
```
