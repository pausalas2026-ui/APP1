// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 7
// BLOQUE 2 - SUB-BLOQUE 2.7: Constantes de asignacion de causa por defecto
// Alcance: Razones de asignacion, validaciones

/**
 * Razones de asignacion de causa por defecto
 * Referencia: DOCUMENTO 32 seccion 12 - default_cause_assignments
 */
export enum RazonAsignacion {
  USER_DID_NOT_SELECT = 'USER_DID_NOT_SELECT',
  CAUSE_REJECTED = 'CAUSE_REJECTED',
  CAUSE_INACTIVE = 'CAUSE_INACTIVE',
}

/**
 * Descripcion legible de razones de asignacion
 */
export const DESCRIPCION_RAZONES: Record<RazonAsignacion, string> = {
  [RazonAsignacion.USER_DID_NOT_SELECT]: 'El usuario no selecciono ninguna causa',
  [RazonAsignacion.CAUSE_REJECTED]: 'La causa propuesta fue rechazada',
  [RazonAsignacion.CAUSE_INACTIVE]: 'La causa seleccionada esta inactiva',
};

/**
 * ID de la causa por defecto de la plataforma
 * Debe configurarse en variables de entorno
 */
export const DEFAULT_CAUSE_ENV_KEY = 'DEFAULT_CAUSE_ID';
