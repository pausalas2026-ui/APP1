// DOCUMENTO 38 - INCIDENTES, FRAUDE Y DISPUTAS
// Modulo de incidentes - Gestion de incidentes, fraude y disputas

import { Module } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { EntityFlagsService } from './entity-flags.service';
import { IncidentsController } from './incidents.controller';

/**
 * Modulo de incidentes y fraude
 * DOC 38: Sistema de defensa en capas
 * 1. Deteccion - Flags automaticos
 * 2. Bloqueo - Retencion automatica
 * 3. Reporte - Canal para usuarios
 * 4. Investigacion - Estados claros
 * 5. Resolucion - Acciones del catalogo
 * 6. Registro - Todo queda en logs
 */
@Module({
  providers: [IncidentsService, EntityFlagsService],
  controllers: [IncidentsController],
  exports: [IncidentsService, EntityFlagsService],
})
export class IncidentsModule {}
