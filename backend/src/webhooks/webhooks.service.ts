import { Injectable } from '@nestjs/common';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { PaymentsService } from '../payments/payments.service';
import { InvitationsService } from '../invitations/invitations.service';
import { PlayersService } from '../players/players.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WebhooksService {
  constructor(
    private whatsappService: WhatsAppService,
    private paymentsService: PaymentsService,
    private invitationsService: InvitationsService,
    private playersService: PlayersService,
    private supabase: SupabaseService,
  ) {}

  private isDebugEnabled() {
    return String(process.env.WEBHOOK_DEBUG || '').toLowerCase() === 'true';
  }

  private safeStringify(input: any) {
    const seen = new WeakSet();
    const redactNeedles = ['token', 'authorization', 'api_key', 'apikey', 'password', 'secret', 'webhook-token', 'webhook_token'];
    return JSON.stringify(
      input,
      (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        const lowered = (key || '').toLowerCase();
        if (lowered && redactNeedles.some((n) => lowered.includes(n))) {
          return value ? '***' : value;
        }
        return value;
      },
      2,
    );
  }

  private extractButtonId(payload: any): string | null {
    return (
      payload?.button_id ||
      payload?.data?.button_id ||
      payload?.buttonId ||
      payload?.data?.buttonId ||
      payload?.interactive?.button_reply?.id ||
      payload?.data?.interactive?.button_reply?.id ||
      payload?.interactive?.id ||
      payload?.data?.interactive?.id ||
      payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.button?.payload ||
      payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.interactive?.button_reply?.id ||
      null
    );
  }

  private mapButtonIdToDecision(buttonId: string | null): 'YES' | 'NO' | null {
    if (!buttonId) return null;
    if (buttonId === 'CONFIRM_YES') return 'YES';
    if (buttonId === 'CONFIRM_NO') return 'NO';

    // Backward compatibility with older button schemes previously used in this codebase.
    const lower = buttonId.toLowerCase();
    if (lower.startsWith('yes_') || lower.includes('yes_')) return 'YES';
    if (lower.startsWith('no_') || lower.includes('no_')) return 'NO';
    return null;
  }

  /**
   * Handle incoming WhatsApp webhook from Ultramsg.com
   * Expected payload structure (based on Ultramsg API documentation):
   * {
   *   "event_type": "message_received",
   *   "instanceId": "1150",
   *   "data": {
   *     "id": "[email protected]_3EB0FF54790702367270",
   *     "from": "[email protected]",
   *     "to": "[email protected]",
   *     "ack": "",
   *     "type": "chat",
   *     "body": "Hello, World!",
   *     "fromMe": false,
   *     "time": 1644957719
   *   }
   * }
   * 
   * Reference: https://blog.ultramsg.com/ar/استقبال-whatsapp-api-باستخدام-الويب-هوك-nodejs/
   */
  async handleWhatsAppWebhook(payload: any): Promise<{ success: boolean; message?: string }> {
    try {
      const debug = this.isDebugEnabled();
      const startedAt = new Date();

      console.log('[Webhook] Processing WhatsApp webhook (async)', {
        payloadKeys: Object.keys(payload || {}),
        timestamp: startedAt.toISOString(),
      });

      if (debug) {
        console.log('[Webhook] Full payload (redacted):', this.safeStringify(payload));
      }

      // Extract phone number from Ultramsg payload structure
      // Ultramsg sends: data.from which may be "[email protected]" or just the number
      let from = payload?.data?.from || 
                  payload?.from || 
                  payload?.phone || 
                  payload?.phone_number || 
                  payload?.sender || 
                  payload?.wa_id ||
                  null;
      
      // Extract phone number from WhatsApp ID format (e.g., "[email protected]" -> "966512345678")
      if (from && from.includes('@')) {
        // Extract phone number from WhatsApp ID format: [email protected]
        const phoneMatch = from.match(/^(\d+)@/);
        if (phoneMatch) {
          from = phoneMatch[1];
          console.log('[Webhook] Extracted phone from WhatsApp ID:', { original: payload?.data?.from, extracted: from });
        }
      }
      
      // Extract message text from Ultramsg payload structure
      // Ultramsg sends: data.body for the message content
      const message = payload?.data?.body ||
                    payload?.body || 
                    payload?.message || 
                    payload?.text || 
                    payload?.content || 
                    payload?.data?.message ||
                    payload?.data?.text ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.body ||
                    null;

      // Extract instance ID and event type
      const instanceId = payload?.instanceId || payload?.instance || payload?.data?.instance || null;
      const eventType = payload?.event_type || null;
      
      console.log('[Webhook] Extracted data:', {
        eventType,
        instanceId,
        from,
        message,
        fromMe: payload?.data?.fromMe,
      });
      
      // Ignore messages sent by us (fromMe: true)
      if (payload?.data?.fromMe === true) {
        console.log('[Webhook] Ignoring message sent by us (fromMe: true)');
        return { success: true, message: 'Message ignored (sent by us)' };
      }
      
      // Only process message_received events
      if (eventType && eventType !== 'message_received') {
        console.log(`[Webhook] Ignoring event type: ${eventType}`);
        return { success: true, message: `Event type ${eventType} ignored` };
      }
      
      // Handle interactive/button responses with stable IDs
      const buttonId = this.extractButtonId(payload);
      const mappedDecision = this.mapButtonIdToDecision(buttonId);
      let messageText = message || '';
      if (mappedDecision) {
        messageText = mappedDecision;
      }

      console.log('[Webhook] Derived decision:', {
        buttonId,
        mappedDecision,
        messageText,
      });

      // Final check: ensure we have either a message or button/interactive response
      if (!from) {
        console.error('[Webhook] Missing phone number (from field)');
        console.error('[Webhook] Payload structure (redacted):', this.safeStringify(payload));
        return { success: false, message: 'Missing phone number (from field)' };
      }

      if (!messageText && !buttonId) {
        console.warn('[Webhook] Missing message content:', { 
          from, 
          originalMessage: message,
          messageText,
          buttonId,
          hasFrom: !!from,
          hasMessage: !!messageText,
          payloadKeys: Object.keys(payload || {}),
          payloadStructure: this.safeStringify(payload),
        });
        return { success: false, message: 'Missing message content' };
      }

      // If messageText is still empty but we have button_id or interactive, that's OK
      // But if it's truly undefined/null, set it to empty string
      if (!messageText) {
        messageText = '';
      }

      // Process incoming message (detects YES/NO)
      // Note: Ultramsg sends phone number without + prefix (e.g., "966512345678")
      console.log('[Webhook] ========== CALLING processIncomingMessage ==========');
      console.log('[Webhook] Parameters:', { 
        from, 
        message: messageText, 
        originalMessage: message,
        messageType: typeof messageText,
        messageLength: messageText?.length || 0
      });
      
      const result = await this.whatsappService.processIncomingMessage(from, messageText);
      
      console.log('[Webhook] ========== processIncomingMessage RESULT ==========');
      console.log('[Webhook] Result:', JSON.stringify(result, null, 2));
      console.log('[Webhook] Success:', result.success);
      console.log('[Webhook] Action:', result.action);

      if (!result.success) {
        console.warn(`[Webhook] Processing failed: ${result.action}`);
        if (debug) console.warn(`[Webhook] Full result:`, result);
        return { success: false, message: `Processing failed: ${result.action}` };
      }

      console.log(`[Webhook] Successfully processed message. Action: ${result.action}`);

      // Ignore unrelated messages safely.
      if (result.action === 'ignored') {
        console.log('[Webhook] Ignored unrelated message (no action taken).');
        return { success: true, message: 'Ignored unrelated message' };
      }

      // Get player by phone (reused below).
      const player = await this.playersService.findByPhone(from);
      if (!player) {
        console.warn('[Webhook] Player not found for follow-up flow; skipping follow-up actions.', { from });
        return { success: true, message: `Message processed: ${result.action}` };
      }

      // If confirmed, create payment link
      if (result.action === 'confirmed') {
        // Find the most recent confirmed invitation for this player.
        const { data: invitations } = await this.supabase
          .from('invitations')
          .select('*')
          .eq('player_id', player.id)
          .eq('status', 'confirmed')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (invitations && invitations.length > 0) {
          const confirmedInvitation = invitations[0];
          const paymentLink = await this.paymentsService.createPaymentLink(confirmedInvitation.id);
          await this.whatsappService.sendPaymentLink(confirmedInvitation.id, paymentLink);
        } else {
          console.warn('[Webhook] No confirmed invitation found for follow-up payment link.', { playerId: player.id });
        }
      }

      // If declined, send friendly follow-up (no payment link).
      if (result.action === 'declined') {
        const { data: invitations } = await this.supabase
          .from('invitations')
          .select('*')
          .eq('player_id', player.id)
          .eq('status', 'declined')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (invitations && invitations.length > 0) {
          const declinedInvitation = invitations[0];
          await this.whatsappService.sendDeclineMessage(declinedInvitation.id);
        } else {
          console.warn('[Webhook] No declined invitation found for follow-up decline message.', { playerId: player.id });
        }
      }

      return { success: true, message: `Message processed: ${result.action}` };
    } catch (error) {
      console.error('[Webhook] Processing error:', error);
      return { success: false, message: (error as any)?.message || 'Webhook processing error' };
    }
  }
}

