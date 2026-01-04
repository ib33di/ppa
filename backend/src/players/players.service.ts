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
    // Normalize phone number (remove +, spaces, dashes)
    const normalizedPhone = phone.replace(/^\+/, '').replace(/\s/g, '').replace(/-/g, '');
    
    console.log(`[Players] Searching for player with phone:`, {
      original: phone,
      normalized: normalizedPhone,
    });
    
    // Try multiple formats
    const phoneVariants = [
      phone,                    // Original
      normalizedPhone,          // Without + and spaces
      `+${normalizedPhone}`,   // With + prefix
    ];

    for (const phoneVariant of phoneVariants) {
      try {
        const { data, error } = await this.supabase
          .from('players')
          .select('*')
          .eq('phone', phoneVariant)
          .single();

        if (!error && data) {
          console.log(`[Players] Found player with phone variant: ${phoneVariant}`, {
            playerId: data.id,
            playerName: data.name,
          });
          return data;
        }

        // If error is not "not found", throw it
        if (error && error.code !== 'PGRST116') {
          console.error(`[Players] Error searching for phone ${phoneVariant}:`, error);
          throw error;
        }
      } catch (error) {
        // If it's not a "not found" error, rethrow
        if (error.code !== 'PGRST116') {
          throw error;
        }
      }
    }

    console.warn(`[Players] Player not found for any phone variant:`, phoneVariants);
    return null;
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

