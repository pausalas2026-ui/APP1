// DOCUMENTO 37 - LOGS, AUDITORIA Y TRAZABILIDAD
// Modulo de auditoria - Global para toda la aplicacion

import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

/**
 * Modulo global de auditoria
 * DOC 37: Este modulo debe estar disponible en toda la aplicacion
 * para que cualquier servicio pueda registrar eventos
 */
@Global()
@Module({
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
