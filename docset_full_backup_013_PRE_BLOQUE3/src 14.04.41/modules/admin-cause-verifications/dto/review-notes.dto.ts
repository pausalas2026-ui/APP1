// DOCUMENTO 32 - BLOQUE ADMIN
// DTO para notas de revision

import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ReviewNotesDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
