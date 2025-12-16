// DOCUMENTO 32 - BLOQUE 2
// DTO para actualizar premio de usuario

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
import { PrizeConditionDto, DeliveredByDto } from './create-user-prize.dto';

export class UpdateUserPrizeDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  descripcion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Max(100000)
  valorEstimado?: number;

  @IsOptional()
  @IsEnum(PrizeConditionDto)
  condition?: PrizeConditionDto;

  @IsOptional()
  @IsEnum(DeliveredByDto)
  deliveredBy?: DeliveredByDto;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  deliveryConditions?: string;

  @IsOptional()
  @IsBoolean()
  isDonated?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsUrl({}, { each: true })
  images?: string[];

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
