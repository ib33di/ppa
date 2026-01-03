import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PaymentsModule } from '../payments/payments.module';
import { InvitationsModule } from '../invitations/invitations.module';
import { PlayersModule } from '../players/players.module';

@Module({
  controllers: [WebhooksController],
  providers: [WebhooksService],
  imports: [WhatsAppModule, PaymentsModule, InvitationsModule, PlayersModule],
})
export class WebhooksModule {}

