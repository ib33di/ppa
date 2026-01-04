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
      if (!this.apiToken || this.apiToken.trim() === '') {
        throw new Error('AdWhats API token is not configured');
      }

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
      console.error('[WhatsApp] Error fetching WhatsApp accounts:', error);
      throw error;
    }
  }

  /**
   * Verify API token and account permissions
   */
  async verifyAccount(): Promise<{ valid: boolean; error?: string; accounts?: any[] }> {
    try {
      const accountsResult = await this.getAccounts();
      
      if (accountsResult.status !== 'success') {
        return { 
          valid: false, 
          error: accountsResult.message || 'Failed to verify account' 
        };
      }

      const accounts = accountsResult.data?.records || [];
      
      // Check if the configured account ID exists
      const accountExists = accounts.some((acc: any) => acc.id === this.whatsappAccountId);
      
      if (!accountExists) {
        return { 
          valid: false, 
          error: `Account ID ${this.whatsappAccountId} not found. Available accounts: ${accounts.map((a: any) => a.id).join(', ')}`,
          accounts 
        };
      }

      // Check if account is ready
      const account = accounts.find((acc: any) => acc.id === this.whatsappAccountId);
      if (!account.ready) {
        return { 
          valid: false, 
          error: `Account ID ${this.whatsappAccountId} is not ready. Please check your AdWhats dashboard.`,
          accounts 
        };
      }

      return { valid: true, accounts };
    } catch (error: any) {
      return { 
        valid: false, 
        error: error.message || 'Failed to verify account permissions' 
      };
    }
  }

  /**
   * Send match invitation via WhatsApp
   */
  async sendInvitation(invitationId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if API token is configured
      if (!this.apiToken || this.apiToken.trim() === '') {
        console.error('[WhatsApp] API token is not configured');
        throw new Error('WhatsApp API token is not configured. Please set ADWHATS_API_TOKEN in environment variables.');
      }

      console.log(`[WhatsApp] Sending invitation for invitationId: ${invitationId}`);

      // Verify account permissions before sending
      const verification = await this.verifyAccount();
      if (!verification.valid) {
        console.error(`[WhatsApp] Account verification failed: ${verification.error}`);
        throw new Error(`Account verification failed: ${verification.error}. Please check your AdWhats API token and account ID.`);
      }

      // Get invitation with match and player details
      const invitation = await this.invitationsService.findOne(invitationId);
      if (!invitation) {
        console.error(`[WhatsApp] Invitation not found: ${invitationId}`);
        throw new Error('Invitation not found');
      }

      // Get match details
      const matchData = await this.matchesService.findOne(invitation.match_id);
      if (!matchData) {
        console.error(`[WhatsApp] Match not found: ${invitation.match_id}`);
        throw new Error('Match not found');
      }

      // Get player details
      const playerData = await this.playersService.findOne(invitation.player_id);
      if (!playerData) {
        console.error(`[WhatsApp] Player not found: ${invitation.player_id}`);
        throw new Error('Player not found');
      }

      const match = matchData;
      const player = playerData;

      console.log(`[WhatsApp] Sending to player: ${player.name} (${player.phone})`);

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
      const { data: courtData, error: courtError } = await this.supabase
        .from('courts')
        .select('name')
        .eq('id', match.court_id)
        .single();

      if (courtError) {
        console.warn(`[WhatsApp] Error fetching court: ${courtError.message}`);
      }

      const courtName = courtData?.name || 'Court';

      // Build invitation message
      const message = `Hey ${player.name} 👋\n\nYou're invited to a padel match!\n\n📅 ${timeStr}\n🏟️ ${courtName}\n\nReply YES to confirm or NO to decline.`;

      // Format phone number (remove + and ensure proper format)
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      console.log(`[WhatsApp] Sending message to ${phoneNumber} via AdWhats API`);
      console.log(`[WhatsApp] API URL: ${this.apiUrl}/messages/send`);
      console.log(`[WhatsApp] Account ID: ${this.whatsappAccountId}`);

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

      const responseText = await response.text();
      console.log(`[WhatsApp] API Response Status: ${response.status}`);
      console.log(`[WhatsApp] API Response Body: ${responseText}`);

      if (!response.ok) {
        throw new Error(`AdWhats API error (${response.status}): ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, treat it as error
        throw new Error(`AdWhats API returned invalid JSON: ${responseText}`);
      }
      
      // AdWhats API returns { status: "success" } on success
      if (result.status !== 'success') {
        const errorMsg = result.message || result.error || 'Unknown error';
        console.error(`[WhatsApp] API returned error: ${errorMsg}`);
        
        // Provide helpful error messages for common issues
        let helpfulError = errorMsg;
        if (errorMsg.includes('permissions') || errorMsg.includes('permission')) {
          helpfulError = `${errorMsg}. Please verify: 1) Your API token is valid and has send message permissions, 2) Account ID ${this.whatsappAccountId} exists and is active, 3) Your AdWhats account has the required permissions.`;
        }
        
        throw new Error(`AdWhats API returned error: ${helpfulError}`);
      }

      console.log(`[WhatsApp] Message sent successfully to ${player.name}`);

      // Update invitation status
      await this.invitationsService.update(invitationId, {
        status: 'invited',
        sent_at: new Date().toISOString(),
      });

      return { success: true, messageId: result.message_id || result.id };
    } catch (error) {
      console.error('[WhatsApp] Error sending invitation:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      return { success: false, error: error.message || 'Unknown error occurred' };
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
      console.log(`[WhatsApp] Processing incoming message:`, {
        phone,
        message,
        messageLength: message.length,
        timestamp: new Date().toISOString(),
      });

      // Normalize message - remove extra whitespace and convert to uppercase
      const normalizedMessage = message.trim().replace(/\s+/g, ' ').toUpperCase();
      console.log(`[WhatsApp] Normalized message: "${normalizedMessage}" (length: ${normalizedMessage.length})`);

      // Detect YES/NO (support Arabic and English) - simple and flexible matching
      // Extract the core word (remove punctuation and extra spaces)
      const coreMessage = normalizedMessage.replace(/[.,!?;:]/g, '').trim();
      console.log(`[WhatsApp] Core message: "${coreMessage}"`);

      // YES patterns (case-insensitive)
      const yesKeywords = ['YES', 'Y', 'SI', 'OK', 'CONFIRM', 'ACCEPT', 'نعم', 'موافق', 'أوافق', 'موافقة'];
      // NO patterns (case-insensitive)
      const noKeywords = ['NO', 'N', 'DECLINE', 'REJECT', 'CANCEL', 'لا', 'رفض', 'غير موافق'];

      let isYes = false;
      let isNo = false;

      // Check if message starts with or equals any YES keyword
      for (const keyword of yesKeywords) {
        if (coreMessage === keyword.toUpperCase() || 
            coreMessage.startsWith(keyword.toUpperCase() + ' ') ||
            coreMessage === keyword ||
            coreMessage.startsWith(keyword + ' ')) {
          isYes = true;
          console.log(`[WhatsApp] Matched YES keyword: "${keyword}"`);
          break;
        }
      }

      // Check if message starts with or equals any NO keyword
      if (!isYes) {
        for (const keyword of noKeywords) {
          if (coreMessage === keyword.toUpperCase() || 
              coreMessage.startsWith(keyword.toUpperCase() + ' ') ||
              coreMessage === keyword ||
              coreMessage.startsWith(keyword + ' ')) {
            isNo = true;
            console.log(`[WhatsApp] Matched NO keyword: "${keyword}"`);
            break;
          }
        }
      }

      console.log(`[WhatsApp] Message detection result:`, {
        isYes,
        isNo,
        normalizedMessage,
      });

      if (!isYes && !isNo) {
        console.warn(`[WhatsApp] Unknown message format: "${message}"`);
        return { success: false, action: 'unknown' };
      }

      // Find player by phone (normalize phone number)
      const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '').replace(/-/g, '');
      console.log(`[WhatsApp] Searching for player with phone:`, {
        original: phone,
        normalized: normalizedPhone,
      });

      let player = await this.playersService.findByPhone(normalizedPhone);
      
      if (!player) {
        console.log(`[WhatsApp] Player not found with normalized phone, trying with + prefix...`);
        // Try with + prefix
        player = await this.playersService.findByPhone(`+${normalizedPhone}`);
      }

      if (!player) {
        console.error(`[WhatsApp] Player not found for phone: ${phone} (normalized: ${normalizedPhone})`);
        return { success: false, action: 'player_not_found' };
      }

      console.log(`[WhatsApp] Found player:`, {
        id: player.id,
        name: player.name,
        phone: player.phone,
      });

      return this.processPlayerResponse(player, isYes);
    } catch (error) {
      console.error('[WhatsApp] Error processing incoming message:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      return { success: false, action: 'error' };
    }
  }

  private async processPlayerResponse(player: any, isYes: boolean): Promise<{ success: boolean; action?: string }> {
    console.log(`[WhatsApp] Processing response for player ${player.name} (${player.phone}): ${isYes ? 'YES' : 'NO'}`);
    
    // Find pending invitation for this player
    console.log(`[WhatsApp] Searching for pending/invited invitations for player ${player.id}...`);
    
    const { data: invitations, error: invitationsError } = await this.supabase
      .from('invitations')
      .select('*')
      .eq('player_id', player.id)
      .in('status', ['pending', 'invited'])
      .order('created_at', { ascending: false })
      .limit(1);

    if (invitationsError) {
      console.error('[WhatsApp] Error fetching invitations:', invitationsError);
      console.error('[WhatsApp] Error details:', JSON.stringify(invitationsError, null, 2));
      return { success: false, action: 'error' };
    }

    console.log(`[WhatsApp] Found ${invitations?.length || 0} pending/invited invitation(s) for player ${player.name}`);

    if (!invitations || invitations.length === 0) {
      // Check if there are any invitations at all for this player
      const { data: allInvitations } = await this.supabase
        .from('invitations')
        .select('id, status, created_at')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.warn(`[WhatsApp] No pending invitation found for player ${player.name}`);
      console.warn(`[WhatsApp] All invitations for this player:`, allInvitations);
      return { success: false, action: 'no_pending_invitation' };
    }

    const invitation = invitations[0];
    const newStatus = isYes ? 'confirmed' : 'declined';

    console.log(`[WhatsApp] Updating invitation ${invitation.id} to status: ${newStatus}`, {
      invitationId: invitation.id,
      matchId: invitation.match_id,
      currentStatus: invitation.status,
      newStatus,
    });

    // Update invitation status with responded_at timestamp
    try {
      const updateResult = await this.invitationsService.update(invitation.id, {
        status: newStatus,
        responded_at: new Date().toISOString(),
      });
      
      console.log(`[WhatsApp] Successfully updated invitation ${invitation.id} to ${newStatus}`, {
        updateResult,
      });
      
      // Update match confirmed count
      console.log(`[WhatsApp] Updating confirmed count for match ${invitation.match_id}...`);
      await this.matchesService.updateConfirmedCount(invitation.match_id);
      console.log(`[WhatsApp] Updated confirmed count for match ${invitation.match_id}`);
      
      return { success: true, action: newStatus };
    } catch (error) {
      console.error('[WhatsApp] Error updating invitation:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      console.error('[WhatsApp] Error details:', JSON.stringify(error, null, 2));
      return { success: false, action: 'error' };
    }
  }
}
