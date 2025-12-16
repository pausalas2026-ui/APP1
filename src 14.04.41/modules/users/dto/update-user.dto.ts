// DOCUMENTO 03 - ACTORES Y ROLES
// DTO para actualizar usuario

import { IsString, IsOptional, IsUUID, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
