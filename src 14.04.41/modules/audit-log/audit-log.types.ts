// DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
// Seccion 5 - Estructura minima de un log
// Seccion 6 - Regla de INMUTABILIDAD (GAP CRÍTICO #1 RESUELTO)
// Seccion 7 - Catalogo de tipos de eventos

/**
 * ============================================================================
 * INMUTABILIDAD GARANTIZADA A NIVEL BASE DE DATOS
 * ============================================================================
 * 
 * GAP CRÍTICO #1 - BLOQUE 3 (Resuelto: 17-12-2025)
 * 
 * Los registros de audit_logs están protegidos por:
 * 1. Trigger PostgreSQL: audit_logs_immutability_trigger
 * 2. Función: prevent_audit_log_modification()
 * 
 * Cualquier intento de UPDATE o DELETE lanzará excepción:
 * "VIOLACIÓN DE INMUTABILIDAD: Los registros de audit_logs NO pueden ser..."
 * 
 * Migración: prisma/migrations/audit_logs_immutability.sql
 * Referencia: DOCUMENTO 37 Sección 6
 * ============================================================================
 */

/**
 * Categorias de logs segun DOC 37 seccion 7
 * Determina politica de retencion y acceso
 */
export enum AuditCategory {
  FINANCIAL = 'FINANCIAL',   // 10 años retencion
  LEGAL = 'LEGAL',           // 10 años retencion
  OPERATIONAL = 'OPERATIONAL', // 1 año retencion
  SECURITY = 'SECURITY',     // 2 años retencion
}

/**
 * Tipos de actor segun DOC 37 seccion 5
 */
export enum ActorType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

/**
 * Interfaz de evento de auditoria segun DOC 37 seccion 11
 */
export interface AuditEvent {
  eventType: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorType?: ActorType;
  metadata?: Record<string, any>;
  category?: AuditCategory;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Parametros de consulta de logs segun DOC 37 seccion 9
 */
export interface AuditLogQuery {
  entityType?: string;
  entityId?: string;
  eventType?: string;
  actorId?: string;
  category?: AuditCategory;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Exportacion de auditoria segun DOC 37 seccion 11
 */
export interface AuditExport {
  entityType: string;
  entityId: string;
  exportedAt: Date;
  totalEvents: number;
  events: any[];
}

/**
 * Politica de retencion segun DOC 37 seccion 10
 */
export const LOG_RETENTION_POLICY = {
  FINANCIAL: { years: 10, archiveAfterYears: 2 },
  LEGAL: { years: 10, archiveAfterYears: 2 },
  SECURITY: { years: 2, archiveAfterMonths: 6 },
  OPERATIONAL: { years: 1, archiveAfterMonths: 3 },
};

// ============================================
// CATALOGO DE TIPOS DE EVENTOS
// Referencia: DOC 37 seccion 7
// ============================================

/**
 * Eventos de Usuario (entity_type: USER)
 * DOC 37 seccion 7
 */
export const USER_EVENTS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGIN_FAILED: 'USER_LOGIN_FAILED',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_PROFILE_UPDATED: 'USER_PROFILE_UPDATED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  USER_TOS_ACCEPTED: 'USER_TOS_ACCEPTED',
  USER_PRIVACY_ACCEPTED: 'USER_PRIVACY_ACCEPTED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_SUSPENDED: 'USER_SUSPENDED',
} as const;

/**
 * Eventos de Sorteo (entity_type: RAFFLE)
 * DOC 37 seccion 7
 */
export const RAFFLE_EVENTS = {
  RAFFLE_CREATED: 'RAFFLE_CREATED',
  RAFFLE_PUBLISHED: 'RAFFLE_PUBLISHED',
  RAFFLE_EXECUTED: 'RAFFLE_EXECUTED',
  RAFFLE_WINNER_SELECTED: 'RAFFLE_WINNER_SELECTED',
  RAFFLE_CANCELLED: 'RAFFLE_CANCELLED',
  RAFFLE_EXTENDED: 'RAFFLE_EXTENDED',
} as const;

/**
 * Eventos de Participacion (entity_type: PARTICIPATION)
 * DOC 37 seccion 7
 */
export const PARTICIPATION_EVENTS = {
  PARTICIPATION_CREATED: 'PARTICIPATION_CREATED',
  PARTICIPATION_TICKETS_ADDED: 'PARTICIPATION_TICKETS_ADDED',
  PARTICIPATION_BASES_ACCEPTED: 'PARTICIPATION_BASES_ACCEPTED',
} as const;

/**
 * Eventos de Premio (entity_type: PRIZE)
 * DOC 37 seccion 7
 */
export const PRIZE_EVENTS = {
  PRIZE_CREATED: 'PRIZE_CREATED',
  PRIZE_ASSIGNED: 'PRIZE_ASSIGNED',
  PRIZE_DELIVERY_DECLARED: 'PRIZE_DELIVERY_DECLARED',
  PRIZE_EVIDENCE_UPLOADED: 'PRIZE_EVIDENCE_UPLOADED',
  PRIZE_CONFIRMED_BY_WINNER: 'PRIZE_CONFIRMED_BY_WINNER',
  PRIZE_DISPUTE_OPENED: 'PRIZE_DISPUTE_OPENED',
  PRIZE_DISPUTE_RESOLVED: 'PRIZE_DISPUTE_RESOLVED',
} as const;

/**
 * Eventos de Dinero (entity_type: MONEY) - CRITICOS
 * DOC 37 seccion 7
 */
export const MONEY_EVENTS = {
  MONEY_GENERATED: 'MONEY_GENERATED',
  MONEY_STATE_CHANGED: 'MONEY_STATE_CHANGED',
  MONEY_BLOCKED: 'MONEY_BLOCKED',
  MONEY_UNBLOCKED: 'MONEY_UNBLOCKED',
  MONEY_WITHDRAWAL_REQUESTED: 'MONEY_WITHDRAWAL_REQUESTED',
  MONEY_WITHDRAWAL_APPROVED: 'MONEY_WITHDRAWAL_APPROVED',
  MONEY_WITHDRAWAL_COMPLETED: 'MONEY_WITHDRAWAL_COMPLETED',
  MONEY_WITHDRAWAL_FAILED: 'MONEY_WITHDRAWAL_FAILED',
} as const;

/**
 * Eventos de KYC (entity_type: USER)
 * DOC 37 seccion 7
 */
export const KYC_EVENTS = {
  KYC_STARTED: 'KYC_STARTED',
  KYC_DOCUMENT_UPLOADED: 'KYC_DOCUMENT_UPLOADED',
  KYC_PROVIDER_RESPONSE: 'KYC_PROVIDER_RESPONSE',
  KYC_APPROVED: 'KYC_APPROVED',
  KYC_REJECTED: 'KYC_REJECTED',
  KYC_EXPIRED: 'KYC_EXPIRED',
} as const;

/**
 * Eventos de Causa (entity_type: CAUSE)
 * DOC 37 seccion 7
 */
export const CAUSE_EVENTS = {
  CAUSE_CREATED: 'CAUSE_CREATED',
  CAUSE_APPROVED: 'CAUSE_APPROVED',
  CAUSE_REJECTED: 'CAUSE_REJECTED',
  CAUSE_COMPLETED: 'CAUSE_COMPLETED',
  CAUSE_UPDATE_POSTED: 'CAUSE_UPDATE_POSTED',
} as const;

/**
 * Eventos de Donacion (entity_type: DONATION)
 * DOC 37 seccion 7
 */
export const DONATION_EVENTS = {
  DONATION_CREATED: 'DONATION_CREATED',
  DONATION_CONSENT_GIVEN: 'DONATION_CONSENT_GIVEN',
  DONATION_RECEIPT_ISSUED: 'DONATION_RECEIPT_ISSUED',
} as const;

/**
 * Eventos de Mensajeria (entity_type: MESSAGE)
 * DOC 37 seccion 7
 */
export const MESSAGE_EVENTS = {
  MESSAGE_SENT: 'MESSAGE_SENT',
  MESSAGE_DELIVERED: 'MESSAGE_DELIVERED',
  MESSAGE_FAILED: 'MESSAGE_FAILED',
  MESSAGE_READ: 'MESSAGE_READ',
} as const;

/**
 * Todos los eventos agrupados
 */
export const ALL_EVENTS = {
  ...USER_EVENTS,
  ...RAFFLE_EVENTS,
  ...PARTICIPATION_EVENTS,
  ...PRIZE_EVENTS,
  ...MONEY_EVENTS,
  ...KYC_EVENTS,
  ...CAUSE_EVENTS,
  ...DONATION_EVENTS,
  ...MESSAGE_EVENTS,
} as const;

/**
 * Tipo union de todos los eventos
 */
export type AuditEventType = typeof ALL_EVENTS[keyof typeof ALL_EVENTS];
