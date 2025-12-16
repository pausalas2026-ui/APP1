// DOCUMENTO 32 - BLOQUE 2 - SUB-BLOQUE 2.4
// DTO para proponer causa propia
// Referencia: DOCUMENTO 32 seccion 6.2

import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { REQUISITOS_MINIMOS_VERIFICACION } from '../cause-verifications.constants';

export class ProponerCausaDto {
  @IsString()
  @MinLength(REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaNombre)
  @MaxLength(REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaNombre)
  nombre: string;

  @IsString()
  @MinLength(REQUISITOS_MINIMOS_VERIFICACION.longitudMinimaDescripcion)
  @MaxLength(REQUISITOS_MINIMOS_VERIFICACION.longitudMaximaDescripcion)
  descripcion: string;

  @IsOptional()
  @IsUrl()
  imagenUrl?: string;

  @IsOptional()
  @IsUrl()
  sitioWeb?: string;

  // Nombre de fundacion (si aplica)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  foundationName?: string;

  // ID fiscal de fundacion (si aplica)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  foundationId?: string;

  // Documentos de verificacion (URLs)
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  documents?: string[];

  // Enlaces externos verificables
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  externalLinks?: string[];
}
