// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 13
// BLOQUE 2 - SUB-BLOQUE 2.1
// Controller de categorias de premios

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { PrizeCategoriesService } from './prize-categories.service';
import { CreatePrizeCategoryDto } from './dto/create-prize-category.dto';
import { UpdatePrizeCategoryDto } from './dto/update-prize-category.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('prizes/categories')
export class PrizeCategoriesController {
  constructor(private readonly prizeCategoriesService: PrizeCategoriesService) {}

  // GET /api/v1/prizes/categories (publico)
  // Referencia: DOCUMENTO 32 seccion 13 - GET /prizes/categories
  @Get()
  async findAll() {
    return this.prizeCategoriesService.findAll();
  }

  // GET /api/v1/prizes/categories/active (publico)
  @Get('active')
  async findActive() {
    return this.prizeCategoriesService.findActive();
  }

  // GET /api/v1/prizes/categories/:id (publico)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prizeCategoriesService.findById(id);
  }

  // GET /api/v1/prizes/categories/slug/:slug (publico)
  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.prizeCategoriesService.findBySlug(slug);
  }

  // POST /api/v1/prizes/categories (protegido)
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createDto: CreatePrizeCategoryDto) {
    return this.prizeCategoriesService.create(createDto);
  }

  // PUT /api/v1/prizes/categories/:id (protegido)
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateDto: UpdatePrizeCategoryDto) {
    return this.prizeCategoriesService.update(id, updateDto);
  }
}
