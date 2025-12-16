// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// DTO para actualizar premio

import {
  IsString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';

export class UpdatePremioDto {
  @IsOptional()
  @IsString()
  nombre?: string;

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
