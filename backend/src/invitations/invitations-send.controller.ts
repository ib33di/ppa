import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InvitationsService } from './invitations.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsSendController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  /**
   * Send invitations for an existing match (right panel control center flow).
   * Creates invitations if missing, then triggers WhatsApp sends.
   */
  @Post('send')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  async send(@Body() body: { match_id: string; player_ids: string[] }) {
    const invitations = await this.invitationsService.ensureInvitations(body.match_id, body.player_ids);
    const results: Array<{ invitationId: string; success: boolean; error?: string }> = [];

    for (const inv of invitations) {
      const r = await this.whatsappService.sendInvitation(inv.id);
      results.push({ invitationId: inv.id, success: r.success, error: r.error });
    }

    return { match_id: body.match_id, results };
  }
}

