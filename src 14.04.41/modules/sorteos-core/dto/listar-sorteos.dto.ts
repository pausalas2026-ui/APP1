// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: DTO para listar sorteos con filtros

import {
  IsOptional,
  IsInt,
  IsUUID,
  IsEnum,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum EstadoSorteoFilterDto {
  BORRADOR = 'BORRADOR',
  PROGRAMADO = 'PROGRAMADO',
  ACTIVO = 'ACTIVO',
  CERRADO = 'CERRADO',
  SORTEANDO = 'SORTEANDO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum TipoSorteoFilterDto {
  ESTANDAR = 'ESTANDAR',
  EXPRESS = 'EXPRESS',
  BENEFICO = 'BENEFICO',
}

export class ListarSorteosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La pagina debe ser un numero entero' })
  @Min(1, { message: 'La pagina minima es 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El limite debe ser un numero entero' })
  @Min(1, { message: 'El limite minimo es 1' })
  @Max(100, { message: 'El limite maximo es 100' })
  limit?: number = 10;

  @IsOptional()
  @IsEnum(EstadoSorteoFilterDto, {
    message: 'Estado invalido. Valores validos: BORRADOR, PROGRAMADO, ACTIVO, CERRADO, SORTEANDO, FINALIZADO, CANCELADO',
  })
  estado?: EstadoSorteoFilterDto;

  @IsOptional()
  @IsEnum(TipoSorteoFilterDto, {
    message: 'Tipo invalido. Valores validos: ESTANDAR, EXPRESS, BENEFICO',
  })
  tipo?: TipoSorteoFilterDto;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de causa debe ser un UUID valido' })
  causaId?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'soloEditables debe ser un booleano' })
  soloEditables?: boolean;
}
