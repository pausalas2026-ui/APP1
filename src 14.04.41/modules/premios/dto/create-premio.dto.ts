// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// DTO para crear premio

import {
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';

export enum TipoPremioDto {
  PRINCIPAL = 'PRINCIPAL',
  SECUNDARIO = 'SECUNDARIO',
  CONSOLACION = 'CONSOLACION',
}

export class CreatePremioDto {
  @IsUUID()
  sorteoId: string;

  @IsOptional()
  @IsEnum(TipoPremioDto)
  tipo?: TipoPremioDto;

  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  posicion?: number;
}
