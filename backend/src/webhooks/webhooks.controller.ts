import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  private safeStringify(input: any) {
    const seen = new WeakSet();
    const redactKeys = new Set(['token', 'authorization', 'api_key', 'apikey', 'password', 'secret', 'webhook-token', 'webhook_token']);

    return JSON.stringify(
      input,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }

        const lowered = (key || '').toLowerCase();
        if (lowered && [...redactKeys].some((rk) => lowered.includes(rk))) {
          return value ? '***' : value;
        }

        return value;
      },
      2,
    );
  }

  @Get('whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyWebhook() {
    // Health check endpoint for webhook verification
    // Ultramsg may send GET request to verify webhook is accessible
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
      payloadType: typeof payload,
      payloadKeys: payload ? Object.keys(payload) : 'null',
      headerKeys: Object.keys(headers || {}),
      timestamp: new Date().toISOString(),
    });
    console.log('[Webhook] Full payload (redacted):', this.safeStringify(payload));
    
    // Log specific message fields for debugging
    if (payload) {
      console.log('[Webhook] Message field analysis:', {
        'payload.message': payload.message,
        'payload.text': payload.text,
        'payload.body': payload.body,
        'payload.content': payload.content,
        'payload.from': payload.from,
        'payload.phone': payload.phone,
        'payload.button_id': payload.button_id,
        'payload.interactive': payload.interactive,
      });
    }

    // Verify webhook token (Ultramsg may send webhook-token header)
    const webhookToken = headers['webhook-token'] || headers['webhook_token'] || headers['Webhook-Token'];
    const expectedToken = process.env.ULTRAMSG_WEBHOOK_TOKEN;
    
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
    
    // Return 200 OK even if processing failed (to prevent webhook retries)
    // The result object contains the actual success status
    return result;
  }

  @Post('whatsapp/test')
  @Public()
  @HttpCode(HttpStatus.OK)
  async testWebhook(
    @Body()
    testPayload: {
      from?: string;
      body?: string;
      message?: string;
      button_id?: string;
      interactive?: any;
    },
  ) {
    // Test endpoint to simulate webhook calls
    console.log('[Webhook] ========== TEST WEBHOOK CALLED ==========');
    console.log('[Webhook] Test payload:', JSON.stringify(testPayload, null, 2));
    
    const payload: any = {
      from: testPayload.from || '966512345678',
      body: testPayload.body || testPayload.message || 'YES',
      type: 'chat',
    };

    if (testPayload.button_id) {
      payload.button_id = testPayload.button_id;
      // In many UltraMsg/WhatsApp payloads, body may be empty on button clicks.
      if (!testPayload.body && !testPayload.message) {
        payload.body = '';
      }
    }

    if (testPayload.interactive) {
      payload.interactive = testPayload.interactive;
      if (!testPayload.body && !testPayload.message) {
        payload.body = '';
      }
    }
    
    const result = await this.webhooksService.handleWhatsAppWebhook(payload);
    return {
      success: true,
      message: 'Test webhook processed',
      result,
    };
  }
}

