import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private supabase: SupabaseService,
    private configService: ConfigService,
  ) {}

  async findAll() {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        invitation:invitations(*),
        match:matches(*),
        player:players(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findByInvitation(invitationId: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select('*')
      .eq('invitation_id', invitationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .select(`
        *,
        invitation:invitations(*),
        match:matches(*),
        player:players(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(createPaymentDto: CreatePaymentDto) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert(createPaymentDto)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a payment link for an invitation
   * This is a placeholder - integrate with your payment provider (Stripe, PayPal, etc.)
   */
  async createPaymentLink(invitationId: string): Promise<string> {
    // Get invitation details
    const invitation = await this.supabase
      .from('invitations')
      .select(`
        *,
        match:matches(*),
        player:players(*)
      `)
      .eq('id', invitationId)
      .single();

    if (invitation.error) throw invitation.error;

    const match = invitation.data.match;
    const player = invitation.data.player;

    // Default amount (can be configured per match/court)
    const amount = 15.0; // EUR

    // Create payment record
    const payment = await this.create({
      invitation_id: invitationId,
      match_id: match.id,
      player_id: player.id,
      amount,
      currency: 'EUR',
      status: 'pending',
    });

    // Generate payment link
    // TODO: Integrate with actual payment provider
    // For now, return a placeholder link
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const paymentLink = `${baseUrl}/pay/${payment.id}`;

    // Update payment with link
    await this.update(payment.id, {
      payment_link: paymentLink,
      payment_provider: 'stripe', // or your provider
    });

    return paymentLink;
  }

  async update(id: string, updatePaymentDto: UpdatePaymentDto) {
    const { data, error } = await this.supabase
      .from('payments')
      .update(updatePaymentDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markAsPaid(id: string, providerId?: string) {
    return this.update(id, {
      status: 'paid',
      payment_provider_id: providerId,
      paid_at: new Date().toISOString(),
    });
  }

  async remove(id: string) {
    const { error } = await this.supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }
}

