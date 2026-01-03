-- Padel Club Match Invitation Platform - Supabase Schema
-- Production-ready schema with proper foreign keys and constraints

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courts table
CREATE TABLE courts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    level VARCHAR(10), -- e.g., "4.5", "5.0"
    position VARCHAR(10) CHECK (position IN ('Left', 'Right', 'Both')),
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    reliability_status VARCHAR(20) DEFAULT 'Stable' CHECK (reliability_status IN ('Trusted', 'Stable', 'Inconsistent', 'Risk')),
    confirmation_speed VARCHAR(20) DEFAULT 'Normal' CHECK (confirmation_speed IN ('Instant', 'Normal', 'Slow')),
    feedback_signal VARCHAR(20) DEFAULT 'Neutral' CHECK (feedback_signal IN ('Positive', 'Neutral', 'Mixed')),
    energy VARCHAR(20) DEFAULT 'Neutral' CHECK (energy IN ('Calm', 'Neutral', 'Intense')),
    repeat_rate INTEGER DEFAULT 0 CHECK (repeat_rate >= 0 AND repeat_rate <= 100),
    availability_status VARCHAR(50) DEFAULT 'Dormant',
    coach_summary TEXT,
    pattern_insight TEXT,
    match_count INTEGER DEFAULT 0,
    last_match_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    court_id UUID NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Inviting', 'Waiting', 'Escalating', 'Confirmed', 'Locked', 'Failed', 'Completed')),
    confirmed_count INTEGER DEFAULT 0,
    target_count INTEGER DEFAULT 4 CHECK (target_count > 0),
    created_by UUID, -- Admin user ID (can be extended with auth.users)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    locked_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Invitations table (tracks individual player invitations)
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'confirmed', 'declined', 'timeout', 'backup')),
    whatsapp_message_id VARCHAR(255), -- AdWhats message ID
    sent_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    is_backup BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id) -- Prevent duplicate invitations
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invitation_id UUID NOT NULL REFERENCES invitations(id) ON DELETE RESTRICT,
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_link TEXT,
    payment_provider VARCHAR(50), -- e.g., "stripe", "paypal"
    payment_provider_id VARCHAR(255),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_matches_court_id ON matches(court_id);
CREATE INDEX idx_matches_scheduled_time ON matches(scheduled_time);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_invitations_match_id ON invitations(match_id);
CREATE INDEX idx_invitations_player_id ON invitations(player_id);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_payments_invitation_id ON payments(invitation_id);
CREATE INDEX idx_payments_match_id ON payments(match_id);
CREATE INDEX idx_payments_player_id ON payments(player_id);
CREATE INDEX idx_players_phone ON players(phone);
CREATE INDEX idx_players_trust_score ON players(trust_score);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_courts_updated_at BEFORE UPDATE ON courts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - can be customized based on auth requirements
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for now - customize based on your auth setup)
CREATE POLICY "Allow all on courts" ON courts FOR ALL USING (true);
CREATE POLICY "Allow all on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all on matches" ON matches FOR ALL USING (true);
CREATE POLICY "Allow all on invitations" ON invitations FOR ALL USING (true);
CREATE POLICY "Allow all on payments" ON payments FOR ALL USING (true);

-- Realtime publication (for Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

