// DOCUMENTO 05 - ARQUITECTURA
// DOCUMENTO 32 - REGLAS PRODUCTO SORTEOS
// Modulo raiz de la aplicacion

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SorteosModule } from './modules/sorteos/sorteos.module';
import { PremiosModule } from './modules/premios/premios.module';
import { CausasModule } from './modules/causas/causas.module';
import { PrismaModule } from './modules/shared/prisma.module';

// BLOQUE 2 - DOCUMENTO 32
import { SorteosCoreModule } from './modules/sorteos-core/sorteos-core.module';
import { ParticipacionesCoreModule } from './modules/participaciones-core/participaciones-core.module';
import { SorteoStatesModule } from './modules/sorteo-states/sorteo-states.module';
import { CauseVerificationsModule } from './modules/cause-verifications/cause-verifications.module';
import { PrizeDeliveriesModule } from './modules/prize-deliveries/prize-deliveries.module';
import { UserPrizesModule } from './modules/user-prizes/user-prizes.module';
import { PrizeCategoriesModule } from './modules/prize-categories/prize-categories.module';
import { DefaultCauseAssignmentsModule } from './modules/default-cause-assignments/default-cause-assignments.module';

// BLOQUE ADMIN - DOCUMENTO 32 (backend only)
import { AdminCauseVerificationsModule } from './modules/admin-cause-verifications/admin-cause-verifications.module';
import { AdminPrizeDeliveriesModule } from './modules/admin-prize-deliveries/admin-prize-deliveries.module';

// DOCUMENTO 33 - KYC y Gestión de Fondos
import { KycVerificationModule } from './modules/kyc-verification/kyc-verification.module';

// DOCUMENTO 34 - Estados del Dinero y Flujos Financieros
import { FundLedgerModule } from './modules/fund-ledger/fund-ledger.module';

// DOCUMENTO 35 - Consentimientos Legales y RGPD
import { LegalConsentsModule } from './modules/legal-consents/legal-consents.module';

// DOCUMENTO 36 - Engagement, Mensajería y Geolocalización
import { EngagementModule } from './modules/engagement/engagement.module';

// WhatsApp Contacts - Importación y gestión de contactos
import { WhatsappContactsModule } from './modules/whatsapp-contacts/whatsapp-contacts.module';

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
    
    // Modulos de BLOQUE 2 - DOCUMENTO 32
    SorteosCoreModule,
    ParticipacionesCoreModule,
    SorteoStatesModule,
    CauseVerificationsModule,
    PrizeDeliveriesModule,
    UserPrizesModule,
    PrizeCategoriesModule,
    DefaultCauseAssignmentsModule,
    
    // Modulos ADMIN - DOCUMENTO 32
    AdminCauseVerificationsModule,
    AdminPrizeDeliveriesModule,
    
    // DOCUMENTO 33 - KYC y Gestión de Fondos
    KycVerificationModule,
    
    // DOCUMENTO 34 - Estados del Dinero y Flujos Financieros
    FundLedgerModule,
    
    // DOCUMENTO 35 - Consentimientos Legales y RGPD
    LegalConsentsModule,
    
    // DOCUMENTO 36 - Engagement, Mensajería y Geolocalización
    EngagementModule,
    
    // WhatsApp Contacts - Importación y gestión de contactos
    WhatsappContactsModule,
  ],
})
export class AppModule {}
