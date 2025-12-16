// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS Y REGLAS DE RETENCIÓN
// Constantes y enums para el sistema de estados de fondos
// REGLA: El dinero NUNCA está "libre" hasta que se cumplen TODAS las condiciones

/**
 * Estados oficiales del dinero
 * DOC34 §3 - NO inventar otros
 * 
 * GENERADO → RETENIDO → PENDIENTE_VERIFICACIÓN → APROBADO → LIBERADO
 *                                             ↓
 *                                         BLOQUEADO
 */
export enum FundLedgerStatus {
  /**
   * Estado 1: El dinero existe contablemente
   * - No se puede usar
   * - No se puede retirar
   */
  GENERATED = 'generated',

  /**
   * Estado 2: El dinero está bloqueado por seguridad (ESTADO POR DEFECTO)
   * - Aún no se ha validado: identidad, causa, premio, evidencias
   * - No se puede usar
   * - No se puede retirar
   */
  HELD = 'held',

  /**
   * Estado 3: El usuario solicitó liberar dinero
   * - Falta: KYC, evidencia, validación de causa, confirmación de entrega
   * - No se puede usar
   * - No se puede retirar
   */
  PENDING_VERIFICATION = 'pending_verification',

  /**
   * Estado 4: TODAS las condiciones se cumplieron
   * - Usuario verificado, causa validada, premio entregado, evidencias confirmadas
   * - Listo para liberar
   * - Pendiente de transferencia
   */
  APPROVED = 'approved',

  /**
   * Estado 5: El dinero fue enviado (ESTADO FINAL EXITOSO)
   * - No puede cambiar
   */
  RELEASED = 'released',

  /**
   * Estado 6: El dinero NO se libera (ESTADO DE PROTECCIÓN)
   * - Motivos: Fraude, causa falsa, premio no entregado, KYC rechazado
   * - Solo admin puede cambiar con justificación
   */
  BLOCKED = 'blocked',
}

/**
 * Transiciones válidas de estados
 * DOC34 §5: El dinero SOLO puede avanzar hacia adelante, NUNCA retroceder
 */
export const VALID_FUND_TRANSITIONS: Record<FundLedgerStatus, FundLedgerStatus[]> = {
  [FundLedgerStatus.GENERATED]: [FundLedgerStatus.HELD],
  [FundLedgerStatus.HELD]: [FundLedgerStatus.PENDING_VERIFICATION, FundLedgerStatus.BLOCKED],
  [FundLedgerStatus.PENDING_VERIFICATION]: [FundLedgerStatus.APPROVED, FundLedgerStatus.BLOCKED],
  [FundLedgerStatus.APPROVED]: [FundLedgerStatus.RELEASED, FundLedgerStatus.BLOCKED],
  [FundLedgerStatus.RELEASED]: [], // Estado final, no puede cambiar
  [FundLedgerStatus.BLOCKED]: [FundLedgerStatus.PENDING_VERIFICATION], // Solo admin puede desbloquear
};

/**
 * Tipos de fuente de fondos
 */
export enum FundSourceType {
  DONATION = 'donation',
  SWEEPSTAKE = 'sweepstake',
  PRIZE = 'prize',
  CAUSE = 'cause',
}

/**
 * Tipos de actor para auditoría
 */
export enum FundActorType {
  SYSTEM = 'system',
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Acciones de auditoría de fondos
 */
export enum FundAuditAction {
  FUND_GENERATED = 'FUND_GENERATED',
  FUND_HELD = 'FUND_HELD',
  FUND_PENDING = 'FUND_PENDING',
  FUND_APPROVED = 'FUND_APPROVED',
  FUND_RELEASED = 'FUND_RELEASED',
  FUND_BLOCKED = 'FUND_BLOCKED',
  FUND_UNBLOCKED = 'FUND_UNBLOCKED',
  CHECKLIST_VERIFIED = 'CHECKLIST_VERIFIED',
  RELEASE_REQUESTED = 'RELEASE_REQUESTED',
  RELEASE_DENIED = 'RELEASE_DENIED',
}

/**
 * Mensajes UX por estado
 * DOC34 §13
 */
export const FUND_STATUS_MESSAGES: Record<FundLedgerStatus, string> = {
  [FundLedgerStatus.GENERATED]: 'Tus fondos están siendo procesados.',
  [FundLedgerStatus.HELD]: 'Tus fondos están seguros. Completaremos la validación pronto.',
  [FundLedgerStatus.PENDING_VERIFICATION]: 'Estamos verificando la información. Te avisaremos cuando esté listo.',
  [FundLedgerStatus.APPROVED]: '¡Todo listo! Tu dinero será transferido en breve.',
  [FundLedgerStatus.RELEASED]: '¡Transferencia completada! Revisa tu cuenta.',
  [FundLedgerStatus.BLOCKED]: 'Necesitamos revisar tu caso. Contacta a soporte.',
};

/**
 * Configuración de fondos
 * DOC34 §17
 */
export const FUND_CONFIG = {
  // Tiempos de retención
  AUTO_HOLD_HOURS: 24,
  MAX_PENDING_DAYS: 30,

  // Umbrales
  HIGH_VALUE_THRESHOLD: 1000,
  AUTO_RELEASE_MAX: 100,

  // Políticas
  REQUIRE_MANUAL_APPROVAL: true,
  DOUBLE_APPROVAL_ABOVE: 5000,
};

/**
 * Helper: Validar transición de estado
 * DOC34 §5: NUNCA puede retroceder de estado
 */
export function isValidFundTransition(
  from: FundLedgerStatus,
  to: FundLedgerStatus,
): boolean {
  return VALID_FUND_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Helper: Verificar si es estado final
 */
export function isFinalState(status: FundLedgerStatus): boolean {
  return VALID_FUND_TRANSITIONS[status]?.length === 0;
}

/**
 * Helper: Obtener mensaje UX para estado
 */
export function getFundStatusMessage(status: FundLedgerStatus): string {
  return FUND_STATUS_MESSAGES[status] || 'Estado desconocido.';
}

/**
 * Items del checklist de liberación
 * DOC34 §12
 */
export interface FundReleaseChecklist {
  userVerified: boolean;
  causeValidated: boolean;
  prizeDelivered: boolean | null; // null si no aplica
  evidenceConfirmed: boolean;
  fraudCheckPassed: boolean;
  allPassed: boolean;
}

/**
 * Helper: Calcular si el checklist está completo
 */
export function isChecklistComplete(checklist: Omit<FundReleaseChecklist, 'allPassed'>): boolean {
  return (
    checklist.userVerified &&
    checklist.causeValidated &&
    (checklist.prizeDelivered === null || checklist.prizeDelivered) &&
    checklist.evidenceConfirmed &&
    checklist.fraudCheckPassed
  );
}
