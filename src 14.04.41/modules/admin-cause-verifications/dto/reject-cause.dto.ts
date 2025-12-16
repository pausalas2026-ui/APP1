// DOCUMENTO 32 - BLOQUE ADMIN
// DTO para rechazar causa

import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class RejectCauseDto {
  @IsString()
  @MinLength(10, { message: 'El motivo de rechazo debe tener al menos 10 caracteres' })
  @MaxLength(500)
  rejectionReason: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
