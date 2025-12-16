// DOCUMENTO 03 - ACTORES Y ROLES
// DTO para crear usuario

import { IsEmail, IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contrasena debe tener al menos 8 caracteres' })
  password: string;

  @IsString()
  @MinLength(2)
  nombre: string;

  @IsOptional()
  @IsString()
  apellidos?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
