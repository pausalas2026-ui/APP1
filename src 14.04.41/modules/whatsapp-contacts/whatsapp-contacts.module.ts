// WhatsApp Contacts Module
// Módulo para gestión de contactos de WhatsApp e importación

import { Module } from '@nestjs/common';
import { WhatsappContactsService } from './whatsapp-contacts.service';
import { WhatsappContactsController } from './whatsapp-contacts.controller';
import { PrismaModule } from '../shared/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsappContactsController],
  providers: [WhatsappContactsService],
  exports: [WhatsappContactsService],
})
export class WhatsappContactsModule {}
