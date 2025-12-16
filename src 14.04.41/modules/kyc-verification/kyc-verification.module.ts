// DOCUMENTO 33 - KYC, VERIFICACIÓN DE IDENTIDAD Y LIBERACIÓN DE FONDOS
// Módulo principal de verificación KYC
// REGLA MADRE: NADIE recibe dinero sin verificación previa

import { Module } from '@nestjs/common';
import { KycVerificationService } from './kyc-verification.service';
import { KycVerificationController, FundsController } from './kyc-verification.controller';
import { AdminKycVerificationController, AdminFundsController } from './admin-kyc-verification.controller';
import { PrismaModule } from '../shared/prisma.module';

/**
 * KycVerificationModule
 * 
 * Implementa el sistema de verificación de identidad (KYC) y gestión de fondos
 * según DOCUMENTO 33.
 * 
 * REGLAS FUNDAMENTALES:
 * - NADIE recibe dinero sin verificación previa
 * - SIN EVIDENCIA = SIN DINERO
 * - Los fondos siguen un flujo estricto de estados
 * 
 * Componentes:
 * - KycVerificationService: Lógica de verificación y gestión de fondos
 * - KycVerificationController: Endpoints de usuario para KYC
 * - FundsController: Endpoints de usuario para fondos
 * - AdminKycVerificationController: Endpoints admin para KYC
 * - AdminFundsController: Endpoints admin para fondos
 * 
 * Estados de verificación (DOC33 §4):
 * NOT_VERIFIED → VERIFICATION_PENDING → VERIFIED / VERIFICATION_REJECTED
 *                                    → VERIFICATION_EXPIRED
 * 
 * Estados de fondos (DOC33 §12):
 * GENERATED → HELD → PENDING_VERIFICATION → APPROVED → RELEASED
 *                                        → REJECTED → BLOCKED
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    // Endpoints usuario
    KycVerificationController,
    FundsController,
    // Endpoints admin
    AdminKycVerificationController,
    AdminFundsController,
  ],
  providers: [KycVerificationService],
  exports: [KycVerificationService],
})
export class KycVerificationModule {}
