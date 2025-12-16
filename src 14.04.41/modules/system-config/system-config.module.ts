// DOCUMENTO 40 - CONFIGURACIÓN GLOBAL Y PARÁMETROS
// Módulo de configuración del sistema

import { Module, Global } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';
import { PrismaModule } from '../shared/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Global() // DOC 40: Configuración debe estar disponible globalmente
@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
  ],
  controllers: [SystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
