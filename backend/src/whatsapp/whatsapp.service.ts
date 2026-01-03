import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from '../invitations/invitations.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from '../matches/matches.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WhatsAppService {
  private apiToken: string;
  private apiUrl: string;
  private whatsappAccountId: number;

  constructor(
    private configService: ConfigService,
    private invitationsService: InvitationsService,
    private playersService: PlayersService,
    private matchesService: MatchesService,
    private supabase: SupabaseService,
  ) {
    this.apiToken = this.configService.get<string>('ADWHATS_API_TOKEN') || '';
    this.apiUrl = this.configService.get<string>('ADWHATS_API_URL') || 'https://api.adwhats.net';
    this.whatsappAccountId = parseInt(this.configService.get<string>('ADWHATS_ACCOUNT_ID') || '1');
  }

  /**
   * Get WhatsApp accounts (to verify account ID)
   */
  async getAccounts(): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/accounts`, {
        method: 'GET',
        headers: {
          'token': this.apiToken,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AdWhats API error: ${error}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error fetching WhatsApp accounts:', error);
      throw error;
    }
  }

  /**
   * Send match invitation via WhatsApp
   */
  async sendInvitation(invitationId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Get invitation with match and player details
      const invitation = await this.invitationsService.findOne(invitationId);
      if (!invitation) {
        throw new Error('Invitation not found');
      }

      // Get match details
      const matchData = await this.matchesService.findOne(invitation.match_id);
      if (!matchData) {
        throw new Error('Match not found');
      }

      // Get player details
      const playerData = await this.playersService.findOne(invitation.player_id);
      if (!playerData) {
        throw new Error('Player not found');
      }

      const match = matchData;
      const player = playerData;

      // Format scheduled time
      const scheduledTime = new Date(match.scheduled_time);
      const timeStr = scheduledTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Get court name
      const { data: courtData } = await this.supabase
        .from('courts')
        .select('name')
        .eq('id', match.court_id)
        .single();

      const courtName = courtData?.name || 'Court';

      // Build invitation message
      const message = `Hey ${player.name} 👋\n\nYou're invited to a padel match!\n\n📅 ${timeStr}\n🏟️ ${courtName}\n\nReply YES to confirm or NO to decline.`;

      // Format phone number (remove + and ensure proper format)
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      // Send via AdWhats API
      const response = await fetch(`${this.apiUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'token': this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp_account_id: this.whatsappAccountId,
          to: phoneNumber,
          message: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AdWhats API error: ${error}`);
      }

      const result = await response.json();
      
      // AdWhats API returns { status: "success" } on success
      if (result.status !== 'success') {
        throw new Error(`AdWhats API returned error: ${result.message || 'Unknown error'}`);
      }

      // Update invitation status
      await this.invitationsService.update(invitationId, {
        status: 'invited',
        sent_at: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending WhatsApp invitation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send payment link after confirmation
   */
  async sendPaymentLink(invitationId: string, paymentLink: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await this.invitationsService.findOne(invitationId);
      if (!invitation || !invitation.player) {
        throw new Error('Invitation or player not found');
      }

      const player = invitation.player;
      const message = `Great! Your seat is confirmed. Please complete payment:\n\n${paymentLink}\n\nThank you! 🎾`;

      // Format phone number
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      const response = await fetch(`${this.apiUrl}/messages/send`, {
        method: 'POST',
        headers: {
          'token': this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          whatsapp_account_id: this.whatsappAccountId,
          to: phoneNumber,
          message: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`AdWhats API error: ${error}`);
      }

      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(`AdWhats API returned error: ${result.message || 'Unknown error'}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending payment link:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process incoming WhatsApp message (YES/NO detection)
   */
  async processIncomingMessage(phone: string, message: string): Promise<{ success: boolean; action?: string }> {
    try {
      // Normalize message
      const normalizedMessage = message.trim().toUpperCase();

      // Detect YES/NO (support Arabic and English)
      const isYes = /^(YES|Y|SI|OK|CONFIRM|ACCEPT|نعم|موافق|أوافق|موافقة)$/i.test(normalizedMessage);
      const isNo = /^(NO|N|DECLINE|REJECT|CANCEL|لا|رفض|غير موافق)$/i.test(normalizedMessage);

      if (!isYes && !isNo) {
        return { success: false, action: 'unknown' };
      }

      // Find player by phone (normalize phone number)
      const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '');
      const player = await this.playersService.findByPhone(normalizedPhone);
      
      if (!player) {
        // Try with + prefix
        const playerWithPlus = await this.playersService.findByPhone(`+${normalizedPhone}`);
        if (!playerWithPlus) {
          return { success: false, action: 'player_not_found' };
        }
        return this.processPlayerResponse(playerWithPlus, isYes);
      }

      return this.processPlayerResponse(player, isYes);
    } catch (error) {
      console.error('Error processing incoming message:', error);
      return { success: false, action: 'error' };
    }
  }

  private async processPlayerResponse(player: any, isYes: boolean): Promise<{ success: boolean; action?: string }> {
    // Find pending invitation for this player
    const { data: invitations } = await this.supabase
      .from('invitations')
      .select('*')
      .eq('player_id', player.id)
      .in('status', ['pending', 'invited'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (!invitations || invitations.length === 0) {
      return { success: false, action: 'no_pending_invitation' };
    }

    const invitation = invitations[0];
    const newStatus = isYes ? 'confirmed' : 'declined';

    // Update invitation status
    await this.invitationsService.update(invitation.id, {
      status: newStatus,
    });

    return { success: true, action: newStatus };
  }
}
