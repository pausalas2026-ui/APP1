// DOCUMENTO 06 - MODULOS CLAVE
// DTO para crear causa

import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateCausaDto {
  @IsString()
  nombre: string;

  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  imagenUrl?: string;

  @IsOptional()
  @IsUrl()
  sitioWeb?: string;
}
