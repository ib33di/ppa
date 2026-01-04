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
      console.log('[Webhook] ========== INCOMING WEBHOOK ==========');
      console.log('[Webhook] Full payload:', JSON.stringify(payload, null, 2));
      console.log('[Webhook] Payload keys:', Object.keys(payload || {}));
      console.log('[Webhook] Processing WhatsApp message:', {
        from: payload?.from,
        message: payload?.message,
        text: payload?.text,
        body: payload?.body,
        content: payload?.content,
        accountId: payload?.whatsapp_account_id,
        timestamp: new Date().toISOString(),
      });

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
      let message = payload?.data?.body ||
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
      
      // Extract button/interactive data if present
      const { button_id, interactive } = payload;

      // Handle interactive button responses
      // Button responses may come as button_id or in interactive object
      let messageText = message || '';
      if (button_id) {
        // Button was clicked - extract response from button_id
        console.log('[Webhook] Button clicked:', button_id);
        if (button_id.startsWith('yes_')) {
          messageText = 'YES';
        } else if (button_id.startsWith('no_')) {
          messageText = 'NO';
        }
      } else if (interactive?.button_reply?.id) {
        // Alternative format for button responses
        const buttonId = interactive.button_reply.id;
        console.log('[Webhook] Interactive button clicked:', buttonId);
        if (buttonId.startsWith('yes_')) {
          messageText = 'YES';
        } else if (buttonId.startsWith('no_')) {
          messageText = 'NO';
        }
      } else if (interactive?.type === 'button_reply') {
        // Another format for button responses
        const buttonId = interactive.button_reply?.id || interactive.id;
        console.log('[Webhook] Button reply received:', buttonId);
        if (buttonId && buttonId.startsWith('yes_')) {
          messageText = 'YES';
        } else if (buttonId && buttonId.startsWith('no_')) {
          messageText = 'NO';
        }
      }

      // Final check: ensure we have either a message or button/interactive response
      if (!from) {
        console.error('[Webhook] Missing phone number (from field)');
        console.error('[Webhook] Payload structure:', JSON.stringify(payload, null, 2));
        return { success: false, message: 'Missing phone number (from field)' };
      }

      if (!messageText && !button_id && !interactive) {
        console.warn('[Webhook] Missing message content:', { 
          from, 
          originalMessage: message,
          messageText,
          button_id,
          interactive,
          hasFrom: !!from,
          hasMessage: !!messageText,
          payloadKeys: Object.keys(payload || {}),
          payloadStructure: JSON.stringify(payload, null, 2),
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
        console.warn(`[Webhook] Full result:`, result);
        return { success: false, message: `Processing failed: ${result.action}` };
      }

      console.log(`[Webhook] Successfully processed message. Action: ${result.action}`);

      // If confirmed, create payment link
      if (result.action === 'confirmed') {
        // Find the invitation that was just confirmed
        // Get player by phone first
        const player = await this.playersService.findByPhone(from);
        if (player) {
          // Find the most recent confirmed invitation for this player
          const { data: invitations } = await this.supabase
            .from('invitations')
            .select('*')
            .eq('player_id', player.id)
            .eq('status', 'confirmed')
            .order('updated_at', { ascending: false })
            .limit(1);

          if (invitations && invitations.length > 0) {
            const confirmedInvitation = invitations[0];
            // Create payment link (you can integrate with Stripe, PayPal, etc.)
            const paymentLink = await this.paymentsService.createPaymentLink(confirmedInvitation.id);
            
            // Send payment link via WhatsApp
            await this.whatsappService.sendPaymentLink(confirmedInvitation.id, paymentLink);
          }
        }
      }

      return { success: true, message: `Message processed: ${result.action}` };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { success: false, message: error.message };
    }
  }
}

