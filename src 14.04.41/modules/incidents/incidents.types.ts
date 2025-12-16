// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Seccion 4 - Catalogo de flags
// Seccion 3 - Tipos de incidentes
// Seccion 10 - Catalogo de acciones

/**
 * Tipos de entidad que pueden tener flags
 * DOC 38 seccion 4
 */
export enum FlagEntityType {
  USER = 'USER',
  RAFFLE = 'RAFFLE',
  PRIZE = 'PRIZE',
  CAUSE = 'CAUSE',
  MONEY = 'MONEY',
}

/**
 * Catalogo de flags antifraude
 * DOC 38 seccion 4 - Tabla de flags
 */
export const FLAG_CODES = {
  // Flags de KYC
  KYC_REQUIRED: 'KYC_REQUIRED',
  KYC_REJECTED: 'KYC_REJECTED',
  KYC_EXPIRED: 'KYC_EXPIRED',
  
  // Flags de Premio
  PRIZE_DELIVERY_DISPUTE: 'PRIZE_DELIVERY_DISPUTE',
  
  // Flags de Causa
  CAUSE_NOT_VERIFIED: 'CAUSE_NOT_VERIFIED',
  
  // Flags generales
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
  FUNDS_HOLD: 'FUNDS_HOLD',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_BLOCKED: 'ACCOUNT_BLOCKED',
  HIGH_RISK: 'HIGH_RISK',
  MULTIPLE_ACCOUNTS: 'MULTIPLE_ACCOUNTS',
} as const;

export type FlagCode = typeof FLAG_CODES[keyof typeof FLAG_CODES];

/**
 * Flags que bloquean liberacion de dinero
 * DOC 38 seccion 5.1
 */
export const MONEY_BLOCKING_FLAGS = [
  FLAG_CODES.KYC_REQUIRED,
  FLAG_CODES.KYC_REJECTED,
  FLAG_CODES.PRIZE_DELIVERY_DISPUTE,
  FLAG_CODES.CAUSE_NOT_VERIFIED,
  FLAG_CODES.SUSPICIOUS_ACTIVITY,
  FLAG_CODES.MANUAL_REVIEW_REQUIRED,
  FLAG_CODES.FUNDS_HOLD,
  FLAG_CODES.ACCOUNT_SUSPENDED,
  FLAG_CODES.ACCOUNT_BLOCKED,
] as const;

/**
 * Tipos de incidente
 * DOC 38 seccion 3
 */
export enum IncidentType {
  PRIZE = 'PRIZE',
  MONEY = 'MONEY',
  CAUSE = 'CAUSE',
  USER = 'USER',
  PARTICIPATION = 'PARTICIPATION',
  MESSAGE = 'MESSAGE',
}

/**
 * Codigos de incidente por tipo
 * DOC 38 secciones 3.1-3.6
 */
export const INCIDENT_CODES = {
  // 3.1 Incidentes de PREMIO
  PRIZE_NOT_DELIVERED: 'PRIZE_NOT_DELIVERED',
  PRIZE_INSUFFICIENT_EVIDENCE: 'PRIZE_INSUFFICIENT_EVIDENCE',
  PRIZE_EVIDENCE_MANIPULATED: 'PRIZE_EVIDENCE_MANIPULATED',
  PRIZE_WINNER_UNREACHABLE: 'PRIZE_WINNER_UNREACHABLE',
  PRIZE_DIFFERENT_FROM_PROMISED: 'PRIZE_DIFFERENT_FROM_PROMISED',
  
  // 3.2 Incidentes de DINERO
  MONEY_WITHDRAWAL_NO_KYC: 'MONEY_WITHDRAWAL_NO_KYC',
  MONEY_AMOUNT_DISCREPANCY: 'MONEY_AMOUNT_DISCREPANCY',
  MONEY_DOUBLE_WITHDRAWAL: 'MONEY_DOUBLE_WITHDRAWAL',
  MONEY_REFUND_REQUEST: 'MONEY_REFUND_REQUEST',
  MONEY_ANOMALOUS_ACTIVITY: 'MONEY_ANOMALOUS_ACTIVITY',
  
  // 3.3 Incidentes de CAUSA
  CAUSE_NONEXISTENT: 'CAUSE_NONEXISTENT',
  CAUSE_FAKE_DOCUMENTS: 'CAUSE_FAKE_DOCUMENTS',
  CAUSE_FUND_DIVERSION: 'CAUSE_FUND_DIVERSION',
  CAUSE_DUPLICATE_SPAM: 'CAUSE_DUPLICATE_SPAM',
  
  // 3.4 Incidentes de USUARIO
  USER_MULTIPLE_ACCOUNTS: 'USER_MULTIPLE_ACCOUNTS',
  USER_IDENTITY_FRAUD: 'USER_IDENTITY_FRAUD',
  USER_FAKE_DATA: 'USER_FAKE_DATA',
  USER_BOT_DETECTED: 'USER_BOT_DETECTED',
  
  // 3.5 Incidentes de PARTICIPACION
  PARTICIPATION_MASS_SUSPICIOUS: 'PARTICIPATION_MASS_SUSPICIOUS',
  PARTICIPATION_TICKET_ABUSE: 'PARTICIPATION_TICKET_ABUSE',
  PARTICIPATION_RAFFLE_MANIPULATION: 'PARTICIPATION_RAFFLE_MANIPULATION',
  
  // 3.6 Incidentes de MENSAJERIA
  MESSAGE_SPAM_COMPLAINT: 'MESSAGE_SPAM_COMPLAINT',
  MESSAGE_WRONG_LANGUAGE: 'MESSAGE_WRONG_LANGUAGE',
  MESSAGE_UNAUTHORIZED_CONTACT: 'MESSAGE_UNAUTHORIZED_CONTACT',
} as const;

export type IncidentCode = typeof INCIDENT_CODES[keyof typeof INCIDENT_CODES];

/**
 * Estados de incidente
 * DOC 38 seccion 6
 */
export enum IncidentStatus {
  REPORTED = 'REPORTED',
  TRIAGED = 'TRIAGED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_TAKEN = 'ACTION_TAKEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

/**
 * Prioridades de incidente
 * DOC 38 seccion 6
 */
export enum IncidentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Tipos de resolucion
 * DOC 38 seccion 6
 */
export enum ResolutionType {
  CONFIRMED_FRAUD = 'CONFIRMED_FRAUD',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  PARTIAL_RESOLUTION = 'PARTIAL_RESOLUTION',
  ESCALATED = 'ESCALATED',
  NO_ACTION_REQUIRED = 'NO_ACTION_REQUIRED',
}

/**
 * Catalogo de acciones posibles
 * DOC 38 seccion 10
 */
export const ACTION_CODES = {
  HOLD_FUNDS: 'HOLD_FUNDS',
  BLOCK_WITHDRAWAL: 'BLOCK_WITHDRAWAL',
  SUSPEND_ACCOUNT: 'SUSPEND_ACCOUNT',
  BLOCK_ACCOUNT: 'BLOCK_ACCOUNT',
  DEACTIVATE_RAFFLES: 'DEACTIVATE_RAFFLES',
  DEACTIVATE_CAUSES: 'DEACTIVATE_CAUSES',
  REQUIRE_KYC_L2: 'REQUIRE_KYC_L2',
  ESCALATE_MANUAL: 'ESCALATE_MANUAL',
  RELEASE_FUNDS: 'RELEASE_FUNDS',
  CLOSE_INCIDENT: 'CLOSE_INCIDENT',
  NOTIFY_USER: 'NOTIFY_USER',
} as const;

export type ActionCode = typeof ACTION_CODES[keyof typeof ACTION_CODES];

/**
 * Interfaz para crear un flag
 */
export interface CreateFlagDto {
  entityType: FlagEntityType;
  entityId: string;
  flagCode: FlagCode;
  reason?: string;
  evidenceIds?: string[];
  createdBy: string;
  incidentId?: string;
}

/**
 * Interfaz para resolver un flag
 */
export interface ResolveFlagDto {
  resolvedBy: string;
  resolutionNotes?: string;
}

/**
 * Interfaz para crear incidente
 * DOC 38 seccion 7
 */
export interface CreateIncidentDto {
  incidentCode: IncidentCode;
  incidentType: IncidentType;
  entityType: FlagEntityType;
  entityId: string;
  reportedBy?: string;
  title: string;
  description: string;
  priority?: IncidentPriority;
  evidenceIds?: string[];
}

/**
 * Interfaz para resolver incidente
 */
export interface ResolveIncidentDto {
  resolutionType: ResolutionType;
  resolutionNotes: string;
  resolvedBy: string;
}

/**
 * Interfaz para ejecutar accion
 * DOC 38 seccion 10
 */
export interface ExecuteActionDto {
  incidentId: string;
  actionCode: ActionCode;
  targetType?: FlagEntityType;
  targetId?: string;
  notes?: string;
  metadata?: Record<string, any>;
  executedBy: string;
}

/**
 * Resultado de verificacion de bloqueo de dinero
 * DOC 38 seccion 5.1
 */
export interface MoneyReleaseCheck {
  canRelease: boolean;
  blockers: string[];
}

/**
 * Transiciones validas de estado de incidente
 * DOC 38 seccion 6
 */
export const VALID_STATUS_TRANSITIONS: Record<IncidentStatus, IncidentStatus[]> = {
  [IncidentStatus.REPORTED]: [IncidentStatus.TRIAGED, IncidentStatus.REJECTED],
  [IncidentStatus.TRIAGED]: [IncidentStatus.UNDER_REVIEW, IncidentStatus.REJECTED],
  [IncidentStatus.UNDER_REVIEW]: [IncidentStatus.ACTION_TAKEN, IncidentStatus.RESOLVED, IncidentStatus.REJECTED],
  [IncidentStatus.ACTION_TAKEN]: [IncidentStatus.RESOLVED, IncidentStatus.UNDER_REVIEW],
  [IncidentStatus.RESOLVED]: [], // Estado terminal
  [IncidentStatus.REJECTED]: [], // Estado terminal
};

/**
 * Eventos de auditoria para incidentes
 * DOC 38 seccion 12
 */
export const INCIDENT_AUDIT_EVENTS = {
  INCIDENT_CREATED: 'INCIDENT_CREATED',
  INCIDENT_STATUS_CHANGED: 'INCIDENT_STATUS_CHANGED',
  INCIDENT_ASSIGNED: 'INCIDENT_ASSIGNED',
  INCIDENT_ACTION_TAKEN: 'INCIDENT_ACTION_TAKEN',
  INCIDENT_EVIDENCE_ADDED: 'INCIDENT_EVIDENCE_ADDED',
  INCIDENT_RESOLVED: 'INCIDENT_RESOLVED',
  FLAG_ADDED: 'FLAG_ADDED',
  FLAG_RESOLVED: 'FLAG_RESOLVED',
} as const;
