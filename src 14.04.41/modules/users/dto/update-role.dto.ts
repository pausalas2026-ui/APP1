// DOCUMENTO 03 - ACTORES Y ROLES
// DTO para actualizar rol

import { IsString, MinLength, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
