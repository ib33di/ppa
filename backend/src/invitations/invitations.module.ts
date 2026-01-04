import { Module, forwardRef } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { MatchesModule } from '../matches/matches.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    SupabaseModule,
    forwardRef(() => MatchesModule),
    forwardRef(() => WhatsAppModule),
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}

