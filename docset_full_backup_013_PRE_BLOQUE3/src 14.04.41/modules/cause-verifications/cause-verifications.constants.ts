// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6, 14
// BLOQUE 2 - SUB-BLOQUE 2.4: Constantes de verificacion de causas
// Alcance: Estados, flags, motivos de rechazo
// SIN: flujos de dinero, KYC, automatizaciones, panel admin

/**
 * Estados de verificacion de causa
 * Referencia: DOCUMENTO 32 seccion 14 - Estado de Verificacion de Causa
 * pending → under_review → approved
 *                       ↘ rejected
 */
export enum EstadoVerificacion {
  PENDIENTE = 'PENDIENTE',
  EN_REVISION = 'EN_REVISION',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

/**
 * Transiciones validas entre estados de verificacion
 * Solo transiciones manuales (sin automatizaciones)
 */
export const TRANSICIONES_VERIFICACION: Record<EstadoVerificacion, EstadoVerificacion[]> = {
  [EstadoVerificacion.PENDIENTE]: [EstadoVerificacion.EN_REVISION],
  [EstadoVerificacion.EN_REVISION]: [EstadoVerificacion.APROBADA, EstadoVerificacion.RECHAZADA],
  [EstadoVerificacion.APROBADA]: [], // Estado final
  [EstadoVerificacion.RECHAZADA]: [], // Estado final
};

/**
 * Flags de validacion de causa
 * Indica que informacion ha sido proporcionada
 */
export interface FlagsVerificacion {
  tieneDocumentos: boolean;
  tieneEnlacesExternos: boolean;
  tieneInfoFundacion: boolean;
  tieneImagenes: boolean;
}

/**
 * Motivos de rechazo predefinidos
 * Referencia: DOCUMENTO 32 - causas no verificadas
 */
export enum MotivoRechazo {
  DOCUMENTACION_INSUFICIENTE = 'DOCUMENTACION_INSUFICIENTE',
  FUNDACION_NO_VERIFICABLE = 'FUNDACION_NO_VERIFICABLE',
  INFORMACION_INCONSISTENTE = 'INFORMACION_INCONSISTENTE',
  CAUSA_DUPLICADA = 'CAUSA_DUPLICADA',
  NO_CUMPLE_REQUISITOS = 'NO_CUMPLE_REQUISITOS',
  OTRO = 'OTRO',
}

/**
 * Descripcion legible de motivos de rechazo
 */
export const DESCRIPCION_MOTIVOS_RECHAZO: Record<MotivoRechazo, string> = {
  [MotivoRechazo.DOCUMENTACION_INSUFICIENTE]: 
    'La documentacion proporcionada no es suficiente para verificar la causa',
  [MotivoRechazo.FUNDACION_NO_VERIFICABLE]: 
    'No se pudo verificar la existencia o legalidad de la fundacion',
  [MotivoRechazo.INFORMACION_INCONSISTENTE]: 
    'La informacion proporcionada presenta inconsistencias',
  [MotivoRechazo.CAUSA_DUPLICADA]: 
    'Ya existe una causa similar registrada en la plataforma',
  [MotivoRechazo.NO_CUMPLE_REQUISITOS]: 
    'La causa no cumple con los requisitos minimos de la plataforma',
  [MotivoRechazo.OTRO]: 
    'Motivo especificado en las notas del revisor',
};

/**
 * Requisitos minimos para enviar a revision
 */
export const REQUISITOS_MINIMOS_VERIFICACION = {
  minimoDocumentos: 0, // Opcional pero recomendado
  minimoEnlaces: 0, // Opcional pero recomendado
  requiereFundacionInfo: false, // No obligatorio
  longitudMinimaDescripcion: 20,
  longitudMaximaDescripcion: 2000,
  longitudMinimaNombre: 3,
  longitudMaximaNombre: 200,
};

/**
 * Estados de causa que permiten verificacion
 */
export const ESTADOS_CAUSA_VERIFICABLES = ['PENDIENTE', 'INACTIVA'];

/**
 * Validar si una transicion de estado es permitida
 */
export function esTransicionValida(
  estadoActual: EstadoVerificacion,
  estadoNuevo: EstadoVerificacion,
): boolean {
  const transicionesPermitidas = TRANSICIONES_VERIFICACION[estadoActual];
  return transicionesPermitidas.includes(estadoNuevo);
}

/**
 * Obtener flags de verificacion desde datos de verificacion
 */
export function obtenerFlagsVerificacion(data: {
  documents?: string[] | null;
  externalLinks?: string[] | null;
  foundationName?: string | null;
  foundationId?: string | null;
  imagenUrl?: string | null;
}): FlagsVerificacion {
  return {
    tieneDocumentos: Array.isArray(data.documents) && data.documents.length > 0,
    tieneEnlacesExternos: Array.isArray(data.externalLinks) && data.externalLinks.length > 0,
    tieneInfoFundacion: !!(data.foundationName || data.foundationId),
    tieneImagenes: !!data.imagenUrl,
  };
}
