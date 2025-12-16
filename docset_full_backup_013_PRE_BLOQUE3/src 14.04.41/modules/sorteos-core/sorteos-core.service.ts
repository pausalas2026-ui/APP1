// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: Servicio Core de Sorteos
// Creacion, edicion, listado con validaciones avanzadas

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { EstadoSorteo, TipoSorteo } from '@prisma/client';
import {
  validarFechasSorteo,
  validarConfiguracionBoletos,
  validarPorcentajeCausa,
  validarPrincipiosSorteo,
  obtenerCamposNoPermitidos,
  ESTADOS_EDITABLES,
  CAMPOS_EDITABLES_POR_ESTADO,
} from './sorteos-core.validations';
import { CrearSorteoDto } from './dto/crear-sorteo.dto';
import { ActualizarSorteoDto } from './dto/actualizar-sorteo.dto';

export interface ResultadoValidacion {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

export interface SorteoConValidacion {
  sorteo: any;
  validacion: ResultadoValidacion;
}

@Injectable()
export class SorteosCoreService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear sorteo con validaciones DOCUMENTO 32
   * Inicia en estado BORRADOR
   */
  async crear(dto: CrearSorteoDto): Promise<SorteoConValidacion> {
    const errores: string[] = [];
    const advertencias: string[] = [];

    // 1. Validar fechas
    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);
    const fechaSorteo = dto.fechaSorteo ? new Date(dto.fechaSorteo) : null;

    // Fecha inicio debe ser futura para creacion
    const ahora = new Date();
    if (fechaInicio <= ahora) {
      errores.push('La fecha de inicio debe ser futura');
    }

    const validacionFechas = validarFechasSorteo(fechaInicio, fechaFin, fechaSorteo);
    errores.push(...validacionFechas.errores);

    // 2. Validar boletos
    const validacionBoletos = validarConfiguracionBoletos(
      dto.totalBoletos,
      dto.minimoParticipantes || 1,
    );
    errores.push(...validacionBoletos.errores);

    // 3. Validar porcentaje causa
    const tipo = dto.tipo || TipoSorteo.ESTANDAR;
    const porcentaje = dto.porcentajeCausa || 10;
    const validacionPorcentaje = validarPorcentajeCausa(porcentaje, tipo as TipoSorteo);
    errores.push(...validacionPorcentaje.errores);

    // 4. Validar principios basicos
    const validacionPrincipios = validarPrincipiosSorteo({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      causaId: dto.causaId,
    });
    advertencias.push(...validacionPrincipios.advertencias);

    // 5. Si hay causa, verificar que existe
    if (dto.causaId) {
      const causa = await this.prisma.causa.findUnique({
        where: { id: dto.causaId },
      });
      if (!causa) {
        errores.push('La causa especificada no existe');
      } else if (causa.estado !== 'ACTIVA') {
        errores.push('La causa debe estar en estado ACTIVA');
      }
    }

    // Si hay errores, rechazar
    if (errores.length > 0) {
      throw new BadRequestException({
        message: 'Validacion fallida',
        errores,
        advertencias,
      });
    }

    // Generar codigo unico
    const codigo = await this.generarCodigo();

    // Crear sorteo en estado BORRADOR
    const sorteo = await this.prisma.sorteo.create({
      data: {
        codigo,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        imagenUrl: dto.imagenUrl,
        tipo: tipo as TipoSorteo,
        estado: EstadoSorteo.BORRADOR,
        fechaInicio,
        fechaFin,
        fechaSorteo,
        totalBoletos: dto.totalBoletos,
        minimoParticipantes: dto.minimoParticipantes || 1,
        causaId: dto.causaId,
        porcentajeCausa: porcentaje,
      },
      include: {
        causa: true,
        premios: true,
      },
    });

    return {
      sorteo,
      validacion: {
        valido: true,
        errores: [],
        advertencias,
      },
    };
  }

  /**
   * Actualizar sorteo con validaciones por estado
   * Solo permite edicion en estados BORRADOR y PROGRAMADO
   */
  async actualizar(id: string, dto: ActualizarSorteoDto): Promise<SorteoConValidacion> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id },
      include: { causa: true, premios: true },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Verificar que el estado permite edicion
    if (!ESTADOS_EDITABLES.includes(sorteo.estado as any)) {
      throw new ForbiddenException(
        `No se puede editar un sorteo en estado ${sorteo.estado}. Estados editables: ${ESTADOS_EDITABLES.join(', ')}`,
      );
    }

    // Obtener campos que se intentan actualizar
    const camposAActualizar = Object.keys(dto).filter(
      (key) => dto[key as keyof ActualizarSorteoDto] !== undefined,
    );

    // Verificar que todos los campos son editables en el estado actual
    const camposNoPermitidos = obtenerCamposNoPermitidos(sorteo.estado, camposAActualizar);
    if (camposNoPermitidos.length > 0) {
      throw new ForbiddenException(
        `Los siguientes campos no se pueden editar en estado ${sorteo.estado}: ${camposNoPermitidos.join(', ')}`,
      );
    }

    const errores: string[] = [];
    const advertencias: string[] = [];

    // Preparar datos de actualizacion
    const dataActualizacion: any = {};

    // Procesar fechas si se proporcionan
    const fechaInicio = dto.fechaInicio ? new Date(dto.fechaInicio) : sorteo.fechaInicio;
    const fechaFin = dto.fechaFin ? new Date(dto.fechaFin) : sorteo.fechaFin;
    const fechaSorteo = dto.fechaSorteo !== undefined
      ? (dto.fechaSorteo ? new Date(dto.fechaSorteo) : null)
      : sorteo.fechaSorteo;

    // Validar fechas si alguna cambio
    if (dto.fechaInicio || dto.fechaFin || dto.fechaSorteo) {
      const validacionFechas = validarFechasSorteo(fechaInicio, fechaFin, fechaSorteo);
      errores.push(...validacionFechas.errores);
    }

    if (dto.fechaInicio) dataActualizacion.fechaInicio = fechaInicio;
    if (dto.fechaFin) dataActualizacion.fechaFin = fechaFin;
    if (dto.fechaSorteo !== undefined) dataActualizacion.fechaSorteo = fechaSorteo;

    // Validar boletos si cambian
    if (dto.totalBoletos !== undefined || dto.minimoParticipantes !== undefined) {
      const totalBoletos = dto.totalBoletos ?? sorteo.totalBoletos;
      const minimoParticipantes = dto.minimoParticipantes ?? sorteo.minimoParticipantes;
      const validacionBoletos = validarConfiguracionBoletos(totalBoletos, minimoParticipantes);
      errores.push(...validacionBoletos.errores);
    }

    if (dto.totalBoletos !== undefined) dataActualizacion.totalBoletos = dto.totalBoletos;
    if (dto.minimoParticipantes !== undefined) dataActualizacion.minimoParticipantes = dto.minimoParticipantes;

    // Validar porcentaje si cambia
    if (dto.porcentajeCausa !== undefined) {
      const tipo = (dto.tipo ?? sorteo.tipo) as TipoSorteo;
      const validacionPorcentaje = validarPorcentajeCausa(dto.porcentajeCausa, tipo);
      errores.push(...validacionPorcentaje.errores);
      dataActualizacion.porcentajeCausa = dto.porcentajeCausa;
    }

    // Validar causa si cambia
    if (dto.causaId !== undefined) {
      if (dto.causaId) {
        const causa = await this.prisma.causa.findUnique({
          where: { id: dto.causaId },
        });
        if (!causa) {
          errores.push('La causa especificada no existe');
        } else if (causa.estado !== 'ACTIVA') {
          errores.push('La causa debe estar en estado ACTIVA');
        }
      }
      dataActualizacion.causaId = dto.causaId;
    }

    // Campos simples
    if (dto.titulo !== undefined) dataActualizacion.titulo = dto.titulo;
    if (dto.descripcion !== undefined) dataActualizacion.descripcion = dto.descripcion;
    if (dto.imagenUrl !== undefined) dataActualizacion.imagenUrl = dto.imagenUrl;
    if (dto.tipo !== undefined) dataActualizacion.tipo = dto.tipo;

    // Validar principios si cambia titulo o descripcion
    if (dto.titulo || dto.descripcion) {
      const validacionPrincipios = validarPrincipiosSorteo({
        titulo: dto.titulo ?? sorteo.titulo,
        descripcion: dto.descripcion ?? sorteo.descripcion,
        causaId: dto.causaId ?? sorteo.causaId,
      });
      advertencias.push(...validacionPrincipios.advertencias);
    }

    // Si hay errores, rechazar
    if (errores.length > 0) {
      throw new BadRequestException({
        message: 'Validacion fallida',
        errores,
        advertencias,
      });
    }

    // Ejecutar actualizacion
    const sorteoActualizado = await this.prisma.sorteo.update({
      where: { id },
      data: dataActualizacion,
      include: {
        causa: true,
        premios: true,
      },
    });

    return {
      sorteo: sorteoActualizado,
      validacion: {
        valido: true,
        errores: [],
        advertencias,
      },
    };
  }

  /**
   * Obtener sorteo por ID con informacion de editabilidad
   */
  async obtenerPorId(id: string) {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id },
      include: {
        causa: true,
        premios: {
          orderBy: { posicion: 'asc' },
        },
        _count: {
          select: { participaciones: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    // Agregar informacion de editabilidad
    const esEditable = ESTADOS_EDITABLES.includes(sorteo.estado as any);
    const camposEditables = CAMPOS_EDITABLES_POR_ESTADO[sorteo.estado];

    return {
      ...sorteo,
      _meta: {
        esEditable,
        camposEditables,
        estado: sorteo.estado,
      },
    };
  }

  /**
   * Obtener sorteo por codigo
   */
  async obtenerPorCodigo(codigo: string) {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { codigo },
      include: {
        causa: true,
        premios: {
          orderBy: { posicion: 'asc' },
        },
        _count: {
          select: { participaciones: true },
        },
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    const esEditable = ESTADOS_EDITABLES.includes(sorteo.estado as any);
    const camposEditables = CAMPOS_EDITABLES_POR_ESTADO[sorteo.estado];

    return {
      ...sorteo,
      _meta: {
        esEditable,
        camposEditables,
        estado: sorteo.estado,
      },
    };
  }

  /**
   * Listar sorteos con filtros
   */
  async listar(params: {
    page?: number;
    limit?: number;
    estado?: EstadoSorteo;
    tipo?: TipoSorteo;
    causaId?: string;
    soloEditables?: boolean;
  }) {
    const { page = 1, limit = 10, estado, tipo, causaId, soloEditables } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (estado) {
      where.estado = estado;
    } else if (soloEditables) {
      where.estado = { in: ESTADOS_EDITABLES };
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (causaId) {
      where.causaId = causaId;
    }

    const [sorteos, total] = await Promise.all([
      this.prisma.sorteo.findMany({
        where,
        skip,
        take: limit,
        include: {
          causa: {
            select: { id: true, nombre: true },
          },
          _count: {
            select: { premios: true, participaciones: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sorteo.count({ where }),
    ]);

    // Agregar meta de editabilidad a cada sorteo
    const sorteosConMeta = sorteos.map((sorteo) => ({
      ...sorteo,
      _meta: {
        esEditable: ESTADOS_EDITABLES.includes(sorteo.estado as any),
      },
    }));

    return {
      data: sorteosConMeta,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Listar solo sorteos en BORRADOR (para completar)
   */
  async listarBorradores() {
    return this.listar({ estado: EstadoSorteo.BORRADOR });
  }

  /**
   * Listar solo sorteos PROGRAMADOS
   */
  async listarProgramados() {
    return this.listar({ estado: EstadoSorteo.PROGRAMADO });
  }

  /**
   * Validar sorteo antes de programar
   * Verifica que tenga todo lo necesario
   */
  async validarParaProgramar(id: string): Promise<ResultadoValidacion> {
    const sorteo = await this.prisma.sorteo.findUnique({
      where: { id },
      include: {
        causa: true,
        premios: true,
      },
    });

    if (!sorteo) {
      throw new NotFoundException('Sorteo no encontrado');
    }

    const errores: string[] = [];
    const advertencias: string[] = [];

    // 1. Debe estar en BORRADOR
    if (sorteo.estado !== EstadoSorteo.BORRADOR) {
      errores.push(`El sorteo debe estar en BORRADOR para programarse. Estado actual: ${sorteo.estado}`);
    }

    // 2. Debe tener titulo
    if (!sorteo.titulo || sorteo.titulo.trim() === '') {
      errores.push('El sorteo debe tener un titulo');
    }

    // 3. Debe tener descripcion
    if (!sorteo.descripcion || sorteo.descripcion.trim() === '') {
      errores.push('El sorteo debe tener una descripcion');
    }

    // 4. Debe tener al menos un premio
    if (sorteo.premios.length === 0) {
      errores.push('El sorteo debe tener al menos un premio asignado');
    }

    // 5. Fechas validas
    const validacionFechas = validarFechasSorteo(
      sorteo.fechaInicio,
      sorteo.fechaFin,
      sorteo.fechaSorteo,
    );
    errores.push(...validacionFechas.errores);

    // 6. Fecha inicio debe ser futura
    const ahora = new Date();
    if (sorteo.fechaInicio <= ahora) {
      errores.push('La fecha de inicio debe ser futura para programar el sorteo');
    }

    // 7. Advertencia si no tiene causa
    if (!sorteo.causaId) {
      advertencias.push('El sorteo no tiene causa asignada. Se asignara una causa por defecto al activarse.');
    }

    return {
      valido: errores.length === 0,
      errores,
      advertencias,
    };
  }

  /**
   * Genera un codigo unico para el sorteo
   */
  private async generarCodigo(): Promise<string> {
    const fecha = new Date();
    const year = fecha.getFullYear().toString().slice(-2);
    const month = (fecha.getMonth() + 1).toString().padStart(2, '0');
    
    let codigo: string;
    let existe = true;
    
    while (existe) {
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      codigo = `SRT-${year}${month}-${random}`;
      
      const existente = await this.prisma.sorteo.findUnique({
        where: { codigo },
      });
      existe = !!existente;
    }
    
    return codigo!;
  }
}
