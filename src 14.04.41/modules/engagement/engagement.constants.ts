/**
 * DOCUMENTO 36 - ENGAGEMENT, MENSAJERÍA Y GEOLOCALIZACIÓN
 * ========================================================
 * Constantes y enums para engagement, mensajería automática y geolocalización
 * 
 * PRINCIPIO RECTOR:
 * "Cada acción del usuario debe generar una reacción de la app"
 * ACCIÓN → REACCIÓN → CTA (Ciclo completo)
 */

/**
 * Canales de mensajería disponibles
 * DOC36: La app debe estar preparada para múltiples canales
 */
export enum MessageChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  INTERNAL = 'INTERNAL',
  WHATSAPP = 'WHATSAPP', // Futuro
  SMS = 'SMS', // Futuro
}

/**
 * Prioridad de mensajes
 */
export enum MessagePriority {
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

/**
 * Tipos de actualización de causa
 * DOC36: El creador puede crear diferentes tipos de estados
 */
export enum CauseUpdateType {
  NEWS = 'NEWS',
  MILESTONE = 'MILESTONE',
  THANKS = 'THANKS',
  PROGRESS = 'PROGRESS',
  MEDIA = 'MEDIA',
}

/**
 * Tipos de hito que disparan mensajes automáticos
 */
export enum MilestoneType {
  PERCENT_25 = 'PERCENT_25',
  PERCENT_50 = 'PERCENT_50',
  PERCENT_75 = 'PERCENT_75',
  PERCENT_100 = 'PERCENT_100',
  NEW_COUNTRY = 'NEW_COUNTRY',
  DONORS_10 = 'DONORS_10',
  DONORS_50 = 'DONORS_50',
  DONORS_100 = 'DONORS_100',
}

/**
 * Eventos que disparan mensajes
 * DOC36: Matriz de eventos → mensajes
 */
export enum EngagementEvent {
  // Participación
  PARTICIPATION_CONFIRMED = 'PARTICIPATION_CONFIRMED',
  
  // Donaciones
  DONATION_THANKS = 'DONATION_THANKS',
  
  // Sorteos
  WINNER_NOTIFICATION = 'WINNER_NOTIFICATION',
  RAFFLE_REMINDER_24H = 'RAFFLE_REMINDER_24H',
  RAFFLE_REMINDER_1H = 'RAFFLE_REMINDER_1H',
  
  // Causas - Hitos
  CAUSE_MILESTONE_25 = 'CAUSE_MILESTONE_25',
  CAUSE_MILESTONE_50 = 'CAUSE_MILESTONE_50',
  CAUSE_MILESTONE_75 = 'CAUSE_MILESTONE_75',
  CAUSE_COMPLETED = 'CAUSE_COMPLETED',
  CAUSE_UPDATE_NEWS = 'CAUSE_UPDATE_NEWS',
  
  // Premios y KYC
  PRIZE_CLAIM_APPROVED = 'PRIZE_CLAIM_APPROVED',
  KYC_APPROVED = 'KYC_APPROVED',
  MONEY_RELEASED = 'MONEY_RELEASED',
}

/**
 * Configuración de canales por evento
 * DOC36: Cada evento tiene canales específicos
 */
export const EVENT_CHANNELS: Record<EngagementEvent, MessageChannel[]> = {
  [EngagementEvent.PARTICIPATION_CONFIRMED]: [MessageChannel.PUSH, MessageChannel.INTERNAL],
  [EngagementEvent.DONATION_THANKS]: [MessageChannel.PUSH, MessageChannel.EMAIL, MessageChannel.INTERNAL],
  [EngagementEvent.WINNER_NOTIFICATION]: [MessageChannel.PUSH, MessageChannel.EMAIL, MessageChannel.INTERNAL],
  [EngagementEvent.RAFFLE_REMINDER_24H]: [MessageChannel.PUSH],
  [EngagementEvent.RAFFLE_REMINDER_1H]: [MessageChannel.PUSH],
  [EngagementEvent.CAUSE_MILESTONE_25]: [MessageChannel.PUSH, MessageChannel.INTERNAL],
  [EngagementEvent.CAUSE_MILESTONE_50]: [MessageChannel.PUSH, MessageChannel.INTERNAL],
  [EngagementEvent.CAUSE_MILESTONE_75]: [MessageChannel.PUSH, MessageChannel.INTERNAL],
  [EngagementEvent.CAUSE_COMPLETED]: [MessageChannel.PUSH, MessageChannel.EMAIL, MessageChannel.INTERNAL],
  [EngagementEvent.CAUSE_UPDATE_NEWS]: [MessageChannel.PUSH, MessageChannel.INTERNAL],
  [EngagementEvent.PRIZE_CLAIM_APPROVED]: [MessageChannel.PUSH, MessageChannel.EMAIL],
  [EngagementEvent.KYC_APPROVED]: [MessageChannel.PUSH, MessageChannel.EMAIL],
  [EngagementEvent.MONEY_RELEASED]: [MessageChannel.PUSH, MessageChannel.EMAIL],
};

/**
 * Eventos inmediatos vs diferidos
 * DOC36: Algunos mensajes se envían siempre, otros respetan frecuencia
 */
export const IMMEDIATE_EVENTS: EngagementEvent[] = [
  EngagementEvent.PARTICIPATION_CONFIRMED,
  EngagementEvent.DONATION_THANKS,
  EngagementEvent.WINNER_NOTIFICATION,
  EngagementEvent.PRIZE_CLAIM_APPROVED,
  EngagementEvent.KYC_APPROVED,
  EngagementEvent.MONEY_RELEASED,
  EngagementEvent.CAUSE_COMPLETED,
];

/**
 * Tipos de referencia para mensajes
 */
export enum MessageReferenceType {
  CAUSE = 'CAUSE',
  RAFFLE = 'RAFFLE',
  DONATION = 'DONATION',
  PRIZE = 'PRIZE',
  USER = 'USER',
}

/**
 * Idiomas soportados
 */
export enum SupportedLanguage {
  ES = 'ES',
  EN = 'EN',
  FR = 'FR',
  DE = 'DE',
  PT = 'PT',
  IT = 'IT',
}

/**
 * Configuración de frecuencia de mensajes
 * DOC36: Engagement ≠ spam
 */
export const FREQUENCY_LIMITS = {
  // Máximo mensajes por día por usuario
  maxPerDay: 5,
  
  // Mínimo tiempo entre mensajes no urgentes (minutos)
  minGapMinutes: 60,
  
  // Horario permitido (hora local del usuario)
  allowedHours: { start: 9, end: 21 },
  
  // Eventos que siempre se envían (ignoran límites)
  immediateAlways: IMMEDIATE_EVENTS,
} as const;

/**
 * Hitos de porcentaje para causas
 */
export const CAUSE_MILESTONES = {
  PERCENT_25: { threshold: 25, template: 'CAUSE_MILESTONE_25' },
  PERCENT_50: { threshold: 50, template: 'CAUSE_MILESTONE_50' },
  PERCENT_75: { threshold: 75, template: 'CAUSE_MILESTONE_75' },
  PERCENT_100: { threshold: 100, template: 'CAUSE_COMPLETED' },
} as const;

/**
 * Hitos de donantes para causas
 */
export const DONOR_MILESTONES = {
  DONORS_10: { threshold: 10, message: '10 personas ya apoyan' },
  DONORS_50: { threshold: 50, message: '50 corazones unidos' },
  DONORS_100: { threshold: 100, message: '¡100 héroes!' },
} as const;

/**
 * Mensajes de hito por idioma
 */
export const MILESTONE_MESSAGES: Record<SupportedLanguage, Record<string, string>> = {
  [SupportedLanguage.ES]: {
    PERCENT_25: '¡Un cuarto del camino!',
    PERCENT_50: '¡Mitad del objetivo!',
    PERCENT_75: '¡Ya casi lo logramos!',
    PERCENT_100: '¡META CUMPLIDA! 🎉',
    NEW_COUNTRY: 'Apoyo desde {{country}}',
  },
  [SupportedLanguage.EN]: {
    PERCENT_25: 'One quarter of the way!',
    PERCENT_50: 'Halfway there!',
    PERCENT_75: 'Almost there!',
    PERCENT_100: 'GOAL REACHED! 🎉',
    NEW_COUNTRY: 'Support from {{country}}',
  },
  [SupportedLanguage.FR]: {
    PERCENT_25: 'Un quart du chemin!',
    PERCENT_50: 'À mi-chemin!',
    PERCENT_75: 'Presque là!',
    PERCENT_100: 'OBJECTIF ATTEINT! 🎉',
    NEW_COUNTRY: 'Soutien de {{country}}',
  },
  [SupportedLanguage.DE]: {
    PERCENT_25: 'Ein Viertel geschafft!',
    PERCENT_50: 'Halbzeit!',
    PERCENT_75: 'Fast geschafft!',
    PERCENT_100: 'ZIEL ERREICHT! 🎉',
    NEW_COUNTRY: 'Unterstützung aus {{country}}',
  },
  [SupportedLanguage.PT]: {
    PERCENT_25: 'Um quarto do caminho!',
    PERCENT_50: 'Metade do objetivo!',
    PERCENT_75: 'Quase lá!',
    PERCENT_100: 'META ALCANÇADA! 🎉',
    NEW_COUNTRY: 'Apoio de {{country}}',
  },
  [SupportedLanguage.IT]: {
    PERCENT_25: 'Un quarto del percorso!',
    PERCENT_50: 'A metà strada!',
    PERCENT_75: 'Quasi raggiunto!',
    PERCENT_100: 'OBIETTIVO RAGGIUNTO! 🎉',
    NEW_COUNTRY: 'Supporto da {{country}}',
  },
};

/**
 * Errores de engagement
 */
export const ENGAGEMENT_ERRORS = {
  USER_NOT_FOUND: 'Usuario no encontrado',
  TEMPLATE_NOT_FOUND: 'Template de mensaje no encontrado',
  CHANNEL_NOT_SUPPORTED: 'Canal de mensajería no soportado',
  RATE_LIMIT_EXCEEDED: 'Límite de mensajes excedido',
  INVALID_EVENT: 'Evento no válido',
  CAUSE_NOT_FOUND: 'Causa no encontrada',
  UPDATE_NOT_FOUND: 'Actualización no encontrada',
  UNAUTHORIZED_UPDATE: 'No autorizado para actualizar esta causa',
} as const;

/**
 * Prioridad de detección de idioma
 * DOC36: Cómo determinar idioma del receptor
 */
export const LANGUAGE_DETECTION_PRIORITY = [
  'userPreference',    // 1. Preferencia del usuario (configuración)
  'browserLanguage',   // 2. Idioma del navegador/app
  'geolocation',       // 3. Geolocalización
  'systemDefault',     // 4. Idioma por defecto del sistema
] as const;

/**
 * Idioma por defecto
 */
export const DEFAULT_LANGUAGE = SupportedLanguage.ES;

/**
 * Mapeo de país a idioma (para geolocalización)
 */
export const COUNTRY_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  ES: SupportedLanguage.ES,
  MX: SupportedLanguage.ES,
  AR: SupportedLanguage.ES,
  CO: SupportedLanguage.ES,
  CL: SupportedLanguage.ES,
  PE: SupportedLanguage.ES,
  US: SupportedLanguage.EN,
  GB: SupportedLanguage.EN,
  CA: SupportedLanguage.EN,
  AU: SupportedLanguage.EN,
  FR: SupportedLanguage.FR,
  BE: SupportedLanguage.FR,
  CH: SupportedLanguage.FR,
  DE: SupportedLanguage.DE,
  AT: SupportedLanguage.DE,
  BR: SupportedLanguage.PT,
  PT: SupportedLanguage.PT,
  IT: SupportedLanguage.IT,
};

/**
 * Variables disponibles por template
 */
export const TEMPLATE_VARIABLES: Record<EngagementEvent, string[]> = {
  [EngagementEvent.PARTICIPATION_CONFIRMED]: ['ticket_count', 'raffle_name', 'raffle_date', 'user_name'],
  [EngagementEvent.DONATION_THANKS]: ['amount', 'cause_name', 'progress_percent', 'user_name'],
  [EngagementEvent.WINNER_NOTIFICATION]: ['prize_name', 'raffle_name', 'claim_url', 'user_name'],
  [EngagementEvent.RAFFLE_REMINDER_24H]: ['raffle_name', 'ticket_count', 'user_name'],
  [EngagementEvent.RAFFLE_REMINDER_1H]: ['raffle_name', 'ticket_count', 'user_name'],
  [EngagementEvent.CAUSE_MILESTONE_25]: ['cause_name', 'progress_percent', 'user_name'],
  [EngagementEvent.CAUSE_MILESTONE_50]: ['cause_name', 'progress_percent', 'user_name'],
  [EngagementEvent.CAUSE_MILESTONE_75]: ['cause_name', 'progress_percent', 'user_name'],
  [EngagementEvent.CAUSE_COMPLETED]: ['cause_name', 'total_raised', 'donor_count', 'user_name'],
  [EngagementEvent.CAUSE_UPDATE_NEWS]: ['cause_name', 'update_title', 'user_name'],
  [EngagementEvent.PRIZE_CLAIM_APPROVED]: ['prize_name', 'user_name'],
  [EngagementEvent.KYC_APPROVED]: ['user_name'],
  [EngagementEvent.MONEY_RELEASED]: ['amount', 'user_name'],
};

/**
 * Determina si un evento es inmediato
 */
export function isImmediateEvent(event: EngagementEvent): boolean {
  return IMMEDIATE_EVENTS.includes(event);
}

/**
 * Obtiene los canales para un evento
 */
export function getChannelsForEvent(event: EngagementEvent): MessageChannel[] {
  return EVENT_CHANNELS[event] || [MessageChannel.INTERNAL];
}

/**
 * Obtiene el idioma por código de país
 */
export function getLanguageByCountry(countryCode: string): SupportedLanguage {
  return COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()] || DEFAULT_LANGUAGE;
}
