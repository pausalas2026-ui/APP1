// DOCUMENTO 32 - BLOQUE 2 - SUB-BLOQUE 2.4
// DTO para consultar estado de verificacion

import { IsString, IsUUID } from 'class-validator';

export class ConsultarEstadoDto {
  @IsUUID()
  causaId: string;
}
