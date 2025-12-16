/**
 * DOCUMENTO 35 - CONSENTIMIENTOS LEGALES Y RGPD
 * =============================================
 * Constantes y enums para gestión de consentimientos legales
 * 
 * REGLAS DE ORO:
 * 1. Todo texto legal visible (no escondido)
 * 2. Todo consentimiento registrado (con IP, fecha, versión)
 * 3. Documentos versionados (nunca borrar)
 * 4. Consentimiento ≠ KYC (no mezclar)
 * 5. Cancelación ≠ Invalidación (siguen válidos)
 */

/**
 * Tipos de consentimiento según DOC35
 * 
 * | # | Tipo     | Momento                              | Registro      |
 * |---|----------|--------------------------------------|---------------|
 * | 1 | TOS      | Registro + Pago                      | `TOS`         |
 * | 2 | PRIVACY  | Registro + Pago + Sorteo + Donación  | `PRIVACY`     |
 * | 3 | SORTEO   | Antes de participar                  | `SORTEO_{id}` |
 * | 4 | DONACION | Al confirmar donación                | `DONACION`    |
 */
export enum ConsentType {
  TOS = 'TOS',
  PRIVACY = 'PRIVACY',
  SORTEO = 'SORTEO',
  DONACION = 'DONACION',
}

/**
 * Tipos de documentos legales
 */
export enum DocumentType {
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  RAFFLE_TERMS = 'RAFFLE_TERMS',
  DONATION_POLICY = 'DONATION_POLICY',
  COOKIE_POLICY = 'COOKIE_POLICY',
}

/**
 * Contextos donde se requiere consentimiento
 */
export enum ConsentContext {
  REGISTRATION = 'REGISTRATION',
  SUBSCRIPTION_PAYMENT = 'SUBSCRIPTION_PAYMENT',
  RAFFLE_PARTICIPATION = 'RAFFLE_PARTICIPATION',
  DONATION = 'DONATION',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
}

/**
 * Mapeo de contexto a consentimientos requeridos
 * Según DOC35: cada flujo requiere consentimientos específicos
 */
export const REQUIRED_CONSENTS_BY_CONTEXT: Record<ConsentContext, ConsentType[]> = {
  [ConsentContext.REGISTRATION]: [ConsentType.TOS, ConsentType.PRIVACY],
  [ConsentContext.SUBSCRIPTION_PAYMENT]: [ConsentType.TOS, ConsentType.PRIVACY],
  [ConsentContext.RAFFLE_PARTICIPATION]: [ConsentType.SORTEO, ConsentType.PRIVACY],
  [ConsentContext.DONATION]: [ConsentType.DONACION, ConsentType.PRIVACY],
  [ConsentContext.PROFILE_UPDATE]: [],
};

/**
 * Mapeo de tipo de consentimiento a tipo de documento legal
 */
export const CONSENT_TO_DOCUMENT_TYPE: Record<ConsentType, DocumentType> = {
  [ConsentType.TOS]: DocumentType.TERMS_OF_SERVICE,
  [ConsentType.PRIVACY]: DocumentType.PRIVACY_POLICY,
  [ConsentType.SORTEO]: DocumentType.RAFFLE_TERMS,
  [ConsentType.DONACION]: DocumentType.DONATION_POLICY,
};

/**
 * Tipos de referencia para consentimientos con ID específico
 * Ejemplo: SORTEO_{id} necesita referenceType=RAFFLE y referenceId=uuid
 */
export enum ConsentReferenceType {
  RAFFLE = 'RAFFLE',
  CAUSE = 'CAUSE',
  CAMPAIGN = 'CAMPAIGN',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

/**
 * Configuración de retención de consentimientos
 * RGPD: Los consentimientos son INMUTABLES y NUNCA se borran
 */
export const CONSENT_CONFIG = {
  // Retención mínima (legalmente requerido)
  MIN_RETENTION_YEARS: 5,
  
  // Los consentimientos NUNCA expiran (son evidencia legal)
  CONSENTS_NEVER_EXPIRE: true,
  
  // Campos requeridos para consentimiento válido
  REQUIRED_FIELDS: ['consentType', 'documentVersion', 'acceptedAt', 'ipAddress'] as const,
  
  // Campos opcionales pero recomendados
  RECOMMENDED_FIELDS: ['userAgent', 'fingerprint'] as const,
  
  // Longitud máxima de IP
  MAX_IP_LENGTH: 45, // IPv6
  
  // Longitud máxima de User Agent
  MAX_USER_AGENT_LENGTH: 512,
} as const;

/**
 * Mensajes de error para consentimientos
 */
export const CONSENT_ERRORS = {
  MISSING_IDENTIFIER: 'Se requiere al menos un identificador (userId, participantId o sessionId)',
  NO_ACTIVE_DOCUMENT: 'No hay documento legal activo para este tipo',
  CONSENT_NOT_FOUND: 'No se encontró registro de consentimiento',
  INVALID_CONSENT_TYPE: 'Tipo de consentimiento no válido',
  MISSING_REFERENCE_ID: 'Se requiere referenceId para este tipo de consentimiento',
  DOCUMENT_VERSION_MISMATCH: 'La versión del documento no coincide con la actual',
  DOCUMENT_NOT_FOUND: 'Documento legal no encontrado',
  DUPLICATE_VERSION: 'Ya existe un documento con esta versión',
  INVALID_VERSION_FORMAT: 'Formato de versión inválido (use x.y.z)',
} as const;

/**
 * Textos UX por contexto (según DOC35 sección 8)
 * Frontend debe usar estos textos para cumplir con RGPD
 */
export const CONSENT_UX_TEXTS = {
  [ConsentContext.REGISTRATION]: {
    text: 'Al crear tu cuenta aceptas los',
    links: [
      { label: 'Términos de Uso', path: '/legal/terms', consentType: ConsentType.TOS },
      { label: 'Política de Privacidad', path: '/legal/privacy', consentType: ConsentType.PRIVACY },
    ],
  },
  [ConsentContext.SUBSCRIPTION_PAYMENT]: {
    text: 'Al completar el pago confirmas la aceptación de los',
    links: [
      { label: 'Términos', path: '/legal/terms', consentType: ConsentType.TOS },
      { label: 'Política de Privacidad', path: '/legal/privacy', consentType: ConsentType.PRIVACY },
    ],
  },
  [ConsentContext.RAFFLE_PARTICIPATION]: {
    text: 'Al participar aceptas las',
    links: [
      { label: 'bases del sorteo', path: '/raffle/{id}/terms', consentType: ConsentType.SORTEO },
      { label: 'política de privacidad', path: '/legal/privacy', consentType: ConsentType.PRIVACY },
    ],
  },
  [ConsentContext.DONATION]: {
    text: 'Al donar aceptas el tratamiento de tus datos y la',
    links: [
      { label: 'emisión del recibo', path: '/legal/donations', consentType: ConsentType.DONACION },
    ],
  },
  [ConsentContext.PROFILE_UPDATE]: {
    text: '',
    links: [],
  },
} as const;

/**
 * Reglas de validación de versión de documento
 * Formato: MAJOR.MINOR.PATCH (ej: 1.0.0, 1.1.0, 2.0.0)
 */
export const VERSION_REGEX = /^(\d+)\.(\d+)(?:\.(\d+))?$/;

/**
 * Valida formato de versión
 */
export function isValidVersion(version: string): boolean {
  return VERSION_REGEX.test(version);
}

/**
 * Compara versiones (retorna -1, 0, o 1)
 */
export function compareVersions(v1: string, v2: string): number {
  const parse = (v: string) => v.split('.').map(Number);
  const [major1, minor1, patch1 = 0] = parse(v1);
  const [major2, minor2, patch2 = 0] = parse(v2);
  
  if (major1 !== major2) return major1 > major2 ? 1 : -1;
  if (minor1 !== minor2) return minor1 > minor2 ? 1 : -1;
  if (patch1 !== patch2) return patch1 > patch2 ? 1 : -1;
  return 0;
}

/**
 * Genera ID de consentimiento para sorteo específico
 * Formato: SORTEO_{raffleId}
 */
export function buildRaffleConsentType(raffleId: string): string {
  return `${ConsentType.SORTEO}_${raffleId}`;
}

/**
 * Extrae el ID del sorteo de un tipo de consentimiento
 */
export function extractRaffleIdFromConsentType(consentType: string): string | null {
  if (!consentType.startsWith(`${ConsentType.SORTEO}_`)) {
    return null;
  }
  return consentType.replace(`${ConsentType.SORTEO}_`, '');
}

/**
 * Verifica si un tipo de consentimiento requiere referenceId
 */
export function requiresReferenceId(consentType: ConsentType): boolean {
  return consentType === ConsentType.SORTEO;
}
