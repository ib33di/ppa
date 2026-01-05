import { Controller, Post, Get, Body, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  private isDebugEnabled() {
    return String(process.env.WEBHOOK_DEBUG || '').toLowerCase() === 'true';
  }

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
    const receivedAt = new Date();
    const debug = this.isDebugEnabled();

    // Keep logging lightweight by default to avoid blocking the event loop.
    console.log('[Webhook] WhatsApp webhook received', {
      payloadType: typeof payload,
      payloadKeys: payload ? Object.keys(payload) : 'null',
      timestamp: receivedAt.toISOString(),
    });

    if (debug) {
      console.log('[Webhook] Headers keys:', Object.keys(headers || {}));
      console.log('[Webhook] Full payload (redacted):', this.safeStringify(payload));
    }

    // Verify webhook token (Ultramsg may send webhook-token header)
    const webhookToken = headers['webhook-token'] || headers['webhook_token'] || headers['Webhook-Token'];
    const expectedToken = process.env.ULTRAMSG_WEBHOOK_TOKEN;
    
    if (debug) {
      console.log('[Webhook] Token verification:', {
        receivedToken: webhookToken ? '***' : 'none',
        expectedToken: expectedToken ? '***' : 'none',
        tokenMatch: expectedToken ? (webhookToken === expectedToken) : 'skipped (no token set)',
      });
    }
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.warn('[Webhook] Invalid webhook token received');
      // Still return 200 OK to prevent provider retries from causing bursts.
      return { success: false, message: 'Invalid webhook token' };
    }

    // Ensure payload has required fields
    if (!payload) {
      console.error('[Webhook] Payload is null or undefined');
      return { success: false, message: 'Payload is required' };
    }

    // Acknowledge immediately. Heavy processing is deferred to avoid timeouts/retries
    // and UI issues caused by upstream bursts.
    setImmediate(() => {
      this.webhooksService
        .handleWhatsAppWebhook(payload)
        .then((result) => {
          if (debug) {
            console.log('[Webhook] Async processing result:', JSON.stringify(result, null, 2));
          } else if (!result?.success) {
            console.warn('[Webhook] Async processing failed:', result?.message || 'unknown_error');
          }
        })
        .catch((err) => {
          console.error('[Webhook] Async processing error:', err);
        });
    });

    return {
      success: true,
      message: 'Accepted',
      timestamp: receivedAt.toISOString(),
    };
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

