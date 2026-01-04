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
   * Expected payload structure (based on Ultramsg API):
   * {
   *   "instance": "instance_id",
   *   "from": "966512345678",
   *   "body": "YES",
   *   "type": "chat"
   * }
   * Or alternative format:
   * {
   *   "data": {
   *     "from": "966512345678",
   *     "body": "YES"
   *   }
   * }
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

      // Extract phone number from various possible fields (Ultramsg format)
      const from = payload?.from || 
                    payload?.data?.from || 
                    payload?.phone || 
                    payload?.phone_number || 
                    payload?.sender || 
                    payload?.wa_id ||
                    null;
      
      // Extract message text from various possible fields (Ultramsg uses "body")
      // Ultramsg typically sends: { from: "...", body: "...", type: "chat" }
      let message = payload?.body || 
                    payload?.data?.body ||
                    payload?.message || 
                    payload?.text || 
                    payload?.content || 
                    payload?.data?.message ||
                    payload?.data?.text ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body ||
                    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.body ||
                    null;

      // Extract instance ID if present (for verification)
      const instanceId = payload?.instance || payload?.data?.instance || null;
      
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
      console.log('[Webhook] Calling processIncomingMessage...');
      console.log('[Webhook] Parameters:', { from, message: messageText, originalMessage: message });
      const result = await this.whatsappService.processIncomingMessage(from, messageText);
      console.log('[Webhook] processIncomingMessage result:', JSON.stringify(result, null, 2));

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

