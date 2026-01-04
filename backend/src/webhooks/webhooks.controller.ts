import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyWebhook() {
    // Health check endpoint for webhook verification
    // AdWhats may send GET request to verify webhook is accessible
    return { 
      success: true, 
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString()
    };
  }

  @Post('whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWhatsApp(@Body() payload: any, @Headers() headers: any) {
    // Log incoming webhook for debugging
    console.log('[Webhook] Received WhatsApp webhook:', {
      payload,
      headers: Object.keys(headers),
      timestamp: new Date().toISOString(),
    });

    // Verify webhook token (AdWhats sends webhook-token header)
    const webhookToken = headers['webhook-token'] || headers['webhook_token'];
    const expectedToken = process.env.ADWHATS_WEBHOOK_TOKEN;
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('[Webhook] Invalid webhook token received');
      return { success: false, message: 'Invalid webhook token' };
    }

    const result = await this.webhooksService.handleWhatsAppWebhook(payload);
    console.log('[Webhook] Processing result:', result);
    return result;
  }
}

