import { Controller, Post, Body, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { WhatsAppService } from './whatsapp.service';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager')
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Post('send-invitation')
  async sendInvitation(@Body() body: { invitationId: string }) {
    if (!body.invitationId) {
      throw new HttpException(
        { success: false, error: 'invitationId is required' },
        HttpStatus.BAD_REQUEST
      );
    }
    
    const result = await this.whatsappService.sendInvitation(body.invitationId);
    
    if (!result.success) {
      // Return error response with proper status code
      throw new HttpException(
        { success: false, error: result.error || 'Failed to send invitation' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
    
    return result;
  }
}

