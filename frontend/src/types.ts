// Reuse types from demo, adapted for Supabase
export interface Player {
  id: string;
  name: string;
  phone: string;
  level?: string;
  position?: 'Left' | 'Right' | 'Both';
  trust_score?: number;
  reliability_status?: 'Trusted' | 'Stable' | 'Inconsistent' | 'Risk';
  confirmation_speed?: 'Instant' | 'Normal' | 'Slow';
  feedback_signal?: 'Positive' | 'Neutral' | 'Mixed';
  energy?: 'Calm' | 'Neutral' | 'Intense';
  repeat_rate?: number;
  availability_status?: string;
  coach_summary?: string;
  pattern_insight?: string;
  match_count?: number;
  last_match_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Court {
  id: string;
  name: string;
  is_active: boolean;
  availability?: CourtAvailabilityRange[];
  created_at?: string;
  updated_at?: string;
}

export interface CourtAvailabilityRange {
  id: string;
  start_time: string; // "HH:MM:SS" or "HH:MM"
  end_time: string;   // "HH:MM:SS" or "HH:MM"
}

export interface Match {
  id: string;
  court_id: string;
  scheduled_time: string;
  status: 'Draft' | 'Inviting' | 'Waiting' | 'Escalating' | 'Confirmed' | 'Locked' | 'Failed' | 'Completed';
  confirmed_count: number;
  target_count: number;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  locked_at?: string;
  completed_at?: string;
  court?: Court;
  invitations?: Invitation[];
}

export interface Invitation {
  id: string;
  match_id: string;
  player_id: string;
  status: 'pending' | 'invited' | 'confirmed' | 'declined' | 'timeout' | 'backup';
  whatsapp_message_id?: string;
  sent_at?: string;
  responded_at?: string;
  is_backup?: boolean;
  created_at?: string;
  updated_at?: string;
  player?: Player;
  match?: Match;
}

export interface Payment {
  id: string;
  invitation_id: string;
  match_id: string;
  player_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_link?: string;
  payment_provider?: string;
  payment_provider_id?: string;
  paid_at?: string;
  created_at?: string;
  updated_at?: string;
}

export type SlotStatus = 'open' | 'booked' | 'partial' | 'aura-opportunity';

export interface SlotData {
  id: string;
  time: string;
  court: string;
  status: SlotStatus;
  players?: number;
  confidence?: number;
  label?: string;
  matchId?: string;
}

