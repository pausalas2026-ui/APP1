// DOCUMENTO 40 - CONFIGURACIÓN GLOBAL Y PARÁMETROS
// Tipos y constantes para sistema de configuración
// Referencia: DOC 40 secciones 3-12

// ============================================================================
// GRUPOS DE CONFIGURACIÓN (DOC 40 seccion 3)
// ============================================================================

export const CONFIG_GROUPS = [
  'MONEY',
  'FEES',
  'RAFFLE',
  'PRIZE',
  'CAUSE',
  'KYC',
  'MESSAGING',
  'FRAUD',
  'GEO',
  'LEGAL',
  'SYSTEM',
] as const;

export type ConfigGroup = typeof CONFIG_GROUPS[number];

// ============================================================================
// TIPOS DE VALOR (DOC 40 seccion 13)
// ============================================================================

export const CONFIG_VALUE_TYPES = [
  'STRING',
  'INTEGER',
  'DECIMAL',
  'BOOLEAN',
  'JSON',
  'ARRAY',
] as const;

export type ConfigValueType = typeof CONFIG_VALUE_TYPES[number];

// ============================================================================
// CLAVES DE CONFIGURACIÓN POR GRUPO (DOC 40 secciones 4-12)
// ============================================================================

// DOC 40 seccion 4 - Parámetros económicos
export const MONEY_CONFIG_KEYS = {
  MIN_WITHDRAWAL: 'money.minWithdrawal',
  KYC_LEVEL2_THRESHOLD: 'money.kycLevel2Threshold',
  MAX_AUTO_RELEASE: 'money.maxAutoRelease',
  MIN_RETENTION_DAYS: 'money.minRetentionDays',
  DEFAULT_RETENTION_DAYS: 'money.defaultRetentionDays',
} as const;

// DOC 40 seccion 4.2 - Fees
export const FEES_CONFIG_KEYS = {
  PLATFORM_FEE: 'fees.platformFee',
  CAUSE_SHARE: 'fees.causeShare',
  CREATOR_SHARE: 'fees.creatorShare',
  PAYMENT_PROCESSING: 'fees.paymentProcessing',
} as const;

// DOC 40 seccion 5 - Parámetros de sorteos
export const RAFFLE_CONFIG_KEYS = {
  MAX_TICKETS_PER_USER: 'raffle.maxTicketsPerUser',
  TICKETS_PER_EURO: 'raffle.ticketsPerEuro',
  BONUS_TICKETS_PRO: 'raffle.bonusTicketsPro',
  BONUS_TICKETS_PREMIUM: 'raffle.bonusTicketsPremium',
  BONUS_TICKETS_ELITE: 'raffle.bonusTicketsElite',
  MIN_DURATION_DAYS: 'raffle.minDurationDays',
  MAX_DURATION_DAYS: 'raffle.maxDurationDays',
  MAX_ACTIVE_PER_USER: 'raffle.maxActivePerUser',
  MIN_PARTICIPANTS: 'raffle.minParticipants',
} as const;

// DOC 40 seccion 6 - Parámetros de premios
export const PRIZE_CONFIG_KEYS = {
  MAX_VALUE_NO_REVIEW: 'prize.maxValueNoReview',
  MAX_DELIVERY_DAYS_PHYSICAL: 'prize.maxDeliveryDaysPhysical',
  MAX_DELIVERY_DAYS_DIGITAL: 'prize.maxDeliveryDaysDigital',
  ALLOWED_TYPES: 'prize.allowedTypes',
  EVIDENCE_REQUIRED_PHYSICAL: 'prize.evidenceRequiredPhysical',
  EVIDENCE_REQUIRED_DIGITAL: 'prize.evidenceRequiredDigital',
} as const;

// DOC 40 seccion 7 - Parámetros de causas
export const CAUSE_CONFIG_KEYS = {
  REQUIRED_DOCS_OWN: 'cause.requiredDocsOwn',
  REQUIRED_DOCS_EXTERNAL: 'cause.requiredDocsExternal',
  REVIEW_DAYS: 'cause.reviewDays',
  ACTIVE_CATEGORIES: 'cause.activeCategories',
  MIN_GOAL: 'cause.minGoal',
  MAX_GOAL: 'cause.maxGoal',
} as const;

// DOC 40 seccion 8 - Parámetros de KYC
export const KYC_CONFIG_KEYS = {
  LEVEL1_TRIGGERS: 'kyc.level1Triggers',
  LEVEL2_TRIGGERS: 'kyc.level2Triggers',
  LEVEL2_THRESHOLD: 'kyc.level2Threshold',
  ACTIVE_PROVIDER: 'kyc.activeProvider',
  VERIFICATION_TIMEOUT: 'kyc.verificationTimeout',
  MAX_RETRIES: 'kyc.maxRetries',
  VALIDITY_DAYS: 'kyc.validityDays',
} as const;

// DOC 40 seccion 9 - Parámetros de mensajería
export const MESSAGING_CONFIG_KEYS = {
  MAX_PER_DAY: 'messaging.maxPerDay',
  MIN_GAP_MINUTES: 'messaging.minGapMinutes',
  ALLOWED_HOURS_START: 'messaging.allowedHoursStart',
  ALLOWED_HOURS_END: 'messaging.allowedHoursEnd',
  ACTIVE_CHANNELS: 'messaging.activeChannels',
  ACTIVE_LANGUAGES: 'messaging.activeLanguages',
  DEFAULT_LANGUAGE: 'messaging.defaultLanguage',
  TRIGGER_EVENTS: 'messaging.triggerEvents',
} as const;

// DOC 40 seccion 10 - Parámetros de fraude
export const FRAUD_CONFIG_KEYS = {
  FLAGS_BEFORE_SUSPENSION: 'fraud.flagsBeforeSuspension',
  FLAGS_BEFORE_BLOCK: 'fraud.flagsBeforeBlock',
  SUSPICIOUS_PARTICIPATIONS_PER_HOUR: 'fraud.suspiciousParticipationsPerHour',
  MAX_IPS_PER_ACCOUNT: 'fraud.maxIpsPerAccount',
  MAX_ACCOUNTS_PER_IP: 'fraud.maxAccountsPerIp',
  PATTERN_ANALYSIS_DAYS: 'fraud.patternAnalysisDays',
} as const;

// DOC 40 seccion 11 - Parámetros de geolocalización
export const GEO_CONFIG_KEYS = {
  PRECISION_LEVEL: 'geo.precisionLevel',
  SHOW_IN_CREATOR_DASHBOARD: 'geo.showInCreatorDashboard',
  ACTIVE_COUNTRIES: 'geo.activeCountries',
  BLOCKED_COUNTRIES: 'geo.blockedCountries',
  REQUIRE_EXPLICIT_CONSENT: 'geo.requireExplicitConsent',
} as const;

// DOC 40 seccion 12 - Parámetros legales
export const LEGAL_CONFIG_KEYS = {
  ACTIVE_TOS_VERSION: 'legal.activeTosVersion',
  ACTIVE_PRIVACY_VERSION: 'legal.activePrivacyVersion',
  TOS_LANGUAGES: 'legal.tosLanguages',
  MINIMUM_AGE: 'legal.minimumAge',
  REQUIRE_EXPLICIT_ACCEPTANCE: 'legal.requireExplicitAcceptance',
} as const;

// Todas las claves agrupadas
export const ALL_CONFIG_KEYS = {
  ...MONEY_CONFIG_KEYS,
  ...FEES_CONFIG_KEYS,
  ...RAFFLE_CONFIG_KEYS,
  ...PRIZE_CONFIG_KEYS,
  ...CAUSE_CONFIG_KEYS,
  ...KYC_CONFIG_KEYS,
  ...MESSAGING_CONFIG_KEYS,
  ...FRAUD_CONFIG_KEYS,
  ...GEO_CONFIG_KEYS,
  ...LEGAL_CONFIG_KEYS,
} as const;

// ============================================================================
// VALORES POR DEFECTO (DOC 40 seccion 17)
// ============================================================================

export interface ConfigDefault {
  key: string;
  group: ConfigGroup;
  valueType: ConfigValueType;
  value: any;
  description: string;
  isSensitive?: boolean;
}

export const DEFAULT_CONFIGS: ConfigDefault[] = [
  // Económicos (DOC 40 seccion 4)
  { key: 'money.minWithdrawal', group: 'MONEY', valueType: 'DECIMAL', value: 10.00, description: 'Monto mínimo para solicitar retiro (€)' },
  { key: 'money.kycLevel2Threshold', group: 'MONEY', valueType: 'DECIMAL', value: 1000.00, description: 'Monto que activa KYC Nivel 2 (€)' },
  { key: 'money.maxAutoRelease', group: 'MONEY', valueType: 'DECIMAL', value: 500.00, description: 'Monto máximo sin revisión manual (€)' },
  { key: 'money.minRetentionDays', group: 'MONEY', valueType: 'INTEGER', value: 7, description: 'Días mínimos de retención' },
  { key: 'money.defaultRetentionDays', group: 'MONEY', valueType: 'INTEGER', value: 14, description: 'Días de retención por defecto' },
  
  // Fees (DOC 40 seccion 4.2)
  { key: 'fees.platformFee', group: 'FEES', valueType: 'DECIMAL', value: 0.05, description: 'Fee de la plataforma (5%)' },
  { key: 'fees.causeShare', group: 'FEES', valueType: 'DECIMAL', value: 0.70, description: 'Porcentaje para la causa (70%)' },
  { key: 'fees.creatorShare', group: 'FEES', valueType: 'DECIMAL', value: 0.25, description: 'Porcentaje para el creador (25%)' },
  { key: 'fees.paymentProcessing', group: 'FEES', valueType: 'DECIMAL', value: 0.029, description: 'Fee procesamiento de pago (2.9%)' },
  
  // Sorteos (DOC 40 seccion 5)
  { key: 'raffle.maxTicketsPerUser', group: 'RAFFLE', valueType: 'INTEGER', value: 100, description: 'Máximo boletos por usuario' },
  { key: 'raffle.ticketsPerEuro', group: 'RAFFLE', valueType: 'INTEGER', value: 1, description: 'Boletos por euro donado' },
  { key: 'raffle.bonusTicketsPro', group: 'RAFFLE', valueType: 'INTEGER', value: 2, description: 'Boletos bonus plan Pro' },
  { key: 'raffle.bonusTicketsPremium', group: 'RAFFLE', valueType: 'INTEGER', value: 5, description: 'Boletos bonus plan Premium' },
  { key: 'raffle.bonusTicketsElite', group: 'RAFFLE', valueType: 'INTEGER', value: 10, description: 'Boletos bonus plan Elite' },
  { key: 'raffle.minDurationDays', group: 'RAFFLE', valueType: 'INTEGER', value: 1, description: 'Duración mínima en días' },
  { key: 'raffle.maxDurationDays', group: 'RAFFLE', valueType: 'INTEGER', value: 90, description: 'Duración máxima en días' },
  { key: 'raffle.maxActivePerUser', group: 'RAFFLE', valueType: 'INTEGER', value: 5, description: 'Sorteos activos máx por usuario' },
  { key: 'raffle.minParticipants', group: 'RAFFLE', valueType: 'INTEGER', value: 10, description: 'Participantes mínimos' },
  
  // Premios (DOC 40 seccion 6)
  { key: 'prize.maxValueNoReview', group: 'PRIZE', valueType: 'DECIMAL', value: 500.00, description: 'Valor máximo sin revisión (€)' },
  { key: 'prize.maxDeliveryDaysPhysical', group: 'PRIZE', valueType: 'INTEGER', value: 30, description: 'Días máx entrega física' },
  { key: 'prize.maxDeliveryDaysDigital', group: 'PRIZE', valueType: 'INTEGER', value: 7, description: 'Días máx entrega digital' },
  { key: 'prize.allowedTypes', group: 'PRIZE', valueType: 'ARRAY', value: ['physical', 'digital', 'experience'], description: 'Tipos de premio permitidos' },
  { key: 'prize.evidenceRequiredPhysical', group: 'PRIZE', valueType: 'BOOLEAN', value: true, description: 'Evidencia obligatoria física' },
  { key: 'prize.evidenceRequiredDigital', group: 'PRIZE', valueType: 'BOOLEAN', value: false, description: 'Evidencia obligatoria digital' },
  
  // Causas (DOC 40 seccion 7)
  { key: 'cause.requiredDocsOwn', group: 'CAUSE', valueType: 'ARRAY', value: ['registration', 'id', 'bank'], description: 'Docs obligatorios causa propia' },
  { key: 'cause.requiredDocsExternal', group: 'CAUSE', valueType: 'ARRAY', value: ['authorization'], description: 'Docs obligatorios causa externa' },
  { key: 'cause.reviewDays', group: 'CAUSE', valueType: 'INTEGER', value: 5, description: 'Días para revisión' },
  { key: 'cause.activeCategories', group: 'CAUSE', valueType: 'ARRAY', value: ['health', 'education', 'environment', 'social', 'animals'], description: 'Categorías activas' },
  { key: 'cause.minGoal', group: 'CAUSE', valueType: 'DECIMAL', value: 100.00, description: 'Meta mínima (€)' },
  { key: 'cause.maxGoal', group: 'CAUSE', valueType: 'DECIMAL', value: 1000000.00, description: 'Meta máxima (€)' },
  
  // KYC (DOC 40 seccion 8)
  { key: 'kyc.level1Triggers', group: 'KYC', valueType: 'ARRAY', value: ['first_withdrawal', 'money_received'], description: 'Triggers KYC Nivel 1' },
  { key: 'kyc.level2Triggers', group: 'KYC', valueType: 'ARRAY', value: ['threshold_exceeded', 'high_value_prize'], description: 'Triggers KYC Nivel 2' },
  { key: 'kyc.level2Threshold', group: 'KYC', valueType: 'DECIMAL', value: 1000.00, description: 'Umbral KYC Nivel 2 (€)' },
  { key: 'kyc.activeProvider', group: 'KYC', valueType: 'STRING', value: 'veriff', description: 'Proveedor KYC activo' },
  { key: 'kyc.verificationTimeout', group: 'KYC', valueType: 'INTEGER', value: 30, description: 'Timeout verificación (min)' },
  { key: 'kyc.maxRetries', group: 'KYC', valueType: 'INTEGER', value: 3, description: 'Reintentos permitidos' },
  { key: 'kyc.validityDays', group: 'KYC', valueType: 'INTEGER', value: 365, description: 'Días validez KYC' },
  
  // Mensajería (DOC 40 seccion 9)
  { key: 'messaging.maxPerDay', group: 'MESSAGING', valueType: 'INTEGER', value: 5, description: 'Mensajes máx/día/usuario' },
  { key: 'messaging.minGapMinutes', group: 'MESSAGING', valueType: 'INTEGER', value: 60, description: 'Minutos mín entre mensajes' },
  { key: 'messaging.allowedHoursStart', group: 'MESSAGING', valueType: 'INTEGER', value: 9, description: 'Hora inicio permitida' },
  { key: 'messaging.allowedHoursEnd', group: 'MESSAGING', valueType: 'INTEGER', value: 21, description: 'Hora fin permitida' },
  { key: 'messaging.activeChannels', group: 'MESSAGING', valueType: 'ARRAY', value: ['push', 'email', 'internal'], description: 'Canales activos' },
  { key: 'messaging.activeLanguages', group: 'MESSAGING', valueType: 'ARRAY', value: ['ES', 'EN'], description: 'Idiomas activos' },
  { key: 'messaging.defaultLanguage', group: 'MESSAGING', valueType: 'STRING', value: 'ES', description: 'Idioma por defecto' },
  
  // Fraude (DOC 40 seccion 10)
  { key: 'fraud.flagsBeforeSuspension', group: 'FRAUD', valueType: 'INTEGER', value: 3, description: 'Flags antes de suspensión' },
  { key: 'fraud.flagsBeforeBlock', group: 'FRAUD', valueType: 'INTEGER', value: 5, description: 'Flags antes de bloqueo' },
  { key: 'fraud.suspiciousParticipationsPerHour', group: 'FRAUD', valueType: 'INTEGER', value: 50, description: 'Participaciones/hora sospechosas' },
  { key: 'fraud.maxIpsPerAccount', group: 'FRAUD', valueType: 'INTEGER', value: 10, description: 'IPs máx por cuenta' },
  { key: 'fraud.maxAccountsPerIp', group: 'FRAUD', valueType: 'INTEGER', value: 3, description: 'Cuentas máx por IP' },
  { key: 'fraud.patternAnalysisDays', group: 'FRAUD', valueType: 'INTEGER', value: 30, description: 'Días para análisis de patrones' },
  
  // Geolocalización (DOC 40 seccion 11)
  { key: 'geo.precisionLevel', group: 'GEO', valueType: 'STRING', value: 'city', description: 'Nivel de precisión' },
  { key: 'geo.showInCreatorDashboard', group: 'GEO', valueType: 'BOOLEAN', value: true, description: 'Mostrar en dashboard creador' },
  { key: 'geo.activeCountries', group: 'GEO', valueType: 'ARRAY', value: ['ES', 'MX', 'AR', 'CO'], description: 'Países activos' },
  { key: 'geo.blockedCountries', group: 'GEO', valueType: 'ARRAY', value: [], description: 'Países bloqueados' },
  { key: 'geo.requireExplicitConsent', group: 'GEO', valueType: 'BOOLEAN', value: true, description: 'Requiere consentimiento explícito' },
  
  // Legal (DOC 40 seccion 12)
  { key: 'legal.activeTosVersion', group: 'LEGAL', valueType: 'STRING', value: '1.0', description: 'Versión activa TOS' },
  { key: 'legal.activePrivacyVersion', group: 'LEGAL', valueType: 'STRING', value: '1.0', description: 'Versión activa Privacy' },
  { key: 'legal.tosLanguages', group: 'LEGAL', valueType: 'ARRAY', value: ['ES', 'EN'], description: 'Idiomas TOS disponibles' },
  { key: 'legal.minimumAge', group: 'LEGAL', valueType: 'INTEGER', value: 18, description: 'Edad mínima' },
  { key: 'legal.requireExplicitAcceptance', group: 'LEGAL', valueType: 'BOOLEAN', value: true, description: 'Requiere aceptación explícita' },
];

// ============================================================================
// INTERFACES (DOC 40 seccion 14)
// ============================================================================

export interface ConfigItem {
  key: string;
  group: ConfigGroup;
  value: any;
  valueType: ConfigValueType;
  country?: string;
  description?: string;
  version: number;
  updatedAt: Date;
}

export interface ConfigHistory {
  id: string;
  configKey: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: Date;
  changeReason?: string;
}

export interface UpdateConfigRequest {
  value: any;
  country?: string;
  reason: string;
  confirmationCode?: string;
}

export interface ConfigGetOptions {
  country?: string;
}

// ============================================================================
// CONFIGURACIONES SENSIBLES (DOC 40 seccion 15)
// ============================================================================

// Claves que requieren confirmación adicional para cambiar
export const SENSITIVE_CONFIG_KEYS = [
  'money.kycLevel2Threshold',
  'money.maxAutoRelease',
  'fees.platformFee',
  'fees.causeShare',
  'fees.creatorShare',
  'fraud.flagsBeforeSuspension',
  'fraud.flagsBeforeBlock',
  'legal.minimumAge',
] as const;

// Claves que no deben mostrarse en logs
export const HIDDEN_FROM_LOGS_KEYS = [
  'kyc.activeProvider', // Puede revelar infraestructura
] as const;
