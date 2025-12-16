// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS seccion 7
// BLOQUE 2 - SUB-BLOQUE 2.7: Asignacion de causa por defecto
// Regla: Siempre debe haber una causa social asociada

import { Module } from '@nestjs/common';
import { DefaultCauseAssignmentsController } from './default-cause-assignments.controller';
import { DefaultCauseAssignmentsService } from './default-cause-assignments.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [DefaultCauseAssignmentsController],
  providers: [DefaultCauseAssignmentsService],
  exports: [DefaultCauseAssignmentsService],
})
export class DefaultCauseAssignmentsModule {}
