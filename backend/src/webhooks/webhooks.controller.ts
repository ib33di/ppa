import { Controller, Post, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWhatsApp(@Body() payload: any, @Headers() headers: any) {
    // Verify webhook token (AdWhats sends webhook-token header)
    const webhookToken = headers['webhook-token'];
    const expectedToken = process.env.ADWHATS_WEBHOOK_TOKEN;
    
    if (expectedToken && webhookToken !== expectedToken) {
      return { success: false, message: 'Invalid webhook token' };
    }

    const result = await this.webhooksService.handleWhatsAppWebhook(payload);
    return result;
  }
}

