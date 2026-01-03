import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        court:courts(*),
        invitations(
          *,
          player:players(*)
        )
      `)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        court:courts(*),
        invitations(
          *,
          player:players(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByStatus(status: string) {
    const { data, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        court:courts(*),
        invitations(
          *,
          player:players(*)
        )
      `)
      .eq('status', status)
      .order('scheduled_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  async create(createMatchDto: CreateMatchDto) {
    const { data, error } = await this.supabase
      .from('matches')
      .insert(createMatchDto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const { data, error } = await this.supabase
      .from('matches')
      .update(updateMatchDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateConfirmedCount(matchId: string) {
    // Count confirmed invitations
    const { count, error: countError } = await this.supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('status', 'confirmed');

    if (countError) throw countError;

    // Update match confirmed_count
    const { data, error } = await this.supabase
      .from('matches')
      .update({ confirmed_count: count || 0 })
      .eq('id', matchId)
      .select()
      .single();

    if (error) throw error;

    // Auto-lock if target reached
    if (count >= (data.target_count || 4)) {
      await this.update(matchId, {
        status: 'Locked',
        locked_at: new Date().toISOString(),
      });
    }

    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('matches')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

