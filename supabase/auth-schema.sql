-- Authentication and Authorization Schema Updates
-- Run this after the main schema.sql

-- Update matches table to reference auth.users
ALTER TABLE matches 
  ALTER COLUMN created_by TYPE UUID USING created_by::UUID;

-- Add foreign key to auth.users (if needed)
-- Note: Supabase auth.users is managed separately, so we use UUID reference

-- Create user profiles table (optional - for additional user data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Update RLS Policies for existing tables

-- Drop old policies
DROP POLICY IF EXISTS "Allow all on courts" ON courts;
DROP POLICY IF EXISTS "Allow all on players" ON players;
DROP POLICY IF EXISTS "Allow all on matches" ON matches;
DROP POLICY IF EXISTS "Allow all on invitations" ON invitations;
DROP POLICY IF EXISTS "Allow all on payments" ON payments;

-- Courts: Admins and Managers can manage, all authenticated users can view
CREATE POLICY "Authenticated users can view courts" ON courts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage courts" ON courts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Players: All authenticated users can view, admins/managers can manage
CREATE POLICY "Authenticated users can view players" ON players
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage players" ON players
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Matches: Users can view, admins/managers can create/update
CREATE POLICY "Authenticated users can view matches" ON matches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can create matches" ON matches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can update matches" ON matches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins can delete matches" ON matches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Invitations: Users can view, admins/managers can manage
CREATE POLICY "Authenticated users can view invitations" ON invitations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and managers can manage invitations" ON invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Payments: Users can view own payments, admins/managers can view all
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM invitations
            WHERE invitations.id = payments.invitation_id
            AND invitations.player_id IN (
                SELECT id FROM players WHERE phone IN (
                    SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = auth.uid()
                )
            )
        )
        OR EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

CREATE POLICY "Admins and managers can manage payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Function to sync user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

