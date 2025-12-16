// DOCUMENTO 06 - MODULOS CLAVE
// DTO para actualizar causa

import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UpdateCausaDto {
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
  @IsUrl()
  sitioWeb?: string;
}
