// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: Estados y Transiciones
// Servicio de maquina de estados

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoSorteo } from '@prisma/client';
import {
  TRANSICIONES_VALIDAS,
  ACCIONES_POR_ESTADO,
  ACCIONES_PROHIBIDAS_POR_ESTADO,
  DESCRIPCION_ESTADOS,
  esTransicionValida,
  esAccionPermitida,
  esAccionProhibida,
  obtenerTransicionesDisponibles,
  esEstadoTerminal,
} from './sorteo-states.constants';

export interface TransicionResult {
  success: boolean;
  sorteoId: string;
  estadoAnterior: EstadoSorteo;
  estadoNuevo: EstadoSorteo;
  timestamp: Date;
}

export interface ValidacionResult {
  valido: boolean;
  razon?: string;
  accionesPermitidas?: string[];
  accionesProhibidas?: string[];
  transicionesDisponibles?: EstadoSorteo[];
}

@Injectable()
export class SorteoStatesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el estado actual de un sorteo
   */
  async obtenerEstado(sorteoId: string): Promise<{
    sorteoId: string;
    estado: EstadoSorteo;
    descripcion: string;
    esTerminal: boolean;
    transicionesDisponibles: EstadoSorteo[];
    accionesPermitidas: string[];
  }> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: { id: true, estado: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    return {
      sorteoId: sorteo.id,
      estado: sorteo.estado,
      descripcion: DESCRIPCION_ESTADOS[sorteo.estado],
      esTerminal: esEstadoTerminal(sorteo.estado),
      transicionesDisponibles: obtenerTransicionesDisponibles(sorteo.estado),
      accionesPermitidas: ACCIONES_POR_ESTADO[sorteo.estado],
    };
  }

  /**
   * Valida si una transicion es posible
   */
  async validarTransicion(
    sorteoId: string,
    estadoDestino: EstadoSorteo,
  ): Promise<ValidacionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: { id: true, estado: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    const esValida = esTransicionValida(sorteo.estado, estadoDestino);

    if (!esValida) {
      return {
        valido: false,
        razon: `Transicion no permitida: ${sorteo.estado} -> ${estadoDestino}. Transiciones validas desde ${sorteo.estado}: ${obtenerTransicionesDisponibles(sorteo.estado).join(', ') || 'ninguna (estado terminal)'}`,
        transicionesDisponibles: obtenerTransicionesDisponibles(sorteo.estado),
      };
    }

    return {
      valido: true,
      transicionesDisponibles: obtenerTransicionesDisponibles(sorteo.estado),
    };
  }

  /**
   * Ejecuta una transicion de estado
   * RECHAZA transiciones invalidas
   */
  async transicionar(
    sorteoId: string,
    estadoDestino: EstadoSorteo,
  ): Promise<TransicionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: { id: true, estado: true, codigo: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    const estadoActual = sorteo.estado;

    // Validar transicion
    if (!esTransicionValida(estadoActual, estadoDestino)) {
      throw new BadRequestException(
        `Transicion rechazada: ${estadoActual} -> ${estadoDestino}. ` +
        `Transiciones validas desde ${estadoActual}: ${obtenerTransicionesDisponibles(estadoActual).join(', ') || 'ninguna (estado terminal)'}`,
      );
    }

    // Ejecutar transicion
    const sorteoActualizado = await this.prisma.sorteo.update({
      where: { id: sorteoId },
      data: { estado: estadoDestino },
    });

    return {
      success: true,
      sorteoId: sorteo.id,
      estadoAnterior: estadoActual,
      estadoNuevo: sorteoActualizado.estado,
      timestamp: new Date(),
    };
  }

  /**
   * Valida si una accion esta permitida en el estado actual
   */
  async validarAccion(
    sorteoId: string,
    accion: string,
  ): Promise<ValidacionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      select: { id: true, estado: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Primero verificar si esta explicitamente prohibida
    if (esAccionProhibida(sorteo.estado, accion)) {
      return {
        valido: false,
        razon: `Accion '${accion}' esta PROHIBIDA en estado ${sorteo.estado}`,
        accionesPermitidas: ACCIONES_POR_ESTADO[sorteo.estado],
        accionesProhibidas: ACCIONES_PROHIBIDAS_POR_ESTADO[sorteo.estado],
      };
    }

    // Luego verificar si esta permitida
    if (!esAccionPermitida(sorteo.estado, accion)) {
      return {
        valido: false,
        razon: `Accion '${accion}' no esta permitida en estado ${sorteo.estado}`,
        accionesPermitidas: ACCIONES_POR_ESTADO[sorteo.estado],
        accionesProhibidas: ACCIONES_PROHIBIDAS_POR_ESTADO[sorteo.estado],
      };
    }

    return {
      valido: true,
      accionesPermitidas: ACCIONES_POR_ESTADO[sorteo.estado],
    };
  }

  /**
   * Programar un sorteo (BORRADOR -> PROGRAMADO)
   * Valida requisitos previos
   */
  async programar(sorteoId: string): Promise<TransicionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: { premios: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Validaciones de negocio antes de programar
    if (!sorteo.titulo || sorteo.titulo.trim() === '') {
      throw new BadRequestException('El sorteo debe tener un titulo');
    }

    if (!sorteo.fechaInicio || !sorteo.fechaFin) {
      throw new BadRequestException('El sorteo debe tener fechas de inicio y fin');
    }

    if (sorteo.fechaInicio >= sorteo.fechaFin) {
      throw new BadRequestException('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    if (sorteo.premios.length === 0) {
      throw new BadRequestException('El sorteo debe tener al menos un premio');
    }

    // Ejecutar transicion
    return this.transicionar(sorteoId, EstadoSorteo.PROGRAMADO);
  }

  /**
   * Activar un sorteo (PROGRAMADO -> ACTIVO)
   */
  async activar(sorteoId: string): Promise<TransicionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Validar que la fecha de inicio haya llegado o pasado
    const ahora = new Date();
    if (sorteo.fechaInicio > ahora) {
      throw new BadRequestException(
        `El sorteo no puede activarse hasta ${sorteo.fechaInicio.toISOString()}`,
      );
    }

    return this.transicionar(sorteoId, EstadoSorteo.ACTIVO);
  }

  /**
   * Cerrar un sorteo (ACTIVO -> CERRADO)
   */
  async cerrar(sorteoId: string): Promise<TransicionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
      include: {
        _count: { select: { participaciones: true } },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Validar minimo de participantes
    if (sorteo._count.participaciones < sorteo.minimoParticipantes) {
      throw new BadRequestException(
        `El sorteo requiere minimo ${sorteo.minimoParticipantes} participantes. ` +
        `Actualmente tiene ${sorteo._count.participaciones}`,
      );
    }

    return this.transicionar(sorteoId, EstadoSorteo.CERRADO);
  }

  /**
   * Iniciar proceso de sorteo (CERRADO -> SORTEANDO)
   */
  async iniciarSorteo(sorteoId: string): Promise<TransicionResult> {
    return this.transicionar(sorteoId, EstadoSorteo.SORTEANDO);
  }

  /**
   * Finalizar sorteo (SORTEANDO -> FINALIZADO)
   * Solo debe llamarse despues de seleccionar ganador
   */
  async finalizar(sorteoId: string): Promise<TransicionResult> {
    return this.transicionar(sorteoId, EstadoSorteo.FINALIZADO);
  }

  /**
   * Cancelar un sorteo
   * Disponible desde: BORRADOR, PROGRAMADO, ACTIVO, CERRADO
   * NO disponible desde: SORTEANDO, FINALIZADO, CANCELADO
   */
  async cancelar(sorteoId: string, motivo?: string): Promise<TransicionResult> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id: sorteoId },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Verificar que se puede cancelar
    if (!obtenerTransicionesDisponibles(sorteo.estado).includes(EstadoSorteo.CANCELADO)) {
      throw new BadRequestException(
        `No se puede cancelar un sorteo en estado ${sorteo.estado}`,
      );
    }

    return this.transicionar(sorteoId, EstadoSorteo.CANCELADO);
  }

  /**
   * Obtiene todos los estados disponibles con su informacion
   */
  obtenerTodosLosEstados(): Array<{
    estado: EstadoSorteo;
    descripcion: string;
    esTerminal: boolean;
    transicionesPermitidas: EstadoSorteo[];
    accionesPermitidas: string[];
    accionesProhibidas: string[];
  }> {
    return Object.values(EstadoSorteo).map((estado) => ({
      estado,
      descripcion: DESCRIPCION_ESTADOS[estado],
      esTerminal: esEstadoTerminal(estado),
      transicionesPermitidas: TRANSICIONES_VALIDAS[estado],
      accionesPermitidas: ACCIONES_POR_ESTADO[estado],
      accionesProhibidas: ACCIONES_PROHIBIDAS_POR_ESTADO[estado],
    }));
  }
}
