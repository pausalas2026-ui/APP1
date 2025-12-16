// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// BLOQUE 2 - SUB-BLOQUE 2.1: Categorias de premios
// Modulo de categorias de premios de plataforma

import { Module } from '@nestjs/common';
import { PrizeCategoriesController } from './prize-categories.controller';
import { PrizeCategoriesService } from './prize-categories.service';

@Module({
  controllers: [PrizeCategoriesController],
  providers: [PrizeCategoriesService],
  exports: [PrizeCategoriesService],
})
export class PrizeCategoriesModule {}
