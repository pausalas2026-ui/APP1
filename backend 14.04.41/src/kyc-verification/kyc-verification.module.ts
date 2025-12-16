/**
 * KYC Verification Module
 * 
 * DOCUMENTO 33 - Sistema de Verificación KYC
 * ==========================================
 * 
 * Este módulo implementa el sistema de verificación de identidad
 * requerido para todos los flujos de dinero en la plataforma.
 * 
 * REGLA FUNDAMENTAL: "NADIE recibe dinero sin verificación previa"
 * 
 * Componentes:
 * - KycVerificationService: Lógica principal de verificación
 * - KycVerificationController: Endpoints para usuarios
 * - AdminKycVerificationController: Endpoints para administradores
 * 
 * Características:
 * - Niveles de KYC (LEVEL_1, LEVEL_2)
 * - Estados de verificación (NOT_VERIFIED → PENDING → VERIFIED/REJECTED)
 * - Estados de fondos (GENERATED → HELD → PENDING_VERIFICATION → APPROVED → RELEASED)
 * - Integración con proveedores KYC (mock en desarrollo)
 */

import { Module } from '@nestjs/common';
import { KycVerificationService } from './kyc-verification.service';
import { KycVerificationController } from './kyc-verification.controller';
import { AdminKycVerificationController } from './admin-kyc-verification.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    KycVerificationController,
    AdminKycVerificationController,
  ],
  providers: [KycVerificationService],
  exports: [KycVerificationService],
})
export class KycVerificationModule {}
