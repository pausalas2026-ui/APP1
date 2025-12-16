// DOCUMENTO 39 - PANEL DE ADMINISTRACIÓN Y GOBERNANZA
// Tipos y constantes para panel administrativo
// Referencia: DOC 39 secciones 3, 4, 14, 15

// ============================================================================
// ROLES Y PERMISOS (DOC 39 seccion 3)
// ============================================================================

export const ADMIN_ROLE_CODES = [
  'ADMIN_GLOBAL',
  'ADMIN_OPS',
  'ADMIN_FINANCE',
  'ADMIN_LEGAL',
] as const;

export type AdminRoleCode = typeof ADMIN_ROLE_CODES[number];

// Permisos disponibles segun DOC 39 seccion 3
export const ADMIN_PERMISSIONS = {
  // Permisos globales
  ALL: '*',
  
  // Usuarios
  USERS_VIEW: 'users.view',
  USERS_SUSPEND: 'users.suspend',
  USERS_BLOCK: 'users.block',
  USERS_UNSUSPEND: 'users.unsuspend',
  
  // Sorteos
  RAFFLES_VIEW: 'raffles.view',
  RAFFLES_SUSPEND: 'raffles.suspend',
  RAFFLES_CANCEL: 'raffles.cancel',
  
  // Premios
  PRIZES_VIEW: 'prizes.view',
  PRIZES_FLAG_DISPUTE: 'prizes.flag_dispute',
  PRIZES_REQUEST_EVIDENCE: 'prizes.request_evidence',
  
  // Causas
  CAUSES_VIEW: 'causes.view',
  CAUSES_APPROVE: 'causes.approve',
  CAUSES_REJECT: 'causes.reject',
  CAUSES_BLOCK: 'causes.block',
  
  // Dinero
  MONEY_VIEW: 'money.view',
  MONEY_APPROVE: 'money.approve',
  MONEY_BLOCK: 'money.block',
  MONEY_ESCALATE: 'money.escalate',
  
  // KYC
  KYC_VIEW: 'kyc.view',
  KYC_MANAGE: 'kyc.manage',
  KYC_REQUIRE_ADDITIONAL: 'kyc.require_additional',
  
  // Incidentes
  INCIDENTS_VIEW: 'incidents.view',
  INCIDENTS_MANAGE: 'incidents.manage',
  INCIDENTS_ASSIGN: 'incidents.assign',
  
  // Legal
  LEGAL_DOCS_VIEW: 'legal_docs.view',
  LEGAL_DOCS_MANAGE: 'legal_docs.manage',
  
  // Mensajeria
  MESSAGING_VIEW: 'messaging.view',
  
  // Compliance
  COMPLIANCE_VIEW: 'compliance.view',
  COMPLIANCE_MANAGE: 'compliance.manage',
  
  // Withdrawals
  WITHDRAWALS_VIEW: 'withdrawals.view',
  WITHDRAWALS_MANAGE: 'withdrawals.manage',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

// Configuracion por defecto de roles segun DOC 39 seccion 3
export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRoleCode, string[]> = {
  ADMIN_GLOBAL: ['*'],
  ADMIN_OPS: [
    'users.view', 'users.suspend', 
    'incidents.view', 'incidents.manage', 'incidents.assign',
    'raffles.view', 'raffles.suspend',
    'prizes.view', 'prizes.flag_dispute',
    'causes.view',
    'messaging.view',
  ],
  ADMIN_FINANCE: [
    'money.view', 'money.approve', 'money.block', 'money.escalate',
    'kyc.view', 'kyc.manage',
    'withdrawals.view', 'withdrawals.manage',
    'users.view',
  ],
  ADMIN_LEGAL: [
    'kyc.view',
    'legal_docs.view', 'legal_docs.manage',
    'compliance.view', 'compliance.manage',
    'users.view',
  ],
};

// ============================================================================
// DASHBOARD (DOC 39 seccion 4)
// ============================================================================

export interface AdminDashboard {
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

// ============================================================================
// GESTION DE USUARIOS ADMIN (DOC 39 seccion 5)
// ============================================================================

export interface AdminUserListParams {
  status?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  kycStatus?: 'NOT_VERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  hasFlags?: boolean;
  flagCode?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    nombre: string;
    apellidos?: string;
    telefono?: string;
    createdAt: Date;
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED';
  kycStatus?: string;
  flags: Array<{
    id: string;
    flagCode: string;
    reason?: string;
    createdAt: Date;
  }>;
  stats: {
    totalParticipations: number;
    totalDonations: number;
    totalWinnings: number;
    moneyBalance: number;
  };
  recentActivity: Array<{
    eventType: string;
    createdAt: Date;
    metadata?: any;
  }>;
}

// ============================================================================
// GESTION DE SORTEOS ADMIN (DOC 39 seccion 6)
// ============================================================================

export interface AdminRaffleListParams {
  status?: 'BORRADOR' | 'ACTIVO' | 'FINALIZADO' | 'CANCELADO';
  hasFlags?: boolean;
  creatorId?: string;
  page?: number;
  limit?: number;
}

export interface AdminRaffleDetail {
  raffle: {
    id: string;
    codigo: string;
    titulo: string;
    estado: string;
    fechaInicio: Date;
    fechaFin: Date;
  };
  stats: {
    totalParticipants: number;
    totalTickets: number;
    totalDonations: number;
  };
  winner?: {
    id: string;
    email: string;
    nombre: string;
  };
  flags: Array<{
    id: string;
    flagCode: string;
    reason?: string;
  }>;
}

// ============================================================================
// GESTION DE DINERO ADMIN (DOC 39 seccion 9)
// ============================================================================

export interface AdminMoneyListParams {
  state?: 'GENERADO' | 'RETENIDO' | 'PENDIENTE' | 'APROBADO' | 'LIBERADO' | 'BLOQUEADO';
  userId?: string;
  causeId?: string;
  raffleId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface AdminMoneySummary {
  byState: Array<{
    state: string;
    count: number;
    totalAmount: number;
  }>;
  totals: {
    totalGenerated: number;
    totalRetained: number;
    totalReleased: number;
    totalBlocked: number;
  };
}

// ============================================================================
// GESTION DE KYC ADMIN (DOC 39 seccion 11)
// ============================================================================

export interface AdminKycListParams {
  status?: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  page?: number;
  limit?: number;
}

export interface AdminKycDetail {
  user: {
    id: string;
    email: string;
    nombre: string;
  };
  kycStatus: string;
  currentLevel: 'NONE' | 'BASIC' | 'FULL';
  verifications: Array<{
    id: string;
    provider: string;
    startedAt: Date;
    completedAt?: Date;
    result: string;
  }>;
  triggers: string[];
}

// ============================================================================
// ESTADISTICAS DE MENSAJERIA (DOC 39 seccion 12)
// ============================================================================

export interface MessagingStats {
  period: '24h' | '7d' | '30d';
  sent: number;
  delivered: number;
  failed: number;
  byChannel: Array<{
    channel: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
  byLanguage: Array<{
    language: string;
    count: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
}

// ============================================================================
// DOCUMENTOS LEGALES (DOC 39 seccion 13)
// ============================================================================

export const LEGAL_DOC_TYPES = [
  'TOS',
  'PRIVACY',
  'RAFFLE_BASES',
  'DONATION_TERMS',
  'COOKIE_POLICY',
] as const;

export type LegalDocType = typeof LEGAL_DOC_TYPES[number];

export interface CreateLegalDocRequest {
  type: LegalDocType;
  version: string;
  title: string;
  content: string;
  summary?: string;
  effectiveFrom: Date;
  setAsCurrent?: boolean;
}

export interface LegalDocDetail {
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
  createdBy: string;
  acceptanceCount: number;
}

// ============================================================================
// PROHIBICIONES TECNICAS (DOC 39 seccion 14)
// ============================================================================

// Acciones PROHIBIDAS que el sistema NO debe permitir
export const ADMIN_PROHIBITED_ACTIONS = [
  'CHANGE_RAFFLE_WINNER',      // Cambiar ganadores de sorteos
  'EDIT_AUDIT_LOGS',           // Editar logs de auditoria
  'DELETE_USER_HISTORY',       // Borrar historiales de usuarios
  'MODIFY_BACKUPS',            // Modificar backups
  'RELEASE_WITHOUT_CHECKLIST', // Liberar dinero sin checklist completo
  'EDIT_TRANSACTION_AMOUNTS',  // Editar montos de transacciones
  'CREATE_MONEY_MANUALLY',     // Crear dinero manualmente
  'UPLOAD_USER_KYC_DOCS',      // Subir documentos KYC por el usuario
  'DELETE_INCIDENTS',          // Eliminar incidentes
  'MODIFY_TIMESTAMPS',         // Modificar timestamps
] as const;

export type ProhibitedAction = typeof ADMIN_PROHIBITED_ACTIONS[number];

// ============================================================================
// ACCIONES PERMITIDAS POR ENTIDAD (DOC 39 secciones 5-9)
// ============================================================================

export const USER_ADMIN_ACTIONS = [
  'SUSPEND_USER',
  'BLOCK_USER',
  'UNSUSPEND_USER',
  'REQUIRE_KYC_L2',
] as const;

export const RAFFLE_ADMIN_ACTIONS = [
  'SUSPEND_RAFFLE',
  'CANCEL_RAFFLE',
  'MANUAL_REVIEW_RAFFLE',
] as const;

export const PRIZE_ADMIN_ACTIONS = [
  'FLAG_PRIZE_DISPUTE',
  'REQUEST_EVIDENCE',
  'BLOCK_PRIZE_MONEY',
] as const;

export const CAUSE_ADMIN_ACTIONS = [
  'APPROVE_CAUSE',
  'REJECT_CAUSE',
  'BLOCK_CAUSE',
  'UNPUBLISH_CAUSE',
] as const;

export const MONEY_ADMIN_ACTIONS = [
  'APPROVE_RELEASE',
  'BLOCK_RELEASE',
  'ESCALATE_REVIEW',
] as const;

export type UserAdminAction = typeof USER_ADMIN_ACTIONS[number];
export type RaffleAdminAction = typeof RAFFLE_ADMIN_ACTIONS[number];
export type PrizeAdminAction = typeof PRIZE_ADMIN_ACTIONS[number];
export type CauseAdminAction = typeof CAUSE_ADMIN_ACTIONS[number];
export type MoneyAdminAction = typeof MONEY_ADMIN_ACTIONS[number];
