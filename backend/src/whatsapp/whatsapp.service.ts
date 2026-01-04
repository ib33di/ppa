import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from '../invitations/invitations.service';
import { PlayersService } from '../players/players.service';
import { MatchesService } from '../matches/matches.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class WhatsAppService {
  private apiToken: string;
  private apiBaseUrl: string; // Base URL with instance ID included (e.g., https://api.ultramsg.com/instance157813)

  constructor(
    private configService: ConfigService,
    private invitationsService: InvitationsService,
    private playersService: PlayersService,
    private matchesService: MatchesService,
    private supabase: SupabaseService,
  ) {
    // Ultramsg.com configuration
    this.apiToken = this.configService.get<string>('ULTRAMSG_TOKEN') || '';
    
    // Get base URL (should include instance ID, e.g., https://api.ultramsg.com/instance157813)
    let apiUrl = this.configService.get<string>('ULTRAMSG_API_URL') || '';
    
    // Remove trailing slash if present for consistency
    if (apiUrl.endsWith('/')) {
      apiUrl = apiUrl.slice(0, -1);
    }
    
    // If URL doesn't include instance, try to get it from instance ID
    if (!apiUrl || apiUrl === 'https://api.ultramsg.com') {
      const instanceId = this.configService.get<string>('ULTRAMSG_INSTANCE_ID') || '';
      if (instanceId) {
        this.apiBaseUrl = `https://api.ultramsg.com/${instanceId}`;
      } else {
        this.apiBaseUrl = 'https://api.ultramsg.com';
      }
    } else {
      this.apiBaseUrl = apiUrl;
    }
  }

  /**
   * Verify Ultramsg instance status
   */
  async verifyAccount(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.apiToken || this.apiToken.trim() === '') {
        return { 
          valid: false, 
          error: 'Ultramsg token is not configured. Please set ULTRAMSG_TOKEN in environment variables.' 
        };
      }

      if (!this.apiBaseUrl || this.apiBaseUrl === 'https://api.ultramsg.com') {
        return { 
          valid: false, 
          error: 'Ultramsg API URL is not configured. Please set ULTRAMSG_API_URL with instance ID (e.g., https://api.ultramsg.com/instance157813).' 
        };
      }

      // Check instance status via Ultramsg API
      const response = await fetch(`${this.apiBaseUrl}/instance/status?token=${this.apiToken}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const error = await response.text();
        return { 
          valid: false, 
          error: `Ultramsg API error: ${error}` 
        };
      }

      const result = await response.json();
      
      // Ultramsg returns status in different formats, check for success indicators
      if (result.status === 'connected' || result.connected === true || result.instance?.status === 'open') {
        return { valid: true };
      }

      return { 
        valid: false, 
        error: `Instance is not connected. Status: ${JSON.stringify(result)}` 
      };
    } catch (error: any) {
      return { 
        valid: false, 
        error: error.message || 'Failed to verify Ultramsg instance' 
      };
    }
  }

  /**
   * Send match invitation via WhatsApp using Ultramsg.com
   */
  async sendInvitation(invitationId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if API token is configured
      if (!this.apiToken || this.apiToken.trim() === '') {
        console.error('[WhatsApp] API token is not configured');
        throw new Error('WhatsApp API token is not configured. Please set ULTRAMSG_TOKEN in environment variables.');
      }

      if (!this.apiBaseUrl || this.apiBaseUrl === 'https://api.ultramsg.com') {
        console.error('[WhatsApp] API URL is not configured');
        throw new Error('Ultramsg API URL is not configured. Please set ULTRAMSG_API_URL with instance ID (e.g., https://api.ultramsg.com/instance157813).');
      }

      console.log(`[WhatsApp] Sending invitation for invitationId: ${invitationId}`);

      // Verify instance status before sending
      const verification = await this.verifyAccount();
      if (!verification.valid) {
        console.error(`[WhatsApp] Instance verification failed: ${verification.error}`);
        throw new Error(`Instance verification failed: ${verification.error}. Please check your Ultramsg token and API URL.`);
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
      const messageText = `Hey ${player.name} 👋\n\nYou're invited to a padel match!\n\n📅 ${timeStr}\n🏟️ ${courtName}\n\nPlease confirm your attendance:`;

      // Format phone number for Ultramsg (should include country code without +)
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      console.log(`[WhatsApp] Sending message to ${phoneNumber} via Ultramsg API`);
      console.log(`[WhatsApp] API URL: ${this.apiBaseUrl}/messages/chat`);

      // Build full message with reply instructions
      const fullMessage = `${messageText}\n\nReply YES to confirm or NO to decline.`;

      // Ultramsg.com API format for sending messages
      const apiEndpoint = `${this.apiBaseUrl}/messages/chat`;
      const params = new URLSearchParams({
        token: this.apiToken,
        to: phoneNumber,
        body: fullMessage,
      });

      console.log(`[WhatsApp] Sending message via Ultramsg API...`);

      // Send via Ultramsg API
      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      console.log(`[WhatsApp] API Response Status: ${response.status}`);
      console.log(`[WhatsApp] API Response Body: ${responseText}`);

      if (!response.ok) {
        throw new Error(`Ultramsg API error (${response.status}): ${responseText}`);
      }

      let result: any;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Ultramsg API returned invalid JSON: ${responseText}`);
      }
      
      // Ultramsg returns different response formats, check for success
      if (result.sent === false || (result.error && result.error !== '')) {
        const errorMsg = result.error || result.message || 'Unknown error';
        console.error(`[WhatsApp] API returned error: ${errorMsg}`);
        throw new Error(`Ultramsg API returned error: ${errorMsg}`);
      }

      console.log(`[WhatsApp] Message sent successfully to ${player.name}`);

      // Update invitation status
      await this.invitationsService.update(invitationId, {
        status: 'invited',
        sent_at: new Date().toISOString(),
      });

      // Extract message ID from response (Ultramsg may return it in different fields)
      const messageId = result.id || result.messageId || result.message_id || result.msgid;
      return { success: true, messageId };
    } catch (error) {
      console.error('[WhatsApp] Error sending invitation:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      return { success: false, error: error.message || 'Unknown error occurred' };
    }
  }

  /**
   * Setup webhook in Ultramsg
   * Note: Ultramsg webhook setup is done via their dashboard, but this method provides instructions
   */
  async setupWebhook(webhookUrl: string, webhookToken?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!this.apiBaseUrl || this.apiBaseUrl === 'https://api.ultramsg.com') {
        throw new Error('Ultramsg API URL is not configured');
      }

      console.log('[WhatsApp] Webhook setup instructions:', {
        url: webhookUrl,
        apiBaseUrl: this.apiBaseUrl,
        instructions: 'Please configure webhook in Ultramsg dashboard: Settings > Webhook > Webhook on Received',
      });

      // Ultramsg webhook setup is typically done via dashboard
      // But we can try to set it via API if they support it
      const apiEndpoint = `${this.apiBaseUrl}/instance/webhook`;
      const params = new URLSearchParams({
        token: this.apiToken,
        webhook: webhookUrl,
      });

      try {
        const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
          method: 'POST',
        });

        if (response.ok) {
          const result = await response.json();
          console.log('[WhatsApp] Webhook setup successful via API:', result);
          return { success: true, message: 'Webhook setup successfully via API' };
        }
      } catch (apiError) {
        console.warn('[WhatsApp] API webhook setup failed, use dashboard instead:', apiError);
      }

      // If API setup fails, return instructions
      return { 
        success: true, 
        message: `Please configure webhook in Ultramsg dashboard:\n1. Go to Settings > Webhook\n2. Enable "Webhook on Received"\n3. Set webhook URL to: ${webhookUrl}` 
      };
    } catch (error: any) {
      console.error('[WhatsApp] Error setting up webhook:', error);
      return { success: false, error: error.message || 'Failed to setup webhook. Please configure it in Ultramsg dashboard.' };
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

      // Format phone number for Ultramsg
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      // Ultramsg.com API format for sending messages
      const apiEndpoint = `${this.apiBaseUrl}/messages/chat`;
      const params = new URLSearchParams({
        token: this.apiToken,
        to: phoneNumber,
        body: message,
      });

      const response = await fetch(`${apiEndpoint}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ultramsg API error: ${error}`);
      }

      const result = await response.json();
      if (result.sent === false || (result.error && result.error !== '')) {
        throw new Error(`Ultramsg API returned error: ${result.error || result.message || 'Unknown error'}`);
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
        messageType: typeof message,
        messageLength: message?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Handle undefined/null/empty message
      if (!message || typeof message !== 'string') {
        console.warn(`[WhatsApp] Invalid message received:`, { phone, message, messageType: typeof message });
        return { success: false, action: 'invalid_message' };
      }

      // Check if this is a button response (starts with yes_ or no_)
      if (message.startsWith('yes_') || message.toLowerCase().includes('yes_')) {
        console.log(`[WhatsApp] Detected button response: YES button`);
        message = 'YES';
      } else if (message.startsWith('no_') || message.toLowerCase().includes('no_')) {
        console.log(`[WhatsApp] Detected button response: NO button`);
        message = 'NO';
      }

      // Normalize message - remove extra whitespace and convert to uppercase
      const normalizedMessage = (message || '').trim().replace(/\s+/g, ' ').toUpperCase();
      console.log(`[WhatsApp] Normalized message: "${normalizedMessage}" (length: ${normalizedMessage.length})`);

      // Detect YES/NO (support Arabic and English) - simple and flexible matching
      // Extract the core word (remove punctuation and extra spaces)
      const coreMessage = normalizedMessage.replace(/[.,!?;:]/g, '').trim();
      console.log(`[WhatsApp] Core message: "${coreMessage}"`);

      // YES patterns (case-insensitive) - also check for button emoji
      const yesKeywords = ['YES', 'Y', 'SI', 'OK', 'CONFIRM', 'ACCEPT', 'نعم', 'موافق', 'أوافق', 'موافقة', '✅'];
      // NO patterns (case-insensitive) - also check for button emoji
      const noKeywords = ['NO', 'N', 'DECLINE', 'REJECT', 'CANCEL', 'لا', 'رفض', 'غير موافق', '❌'];

      let isYes = false;
      let isNo = false;

      // Check if message starts with or equals any YES keyword
      for (const keyword of yesKeywords) {
        if (coreMessage === keyword.toUpperCase() || 
            coreMessage.startsWith(keyword.toUpperCase() + ' ') ||
            coreMessage === keyword ||
            coreMessage.startsWith(keyword + ' ') ||
            coreMessage.includes(keyword.toUpperCase())) {
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
              coreMessage.startsWith(keyword + ' ') ||
              coreMessage.includes(keyword.toUpperCase())) {
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
