import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCourtDto } from './dto/create-court.dto';
import { UpdateCourtDto } from './dto/update-court.dto';

@Injectable()
export class CourtsService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('courts')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createCourtDto: CreateCourtDto) {
    const { data, error } = await this.supabase
      .from('courts')
      .insert(createCourtDto)
      .select()
      .single();

    if (error) throw error;
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

