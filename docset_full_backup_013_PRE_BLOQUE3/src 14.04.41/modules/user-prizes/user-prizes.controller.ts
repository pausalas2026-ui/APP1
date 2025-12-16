// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 3.2 y 13
// BLOQUE 2 - SUB-BLOQUE 2.2
// Controller de premios de usuario

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserPrizesService } from './user-prizes.service';
import { CreateUserPrizeDto } from './dto/create-user-prize.dto';
import { UpdateUserPrizeDto } from './dto/update-user-prize.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('prizes')
export class UserPrizesController {
  constructor(private readonly userPrizesService: UserPrizesService) {}

  // GET /api/v1/prizes/catalog (publico)
  // Referencia: DOCUMENTO 32 seccion 13
  @Get('catalog')
  async getCatalog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userPrizesService.getCatalog(page, limit);
  }

  // GET /api/v1/prizes/catalog/:category (publico)
  // Referencia: DOCUMENTO 32 seccion 13
  @Get('catalog/:categorySlug')
  async getCatalogByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userPrizesService.getCatalogByCategory(categorySlug, page, limit);
  }

  // GET /api/v1/prizes/user/my (protegido)
  // Referencia: DOCUMENTO 32 seccion 13
  @Get('user/my')
  @UseGuards(JwtAuthGuard)
  async getMyPrizes(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userPrizesService.getByCreator(req.user.id, page, limit);
  }

  // GET /api/v1/prizes/:id (publico)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userPrizesService.findById(id);
  }

  // POST /api/v1/prizes/user (protegido)
  // Referencia: DOCUMENTO 32 seccion 13 - Usuario sube su premio
  @Post('user')
  @UseGuards(JwtAuthGuard)
  async createUserPrize(
    @Request() req: any,
    @Body() createDto: CreateUserPrizeDto,
  ) {
    return this.userPrizesService.createUserPrize(req.user.id, createDto);
  }

  // PUT /api/v1/prizes/user/:id (protegido)
  // Referencia: DOCUMENTO 32 seccion 13
  @Put('user/:id')
  @UseGuards(JwtAuthGuard)
  async updateUserPrize(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateUserPrizeDto,
  ) {
    return this.userPrizesService.updateUserPrize(req.user.id, id, updateDto);
  }

  // PUT /api/v1/prizes/user/:id/submit (protegido)
  // Enviar premio para revision
  @Put('user/:id/submit')
  @UseGuards(JwtAuthGuard)
  async submitForReview(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.userPrizesService.submitForReview(req.user.id, id);
  }
}
