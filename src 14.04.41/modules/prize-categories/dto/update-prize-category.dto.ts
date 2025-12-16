// DOCUMENTO 32 - BLOQUE 2
// DTO para actualizar categoria de premios

import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min, Matches } from 'class-validator';
import { TargetAudienceDto } from './create-prize-category.dto';

export class UpdatePrizeCategoryDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minusculas, numeros y guiones' })
  slug?: string;

  @IsOptional()
  @IsEnum(TargetAudienceDto)
  targetAudience?: TargetAudienceDto;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
