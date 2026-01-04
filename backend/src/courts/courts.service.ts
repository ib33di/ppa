import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(private supabase: SupabaseService) {}

  private isMissingTableError(err: any, table: string): boolean {
    const code = String(err?.code || '');
    const message = String(err?.message || '');
    const details = String(err?.details || '');

    if (code === 'PGRST205' && (message.includes(table) || details.includes(table))) return true;
    if ((message + details).includes(table) && (message.includes('schema cache') || message.includes('does not exist'))) return true;
    return false;
  }

  async findAll(includeInactive = false) {
    let query = this.supabase
      .from('courts')
      .select(`
          *,
          availability:court_availability(
            id,
            start_time,
            end_time
          )
        `)
      .order('name');

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      // If the availability migration isn't applied yet, return courts without availability.
      if (this.isMissingTableError(error, 'court_availability')) {
        let fallback = this.supabase.from('courts').select('*').order('name');
        if (!includeInactive) fallback = fallback.eq('is_active', true);
        const { data: courts, error: fallbackError } = await fallback;
        if (fallbackError) throw fallbackError;
        return (courts || []).map((c: any) => ({ ...c, availability: [] }));
      }
      throw error;
    }
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('courts')
      .select(`
        *,
        availability:court_availability(
          id,
          start_time,
          end_time
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (this.isMissingTableError(error, 'court_availability')) {
        const { data: court, error: fallbackError } = await this.supabase.from('courts').select('*').eq('id', id).single();
        if (fallbackError) throw fallbackError;
        return { ...(court as any), availability: [] };
      }
      throw error;
    }
    return data;
  }

  async create(createCourtDto: CreateCourtDto) {
    const { availability, ...courtFields } = createCourtDto as any;
    const { data, error } = await this.supabase
      .from('courts')
      .insert(courtFields)
      .select()
      .single();

    if (error) throw error;

    if (availability && Array.isArray(availability) && availability.length > 0) {
      // Validate simple range logic (also enforced by DB constraint)
      const invalid = availability.find((r: any) => !r?.start_time || !r?.end_time || r.start_time >= r.end_time);
      if (invalid) {
        throw new BadRequestException('Invalid availability range: start_time must be before end_time');
      }

      const rows = availability.map((r: any) => ({
        court_id: data.id,
        start_time: r.start_time,
        end_time: r.end_time,
      }));

      const { error: availabilityError } = await this.supabase.from('court_availability').insert(rows);
      if (availabilityError) {
        if (this.isMissingTableError(availabilityError, 'court_availability')) {
          throw new BadRequestException(
            'court_availability table is missing. Apply migration supabase/migrations/20260104_add_court_availability.sql and redeploy.',
          );
        }
        throw availabilityError;
      }
    }

    return data;
  }

  async update(id: string, updateCourtDto: UpdateCourtDto) {
    const { data, error } = await this.supabase
      .from('courts')
      .update(updateCourtDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('courts')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

