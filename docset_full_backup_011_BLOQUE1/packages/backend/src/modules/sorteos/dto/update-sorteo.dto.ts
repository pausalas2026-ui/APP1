// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// DTO para actualizar sorteo

import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export class UpdateSorteoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsDateString()
  fechaSorteo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalBoletos?: number;

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
