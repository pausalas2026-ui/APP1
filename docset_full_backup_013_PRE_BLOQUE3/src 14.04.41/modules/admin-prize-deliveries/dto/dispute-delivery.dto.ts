// DOCUMENTO 32 - BLOQUE ADMIN
// DTO para marcar disputa de entrega

import { IsString, MinLength, MaxLength } from 'class-validator';

export class DisputeDeliveryDto {
  @IsString()
  @MinLength(10, { message: 'El motivo de disputa debe tener al menos 10 caracteres' })
  @MaxLength(500)
  reason: string;
}
