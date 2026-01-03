import { Module } from '@nestjs/common';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppService } from './whatsapp.service';
import { InvitationsModule } from '../invitations/invitations.module';
import { PlayersModule } from '../players/players.module';
import { MatchesModule } from '../matches/matches.module';

@Module({
  controllers: [WhatsAppController],
  providers: [WhatsAppService],
  exports: [WhatsAppService],
  imports: [InvitationsModule, PlayersModule, MatchesModule],
})
export class WhatsAppModule {}

