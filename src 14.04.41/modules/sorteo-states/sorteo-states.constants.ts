// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: Estados y Transiciones
// Definicion de estados, transiciones validas y reglas de negocio

import { EstadoSorteo } from '@prisma/client';

/**
 * ESTADOS AUTORIZADOS (DOCUMENTO 32)
 * - BORRADOR: Sorteo en creacion, no visible publicamente
 * - PROGRAMADO: Sorteo configurado, esperando fecha de inicio
 * - ACTIVO: Sorteo abierto a participaciones
 * - CERRADO: Participaciones cerradas, esperando ejecucion
 * - SORTEANDO: Proceso de seleccion de ganador en curso
 * - FINALIZADO: Ganador seleccionado, sorteo completado
 * - CANCELADO: Sorteo cancelado antes de finalizar
 */
export const ESTADOS_SORTEO = {
  BORRADOR: EstadoSorteo.BORRADOR,
  PROGRAMADO: EstadoSorteo.PROGRAMADO,
  ACTIVO: EstadoSorteo.ACTIVO,
  CERRADO: EstadoSorteo.CERRADO,
  SORTEANDO: EstadoSorteo.SORTEANDO,
  FINALIZADO: EstadoSorteo.FINALIZADO,
  CANCELADO: EstadoSorteo.CANCELADO,
} as const;

/**
 * TRANSICIONES VALIDAS
 * Define explicitamente que transiciones estan permitidas
 * Cualquier transicion no listada aqui sera RECHAZADA
 */
export const TRANSICIONES_VALIDAS: Record<EstadoSorteo, EstadoSorteo[]> = {
  // Desde BORRADOR: puede pasar a PROGRAMADO o CANCELADO
  [EstadoSorteo.BORRADOR]: [EstadoSorteo.PROGRAMADO, EstadoSorteo.CANCELADO],
  
  // Desde PROGRAMADO: puede pasar a ACTIVO o CANCELADO
  [EstadoSorteo.PROGRAMADO]: [EstadoSorteo.ACTIVO, EstadoSorteo.CANCELADO],
  
  // Desde ACTIVO: puede pasar a CERRADO o CANCELADO
  [EstadoSorteo.ACTIVO]: [EstadoSorteo.CERRADO, EstadoSorteo.CANCELADO],
  
  // Desde CERRADO: puede pasar a SORTEANDO o CANCELADO
  [EstadoSorteo.CERRADO]: [EstadoSorteo.SORTEANDO, EstadoSorteo.CANCELADO],
  
  // Desde SORTEANDO: solo puede pasar a FINALIZADO
  [EstadoSorteo.SORTEANDO]: [EstadoSorteo.FINALIZADO],
  
  // Desde FINALIZADO: estado terminal, no hay transiciones
  [EstadoSorteo.FINALIZADO]: [],
  
  // Desde CANCELADO: estado terminal, no hay transiciones
  [EstadoSorteo.CANCELADO]: [],
};

/**
 * ACCIONES PERMITIDAS POR ESTADO
 * Define que operaciones se pueden realizar en cada estado
 */
export const ACCIONES_POR_ESTADO: Record<EstadoSorteo, string[]> = {
  [EstadoSorteo.BORRADOR]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'ASIGNAR_CAUSA',
    'CAMBIAR_CAUSA',
    'PROGRAMAR',
    'CANCELAR',
  ],
  
  [EstadoSorteo.PROGRAMADO]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'CAMBIAR_CAUSA',
    'ACTIVAR',
    'CANCELAR',
  ],
  
  [EstadoSorteo.ACTIVO]: [
    'VER_PARTICIPACIONES',
    'REGISTRAR_PARTICIPACION',
    'CERRAR',
    'CANCELAR',
  ],
  
  [EstadoSorteo.CERRADO]: [
    'VER_PARTICIPACIONES',
    'INICIAR_SORTEO',
    'CANCELAR',
  ],
  
  [EstadoSorteo.SORTEANDO]: [
    'VER_PARTICIPACIONES',
    'EJECUTAR_SORTEO',
    // NO se puede cancelar durante el sorteo
  ],
  
  [EstadoSorteo.FINALIZADO]: [
    'VER_PARTICIPACIONES',
    'VER_GANADORES',
    'GENERAR_REPORTE',
    // NO se puede modificar nada
  ],
  
  [EstadoSorteo.CANCELADO]: [
    'VER_PARTICIPACIONES',
    'VER_HISTORIAL',
    // NO se puede reactivar
  ],
};

/**
 * ACCIONES PROHIBIDAS POR ESTADO
 * Define explicitamente que NO se puede hacer en cada estado
 */
export const ACCIONES_PROHIBIDAS_POR_ESTADO: Record<EstadoSorteo, string[]> = {
  [EstadoSorteo.BORRADOR]: [
    'REGISTRAR_PARTICIPACION', // No visible publicamente
    'EJECUTAR_SORTEO',
    'VER_GANADORES',
  ],
  
  [EstadoSorteo.PROGRAMADO]: [
    'REGISTRAR_PARTICIPACION', // Aun no activo
    'EJECUTAR_SORTEO',
    'VER_GANADORES',
  ],
  
  [EstadoSorteo.ACTIVO]: [
    'EDITAR_DATOS', // Ya esta en curso
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'EJECUTAR_SORTEO', // Debe cerrarse primero
    'VER_GANADORES',
  ],
  
  [EstadoSorteo.CERRADO]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'REGISTRAR_PARTICIPACION', // Cerrado
    'VER_GANADORES',
  ],
  
  [EstadoSorteo.SORTEANDO]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'REGISTRAR_PARTICIPACION',
    'CANCELAR', // No se puede cancelar durante sorteo
  ],
  
  [EstadoSorteo.FINALIZADO]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'REGISTRAR_PARTICIPACION',
    'EJECUTAR_SORTEO',
    'CANCELAR',
  ],
  
  [EstadoSorteo.CANCELADO]: [
    'EDITAR_DATOS',
    'AGREGAR_PREMIO',
    'ELIMINAR_PREMIO',
    'REGISTRAR_PARTICIPACION',
    'EJECUTAR_SORTEO',
    'ACTIVAR',
    'PROGRAMAR',
  ],
};

/**
 * DESCRIPCION DE ESTADOS
 * Para uso en UI y documentacion
 */
export const DESCRIPCION_ESTADOS: Record<EstadoSorteo, string> = {
  [EstadoSorteo.BORRADOR]: 'Sorteo en proceso de creacion. No visible para participantes.',
  [EstadoSorteo.PROGRAMADO]: 'Sorteo configurado y listo. Esperando fecha de inicio.',
  [EstadoSorteo.ACTIVO]: 'Sorteo abierto. Los usuarios pueden participar.',
  [EstadoSorteo.CERRADO]: 'Participaciones cerradas. Pendiente de realizar el sorteo.',
  [EstadoSorteo.SORTEANDO]: 'Seleccion de ganador en proceso.',
  [EstadoSorteo.FINALIZADO]: 'Sorteo completado. Ganador seleccionado.',
  [EstadoSorteo.CANCELADO]: 'Sorteo cancelado. No se realizara.',
};

/**
 * Verifica si una transicion es valida
 */
export function esTransicionValida(
  estadoActual: EstadoSorteo,
  estadoDestino: EstadoSorteo,
): boolean {
  const transicionesPermitidas = TRANSICIONES_VALIDAS[estadoActual];
  return transicionesPermitidas.includes(estadoDestino);
}

/**
 * Verifica si una accion esta permitida en un estado
 */
export function esAccionPermitida(
  estado: EstadoSorteo,
  accion: string,
): boolean {
  return ACCIONES_POR_ESTADO[estado].includes(accion);
}

/**
 * Verifica si una accion esta prohibida en un estado
 */
export function esAccionProhibida(
  estado: EstadoSorteo,
  accion: string,
): boolean {
  return ACCIONES_PROHIBIDAS_POR_ESTADO[estado].includes(accion);
}

/**
 * Obtiene las transiciones disponibles desde un estado
 */
export function obtenerTransicionesDisponibles(
  estadoActual: EstadoSorteo,
): EstadoSorteo[] {
  return TRANSICIONES_VALIDAS[estadoActual];
}

/**
 * Verifica si un estado es terminal (sin transiciones posibles)
 */
export function esEstadoTerminal(estado: EstadoSorteo): boolean {
  return TRANSICIONES_VALIDAS[estado].length === 0;
}
