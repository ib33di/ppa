import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(private supabase: SupabaseService) {}

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

    if (error) throw error;
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

    if (error) throw error;
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
        throw new Error('Invalid availability range: start_time must be before end_time');
      }

      const rows = availability.map((r: any) => ({
        court_id: data.id,
        start_time: r.start_time,
        end_time: r.end_time,
      }));

      const { error: availabilityError } = await this.supabase.from('court_availability').insert(rows);
      if (availabilityError) throw availabilityError;
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

