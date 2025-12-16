// DOCUMENTO 32 - BLOQUE 2 - SUB-BLOQUE 2.4
// DTO para subir documentos de verificacion
// Referencia: DOCUMENTO 32 seccion 6.2, 13

import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class SubirDocumentosDto {
  // URLs de documentos adicionales
  @IsArray()
  @IsUrl({}, { each: true })
  documents: string[];

  // Enlaces externos verificables adicionales
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  externalLinks?: string[];

  // Actualizar nombre de fundacion
  @IsOptional()
  @IsString()
  @MaxLength(200)
  foundationName?: string;

  // Actualizar ID fiscal de fundacion
  @IsOptional()
  @IsString()
  @MaxLength(50)
  foundationId?: string;
}
