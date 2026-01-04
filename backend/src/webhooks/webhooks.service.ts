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
   * Handle incoming WhatsApp webhook from AdWhats
   * Expected payload structure (based on AdWhats API):
   * {
   *   "whatsapp_account_id": 1,
   *   "from": "966512345678",
   *   "message": "YES"
   * }
   */
  async handleWhatsAppWebhook(payload: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('[Webhook] ========== INCOMING WEBHOOK ==========');
      console.log('[Webhook] Full payload:', JSON.stringify(payload, null, 2));
      console.log('[Webhook] Processing WhatsApp message:', {
        from: payload.from,
        message: payload.message,
        accountId: payload.whatsapp_account_id,
        timestamp: new Date().toISOString(),
      });

      const { from, message, whatsapp_account_id, button_id, interactive } = payload;

      // Handle interactive button responses
      // Button responses may come as button_id or in interactive object
      let messageText = message;
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

      if (!from || (!messageText && !button_id && !interactive)) {
        console.warn('[Webhook] Missing required fields:', { 
          from, 
          message,
          messageText,
          button_id,
          interactive,
          hasFrom: !!from,
          hasMessage: !!messageText,
          payloadKeys: Object.keys(payload),
        });
        return { success: false, message: 'Missing required fields' };
      }

      // Process incoming message (detects YES/NO)
      // Note: AdWhats sends phone number without + prefix (e.g., "966512345678")
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

