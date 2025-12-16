// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.3: DTO para transiciones de estado

import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoSorteo } from '@prisma/client';

export class TransicionarDto {
  @IsNotEmpty({ message: 'El estado destino es requerido' })
  @IsEnum(EstadoSorteo, {
    message: `Estado invalido. Estados validos: ${Object.values(EstadoSorteo).join(', ')}`,
  })
  estadoDestino: EstadoSorteo;
}
