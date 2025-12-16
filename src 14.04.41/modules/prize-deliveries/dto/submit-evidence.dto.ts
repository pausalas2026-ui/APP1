// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 16
// BLOQUE 2 - SUB-BLOQUE 2.3
// DTO para subir evidencia de entrega
// Validaciones segun deliveryEvidenceSchema

import {
  IsString,
  IsArray,
  IsOptional,
  IsDateString,
  IsEmail,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
  ValidateIf,
} from 'class-validator';

export class SubmitEvidenceDto {
  // Imagenes de evidencia (min 1, max 10)
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos 1 imagen de evidencia' })
  @ArrayMaxSize(10, { message: 'No puede incluir mas de 10 imagenes' })
  @IsUrl({}, { each: true, message: 'Cada imagen debe ser una URL valida' })
  images: string[];

  // Telefono del ganador (opcional pero se requiere al menos uno)
  @IsOptional()
  @IsString()
  winnerPhone?: string;

  // Email del ganador (opcional pero se requiere al menos uno)
  @IsOptional()
  @IsEmail({}, { message: 'Email invalido' })
  winnerEmail?: string;

  // Fecha de entrega
  @IsDateString()
  deliveryDate: string;

  // Notas de entrega (opcional, max 500)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNotes?: string;
}
