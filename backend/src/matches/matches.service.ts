import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';

@Injectable()
export class MatchesService {
  constructor(private supabase: SupabaseService) {}

  private isMissingTableError(err: any, table: string): boolean {
    const code = String(err?.code || '');
    const message = String(err?.message || '');
    const details = String(err?.details || '');

    // Common Supabase/PostgREST code when a table isn't in the schema cache.
    if (code === 'PGRST205' && (message.includes(table) || details.includes(table))) return true;

    // Defensive fallbacks for other environments/messages.
    if ((message + details).includes(table) && (message.includes('schema cache') || message.includes('does not exist'))) return true;

    return false;
  }

  private hhmmToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map((v) => parseInt(v, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) throw new BadRequestException('Invalid time format (HH:MM)');
    return h * 60 + m;
  }

  private deriveTimeHHMMFromIso(iso: string): string {
    const d = new Date(iso);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private async assertCourtAllowsTime(courtId: string, timeHHMM: string) {
    const { data: ranges, error } = await this.supabase
      .from('court_availability')
      .select('start_time,end_time')
      .eq('court_id', courtId)
      .order('start_time', { ascending: true });

    if (error) {
      // Backward compatible: if the migration wasn't applied yet, allow any time.
      if (this.isMissingTableError(error, 'court_availability')) return;
      throw new BadRequestException(`Failed to load court availability: ${error.message || 'Unknown error'}`);
    }
    if (!ranges || ranges.length === 0) {
      // Backward compatible: if no availability is defined, allow any time.
      return;
    }

    const t = this.hhmmToMinutes(timeHHMM);
    const allowed = ranges.some((r: any) => {
      const start = this.hhmmToMinutes(String(r.start_time).slice(0, 5));
      const end = this.hhmmToMinutes(String(r.end_time).slice(0, 5));
      return t >= start && t < end;
    });

    if (!allowed) {
      throw new BadRequestException(`Scheduled time ${timeHHMM} is outside allowed play hours for this court`);
    }
  }

  private async assertNoDuplicateSlot(courtId: string, scheduledTimeIso: string) {
    const { data, error } = await this.supabase
      .from('matches')
      .select('id')
      .eq('court_id', courtId)
      .eq('scheduled_time', scheduledTimeIso)
      .maybeSingle();

    if (error) {
      throw new BadRequestException(`Failed to validate slot uniqueness: ${error.message || 'Unknown error'}`);
    }
    if (data?.id) {
      throw new BadRequestException('A match already exists for this court and time slot');
    }
  }

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

  async findByCourt(courtId: string, status?: string) {
    let query = this.supabase
      .from('matches')
      .select(`
        *,
        court:courts(*),
        invitations(
          *,
          player:players(*)
        )
      `)
      .eq('court_id', courtId)
      .order('scheduled_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
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
    // Best-effort availability enforcement for legacy callers (uses server-local derived HH:MM).
    const derivedHHMM = this.deriveTimeHHMMFromIso(createMatchDto.scheduled_time);
    await this.assertCourtAllowsTime(createMatchDto.court_id, derivedHHMM);
    await this.assertNoDuplicateSlot(createMatchDto.court_id, createMatchDto.scheduled_time);
    return this.insertMatch(createMatchDto);
  }

  async createFromSlot(createMatchDto: CreateMatchDto & { slot_time?: string }, slotTimeHHMM?: string) {
    const hhmm = slotTimeHHMM || this.deriveTimeHHMMFromIso(createMatchDto.scheduled_time);
    await this.assertCourtAllowsTime(createMatchDto.court_id, hhmm);
    await this.assertNoDuplicateSlot(createMatchDto.court_id, createMatchDto.scheduled_time);
    // Do not re-derive time from ISO again (timezone-safe). Insert after validation.
    // Extract only fields that belong to CreateMatchDto (exclude slot_time)
    const { slot_time, ...matchData } = createMatchDto;
    return this.insertMatch(matchData);
  }

  private async insertMatch(createMatchDto: CreateMatchDto) {
    const { data, error } = await this.supabase
      .from('matches')
      .insert(createMatchDto)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create match: ${error.message || 'Unknown error'}`);
    }
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

