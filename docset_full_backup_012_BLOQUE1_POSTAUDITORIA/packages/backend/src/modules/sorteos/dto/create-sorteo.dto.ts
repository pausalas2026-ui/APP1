// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// DTO para crear sorteo

import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  Max,
  IsEnum,
} from 'class-validator';

export enum TipoSorteoDto {
  ESTANDAR = 'ESTANDAR',
  EXPRESS = 'EXPRESS',
  BENEFICO = 'BENEFICO',
}

export class CreateSorteoDto {
  @IsString()
  titulo: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsEnum(TipoSorteoDto)
  tipo?: TipoSorteoDto;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @IsDateString()
  fechaSorteo?: string;

  @IsInt()
  @Min(1)
  totalBoletos: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minimoParticipantes?: number;

  @IsOptional()
  @IsUUID()
  causaId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  porcentajeCausa?: number;
}
