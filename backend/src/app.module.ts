import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { PlayersModule } from './players/players.module';
import { CourtsModule } from './courts/courts.module';
import { MatchesModule } from './matches/matches.module';
import { InvitationsModule } from './invitations/invitations.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { PaymentsModule } from './payments/payments.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    SupabaseModule,
    AuthModule,
    PlayersModule,
    CourtsModule,
    MatchesModule,
    InvitationsModule,
    WhatsAppModule,
    WebhooksModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}

