// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 3.2 y 16
// BLOQUE 2 - SUB-BLOQUE 2.2
// DTO para crear premio de usuario
// Campos obligatorios segun seccion 3.2

import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
  Min,
  Max,
  ArrayMinSize,
  ArrayMaxSize,
  IsUrl,
} from 'class-validator';

export enum PrizeConditionDto {
  NEW = 'NEW',
  USED = 'USED',
}

export enum DeliveredByDto {
  USER = 'USER',
  PLATFORM = 'PLATFORM',
}

export class CreateUserPrizeDto {
  // Campo obligatorio: nombre del premio
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'El nombre no puede exceder 200 caracteres' })
  nombre: string;

  // Campo obligatorio: descripcion clara
  @IsString()
  @MinLength(10, { message: 'La descripcion debe tener al menos 10 caracteres' })
  @MaxLength(2000, { message: 'La descripcion no puede exceder 2000 caracteres' })
  descripcion: string;

  // Campo obligatorio: valor estimado (solo referencia, no precio)
  @IsNumber()
  @Min(0.01, { message: 'El valor estimado debe ser positivo' })
  @Max(100000, { message: 'El valor estimado no puede exceder 100000' })
  valorEstimado: number;

  // Campo obligatorio: estado nuevo/usado
  @IsEnum(PrizeConditionDto, { message: 'La condicion debe ser NEW o USED' })
  condition: PrizeConditionDto;

  // Campo obligatorio: quien entrega el premio
  @IsEnum(DeliveredByDto, { message: 'deliveredBy debe ser USER o PLATFORM' })
  deliveredBy: DeliveredByDto;

  // Campo obligatorio: condiciones de entrega
  @IsString()
  @MinLength(10, { message: 'Las condiciones de entrega deben tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'Las condiciones de entrega no pueden exceder 1000 caracteres' })
  deliveryConditions: string;

  // Campo obligatorio: si el premio es donado (sin compensacion)
  @IsBoolean()
  isDonated: boolean;

  // Campo obligatorio: fotos del premio (min 1, max 10)
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe incluir al menos 1 imagen' })
  @ArrayMaxSize(10, { message: 'No puede incluir mas de 10 imagenes' })
  @IsUrl({}, { each: true, message: 'Cada imagen debe ser una URL valida' })
  images: string[];

  // Campo opcional: categoria
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
