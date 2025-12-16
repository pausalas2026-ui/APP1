// DOCUMENTO 26 - FASE1 AUTH USERS PLANS
// DTO para login de usuario

import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email invalido' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'La contrasena es requerida' })
  password: string;
}
