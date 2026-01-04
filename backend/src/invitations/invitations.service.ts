import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { UpdateInvitationDto } from './dto/update-invitation.dto';
import { MatchesService } from '../matches/matches.service';

@Injectable()
export class InvitationsService {
  constructor(
    private supabase: SupabaseService,
    @Inject(forwardRef(() => MatchesService))
    private matchesService: MatchesService,
  ) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('invitations')
      .select(`
        *,
        match:matches(*),
        player:players(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findByMatch(matchId: string) {
    const { data, error } = await this.supabase
      .from('invitations')
      .select(`
        *,
        player:players(*)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('invitations')
      .select(`
        *,
        match:matches(*),
        player:players(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createInvitationDto: CreateInvitationDto) {
    const { data, error } = await this.supabase
      .from('invitations')
      .insert(createInvitationDto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createBatch(invitations: CreateInvitationDto[]) {
    const { data, error } = await this.supabase
      .from('invitations')
      .insert(invitations)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Ensure invitations exist for (match_id, player_id) pairs.
   * Returns the resulting invitation rows (existing + newly created).
   */
  async ensureInvitations(matchId: string, playerIds: string[]) {
    if (!matchId) throw new Error('match_id is required');
    if (!Array.isArray(playerIds) || playerIds.length === 0) throw new Error('player_ids is required');

    const { data: existing, error: existingError } = await this.supabase
      .from('invitations')
      .select('*')
      .eq('match_id', matchId)
      .in('player_id', playerIds);

    if (existingError) throw existingError;
    const existingByPlayer = new Map<string, any>((existing || []).map((i: any) => [i.player_id, i]));

    const toCreate = playerIds
      .filter((pid) => !existingByPlayer.has(pid))
      .map((pid) => ({
        match_id: matchId,
        player_id: pid,
        status: 'pending',
      }));

    let created: any[] = [];
    if (toCreate.length > 0) {
      const { data: createdData, error: createdError } = await this.supabase
        .from('invitations')
        .insert(toCreate)
        .select();
      if (createdError) throw createdError;
      created = createdData || [];
    }

    return [...(existing || []), ...created];
  }

  async update(id: string, updateInvitationDto: UpdateInvitationDto) {
    const { data, error } = await this.supabase
      .from('invitations')
      .update({
        ...updateInvitationDto,
        responded_at: updateInvitationDto.status === 'confirmed' || updateInvitationDto.status === 'declined' 
          ? new Date().toISOString() 
          : undefined,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update match confirmed count if status changed to confirmed/declined
    if (updateInvitationDto.status === 'confirmed' || updateInvitationDto.status === 'declined') {
      const invitation = await this.findOne(id);
      if (invitation) {
        await this.matchesService.updateConfirmedCount(invitation.match_id);
      }
    }

    return data;
  }

  async updateByWhatsAppMessage(messageId: string, status: string) {
    const { data, error } = await this.supabase
      .from('invitations')
      .update({
        status,
        responded_at: new Date().toISOString(),
      })
      .eq('whatsapp_message_id', messageId)
      .select()
      .single();

    if (error) throw error;

    // Update match confirmed count
    if (data) {
      await this.matchesService.updateConfirmedCount(data.match_id);
    }

    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('invitations')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

