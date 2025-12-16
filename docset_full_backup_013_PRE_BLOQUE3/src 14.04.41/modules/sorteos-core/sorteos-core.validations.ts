// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: Validaciones de sorteos
// Reglas de negocio segun secciones 2, 9, 10, 11

import { TipoSorteo, EstadoSorteo } from '@prisma/client';

/**
 * TIPOS DE SORTEO VALIDOS (DOCUMENTO 32 seccion 2)
 * - ESTANDAR: Sorteo normal con participaciones
 * - EXPRESS: Sorteo rapido, menor duracion
 * - BENEFICO: Sorteo con mayor porcentaje a causa
 */
export const TIPOS_SORTEO_VALIDOS = [
  TipoSorteo.ESTANDAR,
  TipoSorteo.EXPRESS,
  TipoSorteo.BENEFICO,
] as const;

/**
 * ESTADOS EN LOS QUE SE PUEDE EDITAR
 * Segun DOCUMENTO 32: solo BORRADOR y PROGRAMADO
 */
export const ESTADOS_EDITABLES = [
  EstadoSorteo.BORRADOR,
  EstadoSorteo.PROGRAMADO,
] as const;

/**
 * CAMPOS EDITABLES POR ESTADO
 * BORRADOR: todo editable
 * PROGRAMADO: solo algunos campos
 */
export const CAMPOS_EDITABLES_POR_ESTADO: Record<EstadoSorteo, string[]> = {
  [EstadoSorteo.BORRADOR]: [
    'titulo',
    'descripcion',
    'imagenUrl',
    'tipo',
    'fechaInicio',
    'fechaFin',
    'fechaSorteo',
    'totalBoletos',
    'minimoParticipantes',
    'causaId',
    'porcentajeCausa',
  ],
  [EstadoSorteo.PROGRAMADO]: [
    'descripcion',
    'imagenUrl',
    'fechaSorteo',
    // NO se puede cambiar: titulo, fechas principales, boletos, causa
  ],
  // El resto de estados no permite edicion
  [EstadoSorteo.ACTIVO]: [],
  [EstadoSorteo.CERRADO]: [],
  [EstadoSorteo.SORTEANDO]: [],
  [EstadoSorteo.FINALIZADO]: [],
  [EstadoSorteo.CANCELADO]: [],
};

/**
 * VALIDACIONES DE FECHAS
 */
export interface ValidacionFechas {
  valido: boolean;
  errores: string[];
}

export function validarFechasSorteo(
  fechaInicio: Date,
  fechaFin: Date,
  fechaSorteo?: Date | null,
): ValidacionFechas {
  const errores: string[] = [];
  const ahora = new Date();

  // Fecha inicio debe ser futura (solo para creacion, no edicion)
  // Esta validacion se aplica externamente

  // Fecha fin debe ser posterior a fecha inicio
  if (fechaFin <= fechaInicio) {
    errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
  }

  // Fecha sorteo debe ser posterior o igual a fecha fin
  if (fechaSorteo && fechaSorteo < fechaFin) {
    errores.push('La fecha de sorteo debe ser posterior o igual a la fecha de cierre');
  }

  // Duracion minima: 1 hora
  const duracionMs = fechaFin.getTime() - fechaInicio.getTime();
  const unaHoraMs = 60 * 60 * 1000;
  if (duracionMs < unaHoraMs) {
    errores.push('La duracion minima del sorteo es de 1 hora');
  }

  // Duracion maxima: 90 dias
  const noventaDiasMs = 90 * 24 * 60 * 60 * 1000;
  if (duracionMs > noventaDiasMs) {
    errores.push('La duracion maxima del sorteo es de 90 dias');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * VALIDACIONES DE BOLETOS
 */
export interface ValidacionBoletos {
  valido: boolean;
  errores: string[];
}

export function validarConfiguracionBoletos(
  totalBoletos: number,
  minimoParticipantes: number,
): ValidacionBoletos {
  const errores: string[] = [];

  // Minimo 10 boletos
  if (totalBoletos < 10) {
    errores.push('El sorteo debe tener minimo 10 boletos');
  }

  // Maximo 100,000 boletos
  if (totalBoletos > 100000) {
    errores.push('El sorteo no puede tener mas de 100,000 boletos');
  }

  // Minimo participantes debe ser positivo
  if (minimoParticipantes < 1) {
    errores.push('El minimo de participantes debe ser al menos 1');
  }

  // Minimo participantes no puede exceder total boletos
  if (minimoParticipantes > totalBoletos) {
    errores.push('El minimo de participantes no puede exceder el total de boletos');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * VALIDACIONES DE PORCENTAJE CAUSA
 */
export interface ValidacionPorcentaje {
  valido: boolean;
  errores: string[];
}

export function validarPorcentajeCausa(
  porcentaje: number,
  tipo: TipoSorteo,
): ValidacionPorcentaje {
  const errores: string[] = [];

  // Rango valido: 1% a 100%
  if (porcentaje < 1 || porcentaje > 100) {
    errores.push('El porcentaje para la causa debe estar entre 1% y 100%');
  }

  // Sorteo BENEFICO requiere minimo 50%
  if (tipo === TipoSorteo.BENEFICO && porcentaje < 50) {
    errores.push('Los sorteos BENEFICOS requieren minimo 50% para la causa');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}

/**
 * Verifica si un campo es editable en el estado actual
 */
export function esCampoEditable(
  estado: EstadoSorteo,
  campo: string,
): boolean {
  return CAMPOS_EDITABLES_POR_ESTADO[estado].includes(campo);
}

/**
 * Obtiene los campos no permitidos de una actualizacion
 */
export function obtenerCamposNoPermitidos(
  estado: EstadoSorteo,
  camposAActualizar: string[],
): string[] {
  const permitidos = CAMPOS_EDITABLES_POR_ESTADO[estado];
  return camposAActualizar.filter((campo) => !permitidos.includes(campo));
}

/**
 * REGLA DOCUMENTO 32 seccion 9: NO IMPLEMENTAR
 * Lista de conceptos que NO deben estar en sorteos
 */
export const CONCEPTOS_PROHIBIDOS = [
  'checkout',
  'carrito',
  'venta',
  'facturacion',
  'stock',
  'envio',
  'compra',
  'precio', // Se usa estimated_value, no precio
] as const;

/**
 * REGLA DOCUMENTO 32 seccion 10: Regla de oro
 * Validacion que un sorteo cumple con los principios basicos
 */
export interface ValidacionPrincipios {
  valido: boolean;
  advertencias: string[];
}

export function validarPrincipiosSorteo(sorteo: {
  titulo: string;
  descripcion: string;
  causaId?: string | null;
}): ValidacionPrincipios {
  const advertencias: string[] = [];

  // Advertencia si no tiene causa (se asignara por defecto)
  if (!sorteo.causaId) {
    advertencias.push('El sorteo no tiene causa asignada. Se asignara una causa por defecto.');
  }

  // Verificar que titulo no sugiera venta
  const tituloLower = sorteo.titulo.toLowerCase();
  for (const prohibido of CONCEPTOS_PROHIBIDOS) {
    if (tituloLower.includes(prohibido)) {
      advertencias.push(`El titulo contiene "${prohibido}" que puede sugerir venta. Los sorteos NO son ventas.`);
    }
  }

  return {
    valido: true, // Las advertencias no bloquean, solo informan
    advertencias,
  };
}
