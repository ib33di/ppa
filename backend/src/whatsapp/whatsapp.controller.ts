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
    
    try {
      const result = await this.whatsappService.sendInvitation(body.invitationId);
      
      // Return the result directly, even if it failed
      // The frontend will handle the success/failure based on result.success
      return result;
    } catch (error) {
      // Only throw exception for unexpected errors
      throw new HttpException(
        { success: false, error: error.message || 'Failed to send invitation' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

