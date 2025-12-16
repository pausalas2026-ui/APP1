// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: DTO para validacion de acciones

import { IsString, IsNotEmpty } from 'class-validator';

export class ValidarAccionDto {
  @IsNotEmpty({ message: 'La accion es requerida' })
  @IsString({ message: 'La accion debe ser un string' })
  accion: string;
}
