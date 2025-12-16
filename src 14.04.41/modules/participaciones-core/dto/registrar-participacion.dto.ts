// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.2: DTO para registrar participacion

import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';

export class RegistrarParticipacionDto {
  @IsUUID('4', { message: 'El ID de usuario debe ser un UUID valido' })
  @IsNotEmpty({ message: 'El ID de usuario es obligatorio' })
  userId: string;

  @IsUUID('4', { message: 'El ID de sorteo debe ser un UUID valido' })
  @IsNotEmpty({ message: 'El ID de sorteo es obligatorio' })
  sorteoId: string;

  @IsOptional()
  @IsInt({ message: 'El maximo de boletos debe ser un numero entero' })
  @Min(1, { message: 'El minimo de boletos permitidos es 1' })
  @Max(10, { message: 'El maximo de boletos permitidos es 10' })
  maxBoletos?: number;
}
