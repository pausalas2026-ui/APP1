// DOCUMENTO 32 - BLOQUE 2
// DTO para crear categoria de premios

import { IsString, IsOptional, IsEnum, IsInt, Min, Matches } from 'class-validator';

export enum TargetAudienceDto {
  WOMEN = 'WOMEN',
  MEN = 'MEN',
  TECH = 'TECH',
  HOME = 'HOME',
  EXPERIENCES = 'EXPERIENCES',
  GENERAL = 'GENERAL',
}

export class CreatePrizeCategoryDto {
  @IsString()
  nombre: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minusculas, numeros y guiones' })
  slug: string;

  @IsOptional()
  @IsEnum(TargetAudienceDto)
  targetAudience?: TargetAudienceDto;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
