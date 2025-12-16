// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// SUB-BLOQUE 2.1: DTO para crear sorteo

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsInt,
  IsUUID,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum TipoSorteoDto {
  ESTANDAR = 'ESTANDAR',
  EXPRESS = 'EXPRESS',
  BENEFICO = 'BENEFICO',
}

export class CrearSorteoDto {
  @IsString({ message: 'El titulo debe ser un texto' })
  @IsNotEmpty({ message: 'El titulo es obligatorio' })
  @MinLength(5, { message: 'El titulo debe tener minimo 5 caracteres' })
  @MaxLength(200, { message: 'El titulo no puede exceder 200 caracteres' })
  titulo: string;

  @IsString({ message: 'La descripcion debe ser un texto' })
  @IsNotEmpty({ message: 'La descripcion es obligatoria' })
  @MinLength(20, { message: 'La descripcion debe tener minimo 20 caracteres' })
  @MaxLength(2000, { message: 'La descripcion no puede exceder 2000 caracteres' })
  descripcion: string;

  @IsOptional()
  @IsString({ message: 'La URL de imagen debe ser un texto' })
  imagenUrl?: string;

  @IsOptional()
  @IsEnum(TipoSorteoDto, {
    message: 'Tipo de sorteo invalido. Valores validos: ESTANDAR, EXPRESS, BENEFICO',
  })
  tipo?: TipoSorteoDto;

  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha valida' })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria' })
  fechaInicio: string;

  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha valida' })
  @IsNotEmpty({ message: 'La fecha de fin es obligatoria' })
  fechaFin: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de sorteo debe ser una fecha valida' })
  fechaSorteo?: string;

  @IsInt({ message: 'El total de boletos debe ser un numero entero' })
  @Min(10, { message: 'El sorteo debe tener minimo 10 boletos' })
  @Max(100000, { message: 'El sorteo no puede tener mas de 100,000 boletos' })
  totalBoletos: number;

  @IsOptional()
  @IsInt({ message: 'El minimo de participantes debe ser un numero entero' })
  @Min(1, { message: 'El minimo de participantes debe ser al menos 1' })
  minimoParticipantes?: number;

  @IsOptional()
  @IsUUID('4', { message: 'El ID de causa debe ser un UUID valido' })
  causaId?: string;

  @IsOptional()
  @IsInt({ message: 'El porcentaje para la causa debe ser un numero entero' })
  @Min(1, { message: 'El porcentaje minimo es 1%' })
  @Max(100, { message: 'El porcentaje maximo es 100%' })
  porcentajeCausa?: number;
}
