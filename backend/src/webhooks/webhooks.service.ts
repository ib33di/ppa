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
      console.log('[Webhook] Processing WhatsApp message:', {
        from: payload.from,
        message: payload.message,
        accountId: payload.whatsapp_account_id,
        timestamp: new Date().toISOString(),
      });

      const { from, message, whatsapp_account_id } = payload;

      if (!from || !message) {
        console.warn('[Webhook] Missing required fields:', { from, message });
        return { success: false, message: 'Missing required fields' };
      }

      // Process incoming message (detects YES/NO)
      // Note: AdWhats sends phone number without + prefix (e.g., "966512345678")
      const result = await this.whatsappService.processIncomingMessage(from, message);

      if (!result.success) {
        return { success: false, message: `Processing failed: ${result.action}` };
      }

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

