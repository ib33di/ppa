import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private supabase: SupabaseService) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('players')
      .select('*')
      .order('trust_score', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async findByPhone(phone: string) {
    // Normalize phone number (remove + and spaces)
    const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '');
    
    // Try exact match first
    let { data, error } = await this.supabase
      .from('players')
      .select('*')
      .eq('phone', phone)
      .single();

    // If not found, try normalized version
    if (error && error.code === 'PGRST116') {
      const { data: normalizedData, error: normalizedError } = await this.supabase
        .from('players')
        .select('*')
        .eq('phone', normalizedPhone)
        .single();
      
      if (normalizedError && normalizedError.code !== 'PGRST116') throw normalizedError;
      return normalizedData;
    }

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  }

  async create(createPlayerDto: CreatePlayerDto) {
    const { data, error } = await this.supabase
      .from('players')
      .insert(createPlayerDto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    const { data, error } = await this.supabase
      .from('players')
      .update(updatePlayerDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

