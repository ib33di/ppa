import { Module, forwardRef } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { InvitationsModule } from '../invitations/invitations.module';

@Module({
  imports: [
    SupabaseModule,
    forwardRef(() => InvitationsModule),
  ],
  controllers: [MatchesController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}

