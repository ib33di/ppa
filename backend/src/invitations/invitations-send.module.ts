import { Module } from '@nestjs/common';
import { InvitationsModule } from './invitations.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { InvitationsSendController } from './invitations-send.controller';

@Module({
  imports: [InvitationsModule, WhatsAppModule],
  controllers: [InvitationsSendController],
})
export class InvitationsSendModule {}

