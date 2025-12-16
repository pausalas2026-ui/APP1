// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Constantes y enums para el sistema de verificación
// REGLA MADRE: NADIE recibe dinero sin verificación previa

/**
 * Estados de verificación del usuario
 * DOC33 §4
 */
export enum VerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING',
  VERIFIED = 'VERIFIED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  VERIFICATION_EXPIRED = 'VERIFICATION_EXPIRED',
}

/**
 * Descripción de cada estado de verificación
 */
export const VERIFICATION_STATUS_DESCRIPTION: Record<VerificationStatus, string> = {
  [VerificationStatus.NOT_VERIFIED]: 'Estado inicial - puede usar la app pero NO puede recibir dinero',
  [VerificationStatus.VERIFICATION_PENDING]: 'KYC iniciado - dinero sigue retenido',
  [VerificationStatus.VERIFIED]: 'KYC aprobado - puede recibir dinero',
  [VerificationStatus.VERIFICATION_REJECTED]: 'KYC fallido - no puede recibir dinero',
  [VerificationStatus.VERIFICATION_EXPIRED]: 'Debe renovar verificación',
};

/**
 * ¿El estado permite recibir dinero?
 */
export const CAN_RECEIVE_MONEY: Record<VerificationStatus, boolean> = {
  [VerificationStatus.NOT_VERIFIED]: false,
  [VerificationStatus.VERIFICATION_PENDING]: false,
  [VerificationStatus.VERIFIED]: true,
  [VerificationStatus.VERIFICATION_REJECTED]: false,
  [VerificationStatus.VERIFICATION_EXPIRED]: false,
};

/**
 * Niveles de KYC
 * DOC33 §6, §7
 */
export enum KycLevel {
  LEVEL_1 = 'LEVEL_1', // Básico: Documento + Selfie
  LEVEL_2 = 'LEVEL_2', // Reforzado: Nivel 1 + Comprobante domicilio + Validación manual
}

/**
 * Descripción de niveles KYC
 */
export const KYC_LEVEL_DESCRIPTION: Record<KycLevel, string> = {
  [KycLevel.LEVEL_1]: 'Verificación básica: Documento oficial + Selfie/Prueba de vida',
  [KycLevel.LEVEL_2]: 'Verificación reforzada: Nivel 1 + Comprobante domicilio + Revisión manual',
};

/**
 * Eventos disparadores de verificación
 * DOC33 §5
 */
export enum TriggerEvent {
  WITHDRAWAL_REQUEST = 'WITHDRAWAL_REQUEST',
  PRIZE_PAYMENT = 'PRIZE_PAYMENT',
  FIRST_TIME_MONEY = 'FIRST_TIME_MONEY',
  THRESHOLD_REACHED = 'THRESHOLD_REACHED',
  CAUSE_CREATION = 'CAUSE_CREATION',
  HIGH_VALUE_PRIZE = 'HIGH_VALUE_PRIZE',
}

/**
 * Descripción de eventos disparadores
 */
export const TRIGGER_EVENT_DESCRIPTION: Record<TriggerEvent, string> = {
  [TriggerEvent.WITHDRAWAL_REQUEST]: 'Usuario solicita retirar dinero de una causa',
  [TriggerEvent.PRIZE_PAYMENT]: 'Usuario quiere recibir dinero por premio NO donado',
  [TriggerEvent.FIRST_TIME_MONEY]: 'Primera vez que intenta recibir dinero',
  [TriggerEvent.THRESHOLD_REACHED]: 'Monto acumulado supera umbral configurado',
  [TriggerEvent.CAUSE_CREATION]: 'Usuario crea una causa propia',
  [TriggerEvent.HIGH_VALUE_PRIZE]: 'Usuario crea premio de alto valor',
};

/**
 * Nivel de KYC requerido por evento
 */
export const TRIGGER_REQUIRED_LEVEL: Record<TriggerEvent, KycLevel> = {
  [TriggerEvent.WITHDRAWAL_REQUEST]: KycLevel.LEVEL_1,
  [TriggerEvent.PRIZE_PAYMENT]: KycLevel.LEVEL_1,
  [TriggerEvent.FIRST_TIME_MONEY]: KycLevel.LEVEL_1,
  [TriggerEvent.THRESHOLD_REACHED]: KycLevel.LEVEL_2,
  [TriggerEvent.CAUSE_CREATION]: KycLevel.LEVEL_2,
  [TriggerEvent.HIGH_VALUE_PRIZE]: KycLevel.LEVEL_2,
};

/**
 * Estados de fondos
 * DOC33 §12
 */
export enum FundStatus {
  GENERATED = 'GENERATED',
  HELD = 'HELD',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  APPROVED = 'APPROVED',
  RELEASED = 'RELEASED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
}

/**
 * Transiciones válidas de estados de fondos
 * DOC33 §12: NUNCA saltar estados
 */
export const FUND_STATUS_TRANSITIONS: Record<FundStatus, FundStatus[]> = {
  [FundStatus.GENERATED]: [FundStatus.HELD],
  [FundStatus.HELD]: [FundStatus.PENDING_VERIFICATION],
  [FundStatus.PENDING_VERIFICATION]: [FundStatus.APPROVED, FundStatus.REJECTED, FundStatus.BLOCKED],
  [FundStatus.APPROVED]: [FundStatus.RELEASED, FundStatus.BLOCKED],
  [FundStatus.RELEASED]: [], // Estado final
  [FundStatus.REJECTED]: [], // Estado final
  [FundStatus.BLOCKED]: [], // Estado final
};

/**
 * Tipos de documentos aceptados para KYC
 */
export enum DocumentType {
  DNI = 'DNI',
  INE = 'INE',
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  RESIDENCE_PERMIT = 'RESIDENCE_PERMIT',
}

/**
 * Tipos de actor para auditoría
 */
export enum ActorType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
}

/**
 * Acciones de auditoría KYC
 */
export enum KycAuditAction {
  KYC_STARTED = 'KYC_STARTED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  SELFIE_UPLOADED = 'SELFIE_UPLOADED',
  KYC_APPROVED = 'KYC_APPROVED',
  KYC_REJECTED = 'KYC_REJECTED',
  KYC_EXPIRED = 'KYC_EXPIRED',
  MANUAL_REVIEW_STARTED = 'MANUAL_REVIEW_STARTED',
  MANUAL_APPROVAL = 'MANUAL_APPROVAL',
  MANUAL_REJECTION = 'MANUAL_REJECTION',
  FUND_HELD = 'FUND_HELD',
  FUND_RELEASED = 'FUND_RELEASED',
  FUND_BLOCKED = 'FUND_BLOCKED',
}

/**
 * Proveedores KYC soportados (referencia DOC33 §11)
 * NOTA: Sin integración real - solo estructura
 */
export enum KycProvider {
  ONFIDO = 'ONFIDO',
  JUMIO = 'JUMIO',
  VERIFF = 'VERIFF',
  TRUORA = 'TRUORA',
  STRIPE_IDENTITY = 'STRIPE_IDENTITY',
  MANUAL = 'MANUAL', // Fallback para verificación manual
}

/**
 * Configuración por defecto
 */
export const KYC_CONFIG = {
  // Umbral de monto para requerir KYC (DOC33 §7)
  THRESHOLD_AMOUNT: 1000, // USD
  
  // Umbral para premio de alto valor
  HIGH_VALUE_PRIZE_THRESHOLD: 500, // USD
  
  // Días para reintentar después de rechazo
  RETRY_AFTER_REJECTION_DAYS: 30,
  
  // Tiempo de expiración de verificación (días)
  VERIFICATION_EXPIRY_DAYS: 365,
  
  // Máximo intentos de verificación
  MAX_VERIFICATION_ATTEMPTS: 3,
  
  // Variable de entorno para proveedor activo
  PROVIDER_ENV_KEY: 'KYC_PROVIDER',
};

/**
 * Mensajes UX recomendados
 * DOC33 §14
 */
export const KYC_MESSAGES = {
  GENERATED_FUNDS: '¡Felicidades! Has generado fondos. Para retirarlos, necesitarás verificar tu identidad.',
  WITHDRAWAL_REQUEST: 'Para proteger tus fondos y los de las causas, necesitamos verificar tu identidad.',
  KYC_IN_PROGRESS: 'Estamos verificando tu identidad. Te avisaremos cuando esté listo.',
  KYC_APPROVED: '¡Verificación completada! Ya puedes retirar tus fondos.',
  KYC_REJECTED: 'No pudimos verificar tu identidad. Puedes intentarlo de nuevo en {days} días.',
  KYC_EXPIRED: 'Tu verificación ha expirado. Por favor, verifica tu identidad nuevamente.',
};

/**
 * Helper: Validar si una transición de estado de fondos es válida
 */
export function isValidFundTransition(from: FundStatus, to: FundStatus): boolean {
  return FUND_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Helper: Obtener nivel KYC requerido para un evento
 */
export function getRequiredKycLevel(trigger: TriggerEvent): KycLevel {
  return TRIGGER_REQUIRED_LEVEL[trigger];
}

/**
 * Helper: Verificar si el usuario puede recibir dinero
 */
export function canUserReceiveMoney(status: VerificationStatus): boolean {
  return CAN_RECEIVE_MONEY[status] ?? false;
}
