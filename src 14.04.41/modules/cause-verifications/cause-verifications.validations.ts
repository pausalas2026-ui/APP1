// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 6
// BLOQUE 2 - SUB-BLOQUE 2.4: Validaciones de verificacion de causas
// Alcance: Validacion de estados, flags, datos requeridos
// SIN: flujos de dinero, KYC, automatizaciones, panel admin

import {
  EstadoVerificacion,
  TRANSICIONES_VERIFICACION,
  REQUISITOS_MINIMOS_VERIFICACION,
  esTransicionValida,
  MotivoRechazo,
} from './cause-verifications.constants';

/**
 * Resultado de validacion
 */
export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
}

/**
 * Validar datos para proponer una causa
 * Referencia: DOCUMENTO 32 seccion 6.2
 */
export function validarPropuestaCausa(data: {
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  sitioWeb?: string;
}): ResultadoValidacion {
  const errores: string[] = [];

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length < REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaNombre) {
    errores.push(
      `El nombre debe tener al menos ${REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaNombre} caracteres`
    );
  }
  if (data.nombre && data.nombre.length > REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaNombre) {
    errores.push(
      `El nombre no puede exceder ${REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaNombre} caracteres`
    );
  }

  // Validar descripcion
  if (!data.descripcion || data.descripcion.trim().length < REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaDescripcion) {
    errores.push(
      `La descripcion debe tener al menos ${REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaDescripcion} caracteres`
    );
  }
  if (data.descripcion && data.descripcion.length > REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaDescripcion) {
    errores.push(
      `La descripcion no puede exceder ${REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaDescripcion} caracteres`
    );
  }

  // Validar URLs si se proporcionan
  if (data.imagenUrl && !esUrlValida(data.imagenUrl)) {
    errores.push('La URL de imagen no es valida');
  }
  if (data.sitioWeb && !esUrlValida(data.sitioWeb)) {
    errores.push('La URL del sitio web no es valida');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar transicion de estado de verificacion
 */
export function validarTransicionEstado(
  estadoActual: EstadoVerificacion,
  estadoNuevo: EstadoVerificacion,
): ResultadoValidacion {
  const errores: string[] = [];

  if (!esTransicionValida(estadoActual, estadoNuevo)) {
    const permitidas = TRANSICIONES_VERIFICACION[estadoActual];
    errores.push(
      `Transicion no permitida: ${estadoActual} → ${estadoNuevo}. ` +
      `Transiciones validas desde ${estadoActual}: ${permitidas.join(', ') || 'ninguna'}`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar datos para subir documentos de verificacion
 */
export function validarDocumentosVerificacion(data: {
  documents?: string[];
  externalLinks?: string[];
}): ResultadoValidacion {
  const errores: string[] = [];

  // Validar URLs de documentos
  if (data.documents && Array.isArray(data.documents)) {
    data.documents.forEach((url, index) => {
      if (!esUrlValida(url)) {
        errores.push(`Documento ${index + 1}: URL no valida`);
      }
    });
  }

  // Validar URLs de enlaces externos
  if (data.externalLinks && Array.isArray(data.externalLinks)) {
    data.externalLinks.forEach((url, index) => {
      if (!esUrlValida(url)) {
        errores.push(`Enlace externo ${index + 1}: URL no valida`);
      }
    });
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar motivo de rechazo
 */
export function validarMotivoRechazo(
  motivo: string,
  detalles?: string,
): ResultadoValidacion {
  const errores: string[] = [];

  // Verificar que el motivo sea valido
  if (!Object.values(MotivoRechazo).includes(motivo as MotivoRechazo)) {
    errores.push(
      `Motivo de rechazo no valido. Valores permitidos: ${Object.values(MotivoRechazo).join(', ')}`
    );
  }

  // Si el motivo es OTRO, se requieren detalles
  if (motivo === MotivoRechazo.OTRO && (!detalles || detalles.trim().length < 10)) {
    errores.push('Cuando el motivo es OTRO, se requiere especificar detalles (minimo 10 caracteres)');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Validar que la verificacion puede recibir documentos adicionales
 * Solo se pueden agregar docs en estado PENDIENTE
 */
export function validarPuedeAgregarDocumentos(
  estadoActual: EstadoVerificacion,
): ResultadoValidacion {
  const errores: string[] = [];

  if (estadoActual !== EstadoVerificacion.PENDIENTE) {
    errores.push(
      `Solo se pueden agregar documentos cuando el estado es PENDIENTE. Estado actual: ${estadoActual}`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Utilidad: Validar URL
 */
function esUrlValida(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
