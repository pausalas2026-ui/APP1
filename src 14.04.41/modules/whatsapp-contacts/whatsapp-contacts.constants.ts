// MODULO WHATSAPP CONTACTS
// Importación y gestión de contactos de WhatsApp para envío de mensajes
// Integración con RGPD (DOC35) y Engagement (DOC36)

/**
 * Estado del contacto importado
 */
export enum ContactStatus {
  /** Contacto activo y disponible para mensajes */
  ACTIVE = 'ACTIVE',
  /** Contacto inactivo (deshabilitado por usuario) */
  INACTIVE = 'INACTIVE',
  /** Contacto bloqueado (opt-out solicitado) */
  BLOCKED = 'BLOCKED',
  /** Número inválido o no existe en WhatsApp */
  INVALID = 'INVALID',
  /** Pendiente de validación */
  PENDING = 'PENDING',
}

/**
 * Fuente de importación de contactos
 */
export enum ImportSource {
  /** Importación desde agenda del dispositivo */
  DEVICE_CONTACTS = 'DEVICE_CONTACTS',
  /** Importación manual individual */
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  /** Importación desde archivo CSV */
  CSV_UPLOAD = 'CSV_UPLOAD',
  /** Importación desde vCard */
  VCARD = 'VCARD',
}

/**
 * Estado del consentimiento para envío de mensajes
 */
export enum ContactConsentStatus {
  /** Consentimiento pendiente (aún no solicitado) */
  PENDING = 'PENDING',
  /** Consentimiento otorgado explícitamente */
  GRANTED = 'GRANTED',
  /** Consentimiento denegado */
  DENIED = 'DENIED',
  /** Consentimiento revocado posteriormente */
  REVOKED = 'REVOKED',
}

/**
 * Tipo de mensaje que se puede enviar
 */
export enum WhatsAppMessageType {
  /** Invitación a participar en sorteo */
  SORTEO_INVITE = 'SORTEO_INVITE',
  /** Notificación de nuevo sorteo disponible */
  SORTEO_NEW = 'SORTEO_NEW',
  /** Resultado de sorteo */
  SORTEO_RESULT = 'SORTEO_RESULT',
  /** Promoción general */
  PROMOTION = 'PROMOTION',
  /** Actualización de causa social */
  CAUSE_UPDATE = 'CAUSE_UPDATE',
  /** Mensaje personalizado */
  CUSTOM = 'CUSTOM',
  /** Recordatorio de participación */
  REMINDER = 'REMINDER',
}

/**
 * Estado del envío de mensaje
 */
export enum MessageSendStatus {
  /** En cola para enviar */
  QUEUED = 'QUEUED',
  /** Enviado exitosamente */
  SENT = 'SENT',
  /** Entregado al destinatario */
  DELIVERED = 'DELIVERED',
  /** Leído por destinatario */
  READ = 'READ',
  /** Error en envío */
  FAILED = 'FAILED',
  /** Mensaje rechazado (spam, opt-out, etc) */
  REJECTED = 'REJECTED',
}

/**
 * Configuración de límites de envío (anti-spam)
 */
export const WHATSAPP_SEND_LIMITS = {
  /** Máximo de mensajes por contacto por día */
  maxMessagesPerContactPerDay: 1,
  /** Máximo de mensajes totales por usuario por día */
  maxTotalMessagesPerDay: 50,
  /** Días mínimos entre mensajes al mismo contacto */
  minDaysBetweenMessages: 3,
  /** Máximo de contactos por importación */
  maxContactsPerImport: 500,
  /** Horas permitidas para envío (respeto horario) */
  allowedSendHours: { start: 9, end: 21 },
  /** Tasa límite: mensajes por minuto */
  rateLimitPerMinute: 10,
};

/**
 * Configuración de validación de contactos
 */
export const CONTACT_VALIDATION_CONFIG = {
  /** Regex para validar número de teléfono internacional */
  phoneRegex: /^\+[1-9]\d{6,14}$/,
  /** Longitud mínima del nombre */
  minNameLength: 2,
  /** Longitud máxima del nombre */
  maxNameLength: 100,
  /** Prefijos de país permitidos (ejemplo, se puede expandir) */
  allowedCountryCodes: [
    '+34', // España
    '+1',  // USA/Canada
    '+52', // México
    '+54', // Argentina
    '+57', // Colombia
    '+56', // Chile
    '+51', // Perú
    '+593', // Ecuador
    '+58', // Venezuela
    '+55', // Brasil
    '+44', // UK
    '+33', // Francia
    '+49', // Alemania
    '+39', // Italia
  ],
};

/**
 * Templates de mensajes predefinidos por tipo
 */
export const MESSAGE_TEMPLATES: Record<WhatsAppMessageType, {
  es: string;
  en: string;
}> = {
  [WhatsAppMessageType.SORTEO_INVITE]: {
    es: '🎉 ¡Hola {{name}}! {{senderName}} te invita a participar en un sorteo solidario. Premio: {{prizeName}}. Participa aquí: {{link}}',
    en: '🎉 Hi {{name}}! {{senderName}} invites you to join a charity sweepstake. Prize: {{prizeName}}. Join here: {{link}}',
  },
  [WhatsAppMessageType.SORTEO_NEW]: {
    es: '🆕 ¡Nuevo sorteo disponible! {{prizeName}} - {{causeName}}. Participa y ayuda: {{link}}',
    en: '🆕 New sweepstake available! {{prizeName}} - {{causeName}}. Join and help: {{link}}',
  },
  [WhatsAppMessageType.SORTEO_RESULT]: {
    es: '🏆 ¡El sorteo "{{sweepstakeName}}" ha finalizado! {{resultMessage}}. Ver resultados: {{link}}',
    en: '🏆 Sweepstake "{{sweepstakeName}}" has ended! {{resultMessage}}. See results: {{link}}',
  },
  [WhatsAppMessageType.PROMOTION]: {
    es: '💫 {{senderName}} te recomienda I Love To Help. ¡Sorteos solidarios que cambian vidas! {{link}}',
    en: '💫 {{senderName}} recommends I Love To Help. Charity sweepstakes that change lives! {{link}}',
  },
  [WhatsAppMessageType.CAUSE_UPDATE]: {
    es: '❤️ Actualización de la causa "{{causeName}}": {{updateMessage}}. Más info: {{link}}',
    en: '❤️ Update from cause "{{causeName}}": {{updateMessage}}. More info: {{link}}',
  },
  [WhatsAppMessageType.CUSTOM]: {
    es: '{{customMessage}}',
    en: '{{customMessage}}',
  },
  [WhatsAppMessageType.REMINDER]: {
    es: '⏰ ¡Recordatorio! El sorteo "{{sweepstakeName}}" termina pronto. ¡No te quedes sin participar! {{link}}',
    en: '⏰ Reminder! Sweepstake "{{sweepstakeName}}" ends soon. Don\'t miss out! {{link}}',
  },
};

/**
 * Códigos de error específicos del módulo
 */
export const WHATSAPP_CONTACTS_ERRORS = {
  IMPORT_CONSENT_REQUIRED: 'Se requiere consentimiento explícito para importar contactos',
  INVALID_PHONE_FORMAT: 'Formato de número de teléfono inválido. Use formato internacional (+XX...)',
  CONTACT_NOT_FOUND: 'Contacto no encontrado',
  CONTACT_BLOCKED: 'El contacto ha bloqueado la recepción de mensajes',
  CONTACT_OPTED_OUT: 'El contacto ha solicitado no recibir mensajes',
  DAILY_LIMIT_EXCEEDED: 'Se ha excedido el límite diario de mensajes',
  CONTACT_LIMIT_EXCEEDED: 'Se ha excedido el límite de mensajes a este contacto',
  IMPORT_LIMIT_EXCEEDED: 'Se ha excedido el límite máximo de contactos por importación',
  OUTSIDE_SEND_HOURS: 'Los mensajes solo pueden enviarse entre 9:00 y 21:00',
  RATE_LIMIT_EXCEEDED: 'Demasiados mensajes en poco tiempo. Intente más tarde',
  INVALID_MESSAGE_TYPE: 'Tipo de mensaje no válido',
  DUPLICATE_CONTACT: 'Este contacto ya existe en su lista',
  RGPD_CONSENT_MISSING: 'Falta consentimiento RGPD para esta operación',
};

/**
 * Texto legal requerido para consentimiento
 */
export const CONSENT_LEGAL_TEXT = {
  importConsent: {
    es: `Al importar sus contactos, usted declara que:
1. Tiene derecho legal a usar estos datos de contacto
2. Utilizará estos contactos únicamente para invitaciones a sorteos solidarios
3. No compartirá estos datos con terceros
4. Respetará las solicitudes de opt-out de sus contactos
5. Acepta la política de privacidad y términos de uso`,
    en: `By importing your contacts, you declare that:
1. You have legal right to use this contact data
2. You will use these contacts only for charity sweepstake invitations
3. You will not share this data with third parties
4. You will respect opt-out requests from your contacts
5. You accept the privacy policy and terms of use`,
  },
  sendConsent: {
    es: `El mensaje incluirá una opción para que el destinatario pueda darse de baja en cualquier momento.`,
    en: `The message will include an option for the recipient to unsubscribe at any time.`,
  },
};

/**
 * Configuración de auditoría
 */
export const AUDIT_EVENTS = {
  CONTACTS_IMPORTED: 'WHATSAPP_CONTACTS_IMPORTED',
  CONTACT_ADDED: 'WHATSAPP_CONTACT_ADDED',
  CONTACT_REMOVED: 'WHATSAPP_CONTACT_REMOVED',
  CONTACT_STATUS_CHANGED: 'WHATSAPP_CONTACT_STATUS_CHANGED',
  MESSAGE_SENT: 'WHATSAPP_MESSAGE_SENT',
  MESSAGE_FAILED: 'WHATSAPP_MESSAGE_FAILED',
  CONSENT_GRANTED: 'WHATSAPP_CONSENT_GRANTED',
  CONSENT_REVOKED: 'WHATSAPP_CONSENT_REVOKED',
  OPT_OUT_REQUESTED: 'WHATSAPP_OPT_OUT_REQUESTED',
};
