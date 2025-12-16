// DOCUMENTO 03 - ACTORES Y ROLES
// DTO para crear rol

import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
