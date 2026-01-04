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
    console.log('[Webhook] ========== WEBHOOK RECEIVED ==========');
    console.log('[Webhook] Received WhatsApp webhook:', {
      payload,
      payloadType: typeof payload,
      payloadKeys: payload ? Object.keys(payload) : 'null',
      headers: Object.keys(headers),
      timestamp: new Date().toISOString(),
    });
    console.log('[Webhook] Full payload JSON:', JSON.stringify(payload, null, 2));
    console.log('[Webhook] Headers:', JSON.stringify(headers, null, 2));

    // Verify webhook token (AdWhats sends webhook-token header)
    const webhookToken = headers['webhook-token'] || headers['webhook_token'] || headers['Webhook-Token'];
    const expectedToken = process.env.ADWHATS_WEBHOOK_TOKEN;
    
    console.log('[Webhook] Token verification:', {
      receivedToken: webhookToken ? '***' : 'none',
      expectedToken: expectedToken ? '***' : 'none',
      tokenMatch: expectedToken ? (webhookToken === expectedToken) : 'skipped (no token set)',
    });
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('[Webhook] Invalid webhook token received');
      return { success: false, message: 'Invalid webhook token' };
    }

    // Ensure payload has required fields
    if (!payload) {
      console.error('[Webhook] Payload is null or undefined');
      return { success: false, message: 'Payload is required' };
    }

    const result = await this.webhooksService.handleWhatsAppWebhook(payload);
    console.log('[Webhook] Processing result:', JSON.stringify(result, null, 2));
    console.log('[Webhook] ========== WEBHOOK PROCESSED ==========');
    return result;
  }
}

