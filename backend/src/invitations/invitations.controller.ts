import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitationsService: InvitationsService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  create(@Body() createInvitationDto: CreateInvitationDto) {
    return this.invitationsService.create(createInvitationDto);
  }

  @Post('batch')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  createBatch(@Body() invitations: CreateInvitationDto[]) {
    return this.invitationsService.createBatch(invitations);
  }

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

  @Get()
  findAll(@Query('matchId') matchId?: string) {
    if (matchId) {
      return this.invitationsService.findByMatch(matchId);
    }
    return this.invitationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invitationsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  update(@Param('id') id: string, @Body() updateInvitationDto: UpdateInvitationDto) {
    return this.invitationsService.update(id, updateInvitationDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  remove(@Param('id') id: string) {
    return this.invitationsService.remove(id);
  }
}

