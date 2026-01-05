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
  private lastVerifyAt = 0;
  private lastVerifyResult: { valid: boolean; error?: string } | null = null;

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 10_000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(id);
    }
  }

  private normalizeUltraMsgBaseUrl(params: { apiUrl?: string; instanceId?: string }): string {
    const rawApiUrl = (params.apiUrl || '').trim();
    const rawInstanceId = (params.instanceId || '').trim();

    const normalizeInstanceSegment = (seg: string) => {
      const s = seg.trim().replace(/^\/+|\/+$/g, '');
      if (!s) return '';
      if (/^\d+$/.test(s)) return `instance${s}`;
      if (s.startsWith('instance')) return s;
      // If user provided something else, keep as-is; could be a named instance.
      return s;
    };

    const fallbackBase = () => {
      const instanceSeg = normalizeInstanceSegment(rawInstanceId);
      return instanceSeg ? `https://api.ultramsg.com/${instanceSeg}` : 'https://api.ultramsg.com';
    };

    if (!rawApiUrl || rawApiUrl === 'https://api.ultramsg.com' || rawApiUrl === 'https://api.ultramsg.com/') {
      return fallbackBase();
    }

    // Allow apiUrl to be provided as just "instanceXXXX" (or "157813")
    if (!rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
      const instanceSeg = normalizeInstanceSegment(rawApiUrl);
      return instanceSeg ? `https://api.ultramsg.com/${instanceSeg}` : fallbackBase();
    }

    try {
      const url = new URL(rawApiUrl);
      const segments = url.pathname.split('/').filter(Boolean);
      const instanceSeg = normalizeInstanceSegment(segments[0] || '');

      // Strip any extra path like "/messages/chat" or "/instance/status" from misconfigured URLs.
      url.pathname = instanceSeg ? `/${instanceSeg}` : '';
      url.search = '';
      url.hash = '';

      // Remove trailing slash for consistency.
      return url.toString().replace(/\/$/, '');
    } catch {
      return fallbackBase();
    }
  }

  constructor(
    private configService: ConfigService,
    private invitationsService: InvitationsService,
    private playersService: PlayersService,
    private matchesService: MatchesService,
    private supabase: SupabaseService,
  ) {
    // Ultramsg.com configuration
    this.apiToken = this.configService.get<string>('ULTRAMSG_TOKEN') || '';

    const configuredApiUrl = this.configService.get<string>('ULTRAMSG_API_URL') || '';
    const configuredInstanceId = this.configService.get<string>('ULTRAMSG_INSTANCE_ID') || '';
    this.apiBaseUrl = this.normalizeUltraMsgBaseUrl({
      apiUrl: configuredApiUrl,
      instanceId: configuredInstanceId,
    });

    if (configuredApiUrl && configuredApiUrl.trim() !== this.apiBaseUrl) {
      console.log('[WhatsApp] Normalized ULTRAMSG_API_URL:', {
        configured: configuredApiUrl.trim(),
        normalized: this.apiBaseUrl,
      });
    }
  }

  private buildInvitationBody(params: {
    playerName: string;
    dateLabel: string;
    timeLabel: string;
    courtName: string;
  }): string {
    const { playerName, dateLabel, timeLabel, courtName } = params;

    // Plain-text invitation message (no interactive buttons).
    return `Hey ${playerName} 👋\n\nYou're invited to a padel match!\n\n📅 ${dateLabel} ${timeLabel}\n🏟️ ${courtName}\n\nPlease confirm your attendance:\n\nReply YES to confirm\nReply NO to decline`;
  }

  private async sendUltraMsgChat(to: string, body: string) {
    const apiEndpoint = `${this.apiBaseUrl}/messages/chat`;
    const params = new URLSearchParams({
      token: this.apiToken,
      to,
      body,
    });

    const response = await this.fetchWithTimeout(`${apiEndpoint}?${params.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, 15_000);
    const responseText = await response.text();
    return { response, responseText };
  }

  /**
   * Send interactive buttons via UltraMsg (legacy).
   * NOTE: We intentionally do NOT use interactive buttons in production flow.
   */
  private async sendUltraMsgButtons(to: string, body: string) {
    const buttonsJson = JSON.stringify([
      { id: 'CONFIRM_YES', text: 'YES' },
      { id: 'CONFIRM_NO', text: 'NO' },
    ]);

    const candidatePaths = ['/messages/button', '/messages/buttons'];
    let lastError: { status?: number; body?: string; path?: string } | null = null;

    for (const path of candidatePaths) {
      const apiEndpoint = `${this.apiBaseUrl}${path}`;
      const params = new URLSearchParams({
        token: this.apiToken,
        to,
        body,
        buttons: buttonsJson,
      });

      const response = await this.fetchWithTimeout(`${apiEndpoint}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }, 15_000);

      const responseText = await response.text();

      // Some UltraMsg plans return HTTP 200 with an error JSON (e.g., {"error":"Path not found..."}).
      // Only treat as success if response JSON indicates the message was sent.
      if (response.ok) {
        try {
          const parsed = JSON.parse(responseText);
          const isError = !!(parsed?.error && String(parsed.error).trim() !== '');
          const isSent =
            parsed?.sent === true ||
            parsed?.success === true ||
            typeof parsed?.id === 'string' ||
            typeof parsed?.messageId === 'string' ||
            typeof parsed?.message_id === 'string';

          if (!isError && isSent) {
            return { ok: true as const, path, responseText };
          }
        } catch {
          // Fall through to treat as failure; we'll try next candidate or fallback to chat.
        }
      }

      lastError = { status: response.status, body: responseText, path };
    }

    return { ok: false as const, lastError };
  }

  /**
   * Verify Ultramsg instance status
   */
  async verifyAccount(opts?: { force?: boolean; cacheMs?: number }): Promise<{ valid: boolean; error?: string }> {
    try {
      const cacheMs = typeof opts?.cacheMs === 'number' ? opts.cacheMs : 30_000;
      const force = opts?.force === true;
      const now = Date.now();
      if (!force && this.lastVerifyResult && now - this.lastVerifyAt < cacheMs) {
        return this.lastVerifyResult;
      }

      if (!this.apiToken || this.apiToken.trim() === '') {
        const res = {
          valid: false, 
          error: 'Ultramsg token is not configured. Please set ULTRAMSG_TOKEN in environment variables.' 
        };
        this.lastVerifyAt = now;
        this.lastVerifyResult = res;
        return res;
      }

      if (!this.apiBaseUrl || this.apiBaseUrl === 'https://api.ultramsg.com') {
        const res = {
          valid: false, 
          error: 'Ultramsg API URL is not configured. Please set ULTRAMSG_API_URL with instance ID (e.g., https://api.ultramsg.com/instance157813).' 
        };
        this.lastVerifyAt = now;
        this.lastVerifyResult = res;
        return res;
      }

      // Check instance status via Ultramsg API
      const response = await this.fetchWithTimeout(`${this.apiBaseUrl}/instance/status?token=${this.apiToken}`, {
        method: 'GET',
      }, 10_000);

      if (!response.ok) {
        const error = await response.text();
        const res = {
          valid: false, 
          error: `Ultramsg API error: ${error}` 
        };
        this.lastVerifyAt = now;
        this.lastVerifyResult = res;
        return res;
      }

      const result = await response.json();
      
      console.log('[WhatsApp] Instance status response:', JSON.stringify(result, null, 2));
      
      // Ultramsg returns status in different formats, check for success indicators
      // Format 1: { status: "connected" } or { connected: true }
      // Format 2: { status: { accountStatus: { status: "authenticated", substatus: "connected" } } }
      // Format 3: { instance: { status: "open" } }
      const isConnected = 
        result.status === 'connected' || 
        result.connected === true || 
        result.instance?.status === 'open' ||
        (result.status?.accountStatus?.status === 'authenticated' && 
         (result.status?.accountStatus?.substatus === 'connected' || 
          result.status?.accountStatus?.substatus === 'authenticated')) ||
        result.status?.accountStatus?.substatus === 'connected';
      
      if (isConnected) {
        console.log('[WhatsApp] Instance is connected and ready');
        const res = { valid: true };
        this.lastVerifyAt = now;
        this.lastVerifyResult = res;
        return res;
      }

      const res = {
        valid: false, 
        error: `Instance is not connected. Status: ${JSON.stringify(result)}` 
      };
      this.lastVerifyAt = now;
      this.lastVerifyResult = res;
      return res;
    } catch (error: any) {
      const res = {
        valid: false, 
        error: error.message || 'Failed to verify Ultramsg instance' 
      };
      this.lastVerifyAt = Date.now();
      this.lastVerifyResult = res;
      return res;
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
      const dateLabel = scheduledTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const timeLabel = scheduledTime.toLocaleTimeString('en-US', {
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
      const messageText = this.buildInvitationBody({
        playerName: player.name,
        dateLabel,
        timeLabel,
        courtName,
      });

      // Format phone number for Ultramsg (should include country code without +)
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      console.log(`[WhatsApp] Sending message to ${phoneNumber} via Ultramsg API`);
      console.log(`[WhatsApp] API URL base: ${this.apiBaseUrl}`);

      // Plain-text only (no buttons).
      const chatResult = await this.sendUltraMsgChat(phoneNumber, messageText);
      const responseText = chatResult.responseText;
      const responseStatus = chatResult.response.status;
      if (!chatResult.response.ok) {
        throw new Error(`Ultramsg API error (${chatResult.response.status}): ${chatResult.responseText}`);
      }

      console.log(`[WhatsApp] API Response Status: ${responseStatus}`);
      console.log(`[WhatsApp] API Response Body: ${responseText}`);

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
  async setupWebhook(webhookUrl: string, _webhookToken?: string): Promise<{ success: boolean; message?: string; error?: string }> {
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
        const response = await this.fetchWithTimeout(`${apiEndpoint}?${params.toString()}`, {
          method: 'POST',
        }, 10_000);

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
      const message = `You're confirmed! 🎉\n\nTo secure your spot, please complete payment using the link below:\n\n💳 ${paymentLink}\n\nSee you on court! 💪🎾`;

      // Format phone number for Ultramsg
      const phoneNumber = player.phone.replace(/^\+/, '').replace(/\s/g, '');

      // Ultramsg.com API format for sending messages
      const apiEndpoint = `${this.apiBaseUrl}/messages/chat`;
      const params = new URLSearchParams({
        token: this.apiToken,
        to: phoneNumber,
        body: message,
      });

      const response = await this.fetchWithTimeout(`${apiEndpoint}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }, 15_000);

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
   * Send friendly decline message (no payment link).
   */
  async sendDeclineMessage(invitationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await this.invitationsService.findOne(invitationId);
      if (!invitation || !invitation.player) {
        throw new Error('Invitation or player not found');
      }

      const player = invitation.player;
      const message = `No worries at all 😊\n\nThanks for letting us know.\nWe’ll catch you in the next match soon! 🎾`;

      const phoneNumber = String(player.phone || '').replace(/^\+/, '').replace(/\s/g, '');
      const chatResult = await this.sendUltraMsgChat(phoneNumber, message);
      if (!chatResult.response.ok) {
        throw new Error(`Ultramsg API error (${chatResult.response.status}): ${chatResult.responseText}`);
      }
      return { success: true };
    } catch (error: any) {
      console.error('[WhatsApp] Error sending decline message:', error);
      return { success: false, error: error?.message || 'Unknown error occurred' };
    }
  }

  private parseDecision(rawMessage: string | null | undefined): 'YES' | 'NO' | null {
    if (!rawMessage || typeof rawMessage !== 'string') return null;
    const normalized = rawMessage.trim().toUpperCase();
    if (!normalized) return null;

    // Allow trivial trailing punctuation while keeping matching strict.
    const stripped = normalized.replace(/[.!?,;:،؟]/g, '').trim().toUpperCase();

    const yes = new Set(['YES', 'Y', 'نعم']);
    const no = new Set(['NO', 'N', 'لا']);

    if (yes.has(normalized) || yes.has(stripped)) return 'YES';
    if (no.has(normalized) || no.has(stripped)) return 'NO';
    return null;
  }

  private safeMessagePreview(input: any, maxLen = 160): string {
    const s = typeof input === 'string' ? input : String(input ?? '');
    const trimmed = s.trim();
    if (trimmed.length <= maxLen) return trimmed;
    return `${trimmed.slice(0, maxLen)}…`;
  }

  /**
   * Process incoming WhatsApp message (YES/NO detection).
   */
  async processIncomingMessage(
    phone: string,
    message: string,
  ): Promise<{ success: boolean; action?: string; invitationId?: string }> {
    try {
      console.log(`[WhatsApp] ========== PROCESSING INCOMING MESSAGE ==========`);
      console.log(`[WhatsApp] Processing incoming message:`, {
        phone,
        messagePreview: this.safeMessagePreview(message),
        messageType: typeof message,
        messageLength: message?.length || 0,
        timestamp: new Date().toISOString(),
      });

      // Handle undefined/null/empty message
      if (!message || typeof message !== 'string') {
        console.warn(`[WhatsApp] Invalid message received:`, { phone, message, messageType: typeof message });
        return { success: false, action: 'invalid_message' };
      }

      // Backward compatibility: map legacy interactive button IDs to YES/NO.
      if (message === 'CONFIRM_YES') {
        console.log(`[WhatsApp] Detected button response: CONFIRM_YES`);
        message = 'YES';
      } else if (message === 'CONFIRM_NO') {
        console.log(`[WhatsApp] Detected button response: CONFIRM_NO`);
        message = 'NO';
      }

      // Normalize incoming message text:
      // - trim spaces
      // - uppercase
      // Accept only: YES, Y, نعم, NO, N, لا
      const normalizedMessage = (message || '').trim().toUpperCase();
      const decision = this.parseDecision(message);
      console.log(`[WhatsApp] Parsed decision:`, {
        normalizedMessage,
        decision,
      });

      if (!decision) {
        console.log(`[WhatsApp] Ignoring unrelated message`, { normalizedMessage });
        return { success: true, action: 'ignored' };
      }

      // Find player by phone (normalize phone number)
      const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '').replace(/-/g, '');
      console.log(`[WhatsApp] Searching for player with phone:`, {
        original: phone,
        normalized: normalizedPhone,
      });

      // Try finding player with multiple phone formats
      let player = await this.playersService.findByPhone(phone);
      
      if (!player) {
        console.log(`[WhatsApp] Player not found with original phone, trying normalized...`);
        player = await this.playersService.findByPhone(normalizedPhone);
      }
      
      if (!player) {
        console.log(`[WhatsApp] Player not found with normalized phone, trying with + prefix...`);
        player = await this.playersService.findByPhone(`+${normalizedPhone}`);
      }

      if (!player) {
        console.error(`[WhatsApp] ❌ Player not found for phone: ${phone} (normalized: ${normalizedPhone})`);
        console.error(`[WhatsApp] Tried formats:`, [phone, normalizedPhone, `+${normalizedPhone}`]);
        
        // Log all players for debugging
        try {
          const { data: allPlayers } = await this.supabase
            .from('players')
            .select('id, name, phone')
            .limit(10);
          console.error(`[WhatsApp] Sample players in database:`, allPlayers);
        } catch (err) {
          console.error(`[WhatsApp] Error fetching players for debugging:`, err);
        }
        
        return { success: false, action: 'player_not_found' };
      }

      console.log(`[WhatsApp] Found player:`, {
        id: player.id,
        name: player.name,
        phone: player.phone,
      });

      return this.processPlayerResponse(player, decision === 'YES');
    } catch (error) {
      console.error('[WhatsApp] Error processing incoming message:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      return { success: false, action: 'error' };
    }
  }

  private async processPlayerResponse(
    player: any,
    isYes: boolean,
  ): Promise<{ success: boolean; action?: string; invitationId?: string }> {
    console.log(`[WhatsApp] ========== PROCESSING PLAYER RESPONSE ==========`);
    console.log(`[WhatsApp] Processing response for player ${player.name} (${player.phone}): ${isYes ? 'YES ✅' : 'NO ❌'}`);
    console.log(`[WhatsApp] Player ID: ${player.id}`);
    
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
      console.error('[WhatsApp] ❌ Error fetching invitations:', invitationsError);
      console.error('[WhatsApp] Error details:', JSON.stringify(invitationsError, null, 2));
      return { success: false, action: 'error' };
    }

    console.log(`[WhatsApp] Found ${invitations?.length || 0} pending/invited invitation(s) for player ${player.name}`);
    if (invitations && invitations.length > 0) {
      console.log(`[WhatsApp] Invitation details:`, {
        id: invitations[0].id,
        matchId: invitations[0].match_id,
        status: invitations[0].status,
        createdAt: invitations[0].created_at,
      });
    }

    if (!invitations || invitations.length === 0) {
      // Check if there are any invitations at all for this player
      const { data: allInvitations } = await this.supabase
        .from('invitations')
        .select('id, status, created_at, match_id')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      console.warn(`[WhatsApp] ⚠️ No pending invitation found for player ${player.name}`);
      console.warn(`[WhatsApp] All invitations for this player:`, JSON.stringify(allInvitations, null, 2));
      return { success: false, action: 'no_pending_invitation' };
    }

    const invitation = invitations[0];
    const newStatus = isYes ? 'confirmed' : 'declined';

    console.log(`[WhatsApp] ========== UPDATING INVITATION ==========`);
    console.log(`[WhatsApp] Updating invitation ${invitation.id} to status: ${newStatus}`, {
      invitationId: invitation.id,
      matchId: invitation.match_id,
      currentStatus: invitation.status,
      newStatus,
      isYes,
    });

    // Update invitation status with responded_at timestamp
    try {
      const updateData = {
        status: newStatus,
        responded_at: new Date().toISOString(),
      };
      
      console.log(`[WhatsApp] Update data:`, JSON.stringify(updateData, null, 2));
      
      const updateResult = await this.invitationsService.update(invitation.id, updateData);
      
      console.log(`[WhatsApp] ✅ Successfully updated invitation ${invitation.id} to ${newStatus}`);
      console.log(`[WhatsApp] Update result:`, JSON.stringify(updateResult, null, 2));
      
      // Update match confirmed count
      console.log(`[WhatsApp] Updating confirmed count for match ${invitation.match_id}...`);
      await this.matchesService.updateConfirmedCount(invitation.match_id);
      console.log(`[WhatsApp] ✅ Updated confirmed count for match ${invitation.match_id}`);
      
      console.log(`[WhatsApp] ========== RESPONSE PROCESSED SUCCESSFULLY ==========`);
      return { success: true, action: newStatus, invitationId: invitation.id };
    } catch (error) {
      console.error('[WhatsApp] ❌ Error updating invitation:', error);
      console.error('[WhatsApp] Error stack:', error.stack);
      console.error('[WhatsApp] Error details:', JSON.stringify(error, null, 2));
      return { success: false, action: 'error' };
    }
  }
}
