// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.2: Validaciones de participaciones
// Reglas de negocio segun DOCUMENTO 32

import { EstadoSorteo } from '@prisma/client';

/**
 * ESTADO UNICO VALIDO PARA PARTICIPAR
 * Segun DOCUMENTO 32: Solo sorteos ACTIVOS aceptan participaciones
 */
export const ESTADO_VALIDO_PARA_PARTICIPAR = EstadoSorteo.ACTIVO;

/**
 * ESTADOS QUE PERMITEN VER PARTICIPACIONES
 * Todos los estados excepto BORRADOR permiten ver participaciones
 */
export const ESTADOS_VISIBLES_PARTICIPACIONES = [
  EstadoSorteo.ACTIVO,
  EstadoSorteo.CERRADO,
  EstadoSorteo.SORTEANDO,
  EstadoSorteo.FINALIZADO,
  EstadoSorteo.CANCELADO,
] as const;

/**
 * Resultado de validacion de participacion
 */
export interface ValidacionParticipacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  boletoAsignado?: number;
}

/**
 * Valida si un sorteo permite nuevas participaciones
 */
export function validarSorteoParaParticipar(sorteo: {
  id: string;
  estado: EstadoSorteo;
  totalBoletos: number;
  boletosVendidos: number;
  fechaInicio: Date;
  fechaFin: Date;
}): ValidacionParticipacion {
  const errores: string[] = [];
  const advertencias: string[] = [];
  const ahora = new Date();

  // 1. Verificar estado ACTIVO
  if (sorteo.estado !== ESTADO_VALIDO_PARA_PARTICIPAR) {
    errores.push(
      `El sorteo no esta activo. Estado actual: ${sorteo.estado}. ` +
      `Solo se puede participar en sorteos con estado ACTIVO.`
    );
  }

  // 2. Verificar disponibilidad de boletos
  if (sorteo.boletosVendidos >= sorteo.totalBoletos) {
    errores.push(
      `No hay boletos disponibles. ` +
      `Total: ${sorteo.totalBoletos}, Asignados: ${sorteo.boletosVendidos}.`
    );
  }

  // 3. Verificar fechas
  if (ahora < sorteo.fechaInicio) {
    errores.push(
      `El sorteo aun no ha iniciado. ` +
      `Fecha de inicio: ${sorteo.fechaInicio.toISOString()}.`
    );
  }

  if (ahora > sorteo.fechaFin) {
    errores.push(
      `El periodo de participacion ha finalizado. ` +
      `Fecha de cierre: ${sorteo.fechaFin.toISOString()}.`
    );
  }

  // 4. Advertencia si quedan pocos boletos
  const boletosRestantes = sorteo.totalBoletos - sorteo.boletosVendidos;
  const porcentajeRestante = (boletosRestantes / sorteo.totalBoletos) * 100;
  
  if (porcentajeRestante <= 10 && boletosRestantes > 0) {
    advertencias.push(
      `Quedan pocos boletos disponibles: ${boletosRestantes} de ${sorteo.totalBoletos}.`
    );
  }

  // 5. Advertencia si esta cerca del cierre
  const tiempoRestanteMs = sorteo.fechaFin.getTime() - ahora.getTime();
  const unaHoraMs = 60 * 60 * 1000;
  
  if (tiempoRestanteMs > 0 && tiempoRestanteMs <= unaHoraMs) {
    const minutosRestantes = Math.floor(tiempoRestanteMs / (60 * 1000));
    advertencias.push(
      `El sorteo cierra en ${minutosRestantes} minutos.`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Valida si un usuario puede participar en un sorteo especifico
 */
export function validarUsuarioParaParticipar(
  userId: string,
  participacionesExistentes: Array<{ userId: string; numeroBoleto: number }>,
  maxBoletosPermitidos: number = 1, // Por defecto 1 boleto por usuario
): ValidacionParticipacion {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Contar participaciones del usuario
  const participacionesUsuario = participacionesExistentes.filter(
    (p) => p.userId === userId
  );

  if (participacionesUsuario.length >= maxBoletosPermitidos) {
    errores.push(
      `Ya tienes el maximo de participaciones permitidas (${maxBoletosPermitidos}). ` +
      `Participaciones actuales: ${participacionesUsuario.length}.`
    );
  }

  // Advertencia si ya tiene participaciones
  if (participacionesUsuario.length > 0 && participacionesUsuario.length < maxBoletosPermitidos) {
    advertencias.push(
      `Ya tienes ${participacionesUsuario.length} participacion(es). ` +
      `Puedes tener hasta ${maxBoletosPermitidos}.`
    );
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

/**
 * Genera el siguiente numero de boleto disponible
 * Busca el primer numero no usado entre 1 y totalBoletos
 */
export function generarNumeroBoleto(
  boletosAsignados: number[],
  totalBoletos: number,
): number | null {
  // Crear set para busqueda O(1)
  const asignadosSet = new Set(boletosAsignados);
  
  // Buscar primer numero disponible
  for (let i = 1; i <= totalBoletos; i++) {
    if (!asignadosSet.has(i)) {
      return i;
    }
  }
  
  // No hay boletos disponibles
  return null;
}

/**
 * Genera un numero de boleto aleatorio disponible
 */
export function generarNumeroBoletoAleatorio(
  boletosAsignados: number[],
  totalBoletos: number,
): number | null {
  const asignadosSet = new Set(boletosAsignados);
  const disponibles: number[] = [];
  
  // Recolectar todos los disponibles
  for (let i = 1; i <= totalBoletos; i++) {
    if (!asignadosSet.has(i)) {
      disponibles.push(i);
    }
  }
  
  if (disponibles.length === 0) {
    return null;
  }
  
  // Seleccionar uno aleatorio
  const indiceAleatorio = Math.floor(Math.random() * disponibles.length);
  return disponibles[indiceAleatorio];
}

/**
 * Estadisticas de participacion de un sorteo
 */
export interface EstadisticasParticipacion {
  totalBoletos: number;
  boletosAsignados: number;
  boletosDisponibles: number;
  porcentajeOcupacion: number;
  participantesUnicos: number;
}

/**
 * Calcula estadisticas de participacion
 */
export function calcularEstadisticas(
  totalBoletos: number,
  participaciones: Array<{ userId: string; numeroBoleto: number }>,
): EstadisticasParticipacion {
  const boletosAsignados = participaciones.length;
  const boletosDisponibles = totalBoletos - boletosAsignados;
  const porcentajeOcupacion = (boletosAsignados / totalBoletos) * 100;
  
  // Contar participantes unicos
  const usuariosUnicos = new Set(participaciones.map((p) => p.userId));
  
  return {
    totalBoletos,
    boletosAsignados,
    boletosDisponibles,
    porcentajeOcupacion: Math.round(porcentajeOcupacion * 100) / 100,
    participantesUnicos: usuariosUnicos.size,
  };
}
