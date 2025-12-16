// DOCUMENTO 34 - ESTADOS DEL DINERO, FLUJOS FINANCIEROS
// Módulo principal de Fund Ledger
// REGLA: El dinero NUNCA está "libre" hasta que se cumplen TODAS las condiciones

import { Module } from '@nestjs/common';
import { FundLedgerService } from './fund-ledger.service';
import { FundLedgerController } from './fund-ledger.controller';
import { AdminFundLedgerController } from './admin-fund-ledger.controller';
import { PrismaModule } from '../shared/prisma.module';

/**
 * FundLedgerModule
 * 
 * Implementa el sistema de estados de fondos según DOCUMENTO 34.
 * 
 * REGLAS FUNDAMENTALES:
 * - El dinero NUNCA está "libre" hasta que se cumplen TODAS las condiciones
 * - El dinero SIEMPRE nace RETENIDO (HELD)
 * - El dinero SOLO puede avanzar hacia adelante, NUNCA retroceder
 * - Sin checklist completo, NO se libera
 * - Si hay DUDA, el dinero NO se libera
 * 
 * Estados:
 * GENERATED → HELD → PENDING_VERIFICATION → APPROVED → RELEASED
 *                                         ↓
 *                                      BLOCKED
 * 
 * Tablas:
 * - fund_ledger: Registro principal de fondos
 * - fund_status_history: Historial de cambios de estado
 * - fund_release_checklist: Checklist de verificación
 */
@Module({
  imports: [PrismaModule],
  controllers: [FundLedgerController, AdminFundLedgerController],
  providers: [FundLedgerService],
  exports: [FundLedgerService],
})
export class FundLedgerModule {}
