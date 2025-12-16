// DOCUMENTO 05 - ARQUITECTURA
// Modulo raiz de la aplicacion

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SorteosModule } from './modules/sorteos/sorteos.module';
import { PremiosModule } from './modules/premios/premios.module';
import { CausasModule } from './modules/causas/causas.module';
import { PrismaModule } from './modules/shared/prisma.module';

@Module({
  imports: [
    // Configuracion global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Modulos compartidos
    PrismaModule,
    
    // Modulos de BLOQUE 1
    AuthModule,
    UsersModule,
    SorteosModule,
    PremiosModule,
    CausasModule,
  ],
})
export class AppModule {}
