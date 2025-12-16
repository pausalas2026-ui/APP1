// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 3.2
// BLOQUE 2 - SUB-BLOQUE 2.2: Premios de usuario
// El usuario puede subir su propio premio

import { Module } from '@nestjs/common';
import { UserPrizesController } from './user-prizes.controller';
import { UserPrizesService } from './user-prizes.service';
import { PrizeCategoriesModule } from '../prize-categories/prize-categories.module';

@Module({
  imports: [PrizeCategoriesModule],
  controllers: [UserPrizesController],
  providers: [UserPrizesService],
  exports: [UserPrizesService],
})
export class UserPrizesModule {}
