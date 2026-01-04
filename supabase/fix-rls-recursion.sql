-- Fix infinite recursion in user_profiles RLS policies
-- This script fixes the recursive policy issue by using SECURITY DEFINER functions
-- Run this script in Supabase SQL Editor after auth-schema.sql

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create a security definer function to check admin role
-- SECURITY DEFINER bypasses RLS, preventing recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    -- Check if user exists and is admin
    -- SECURITY DEFINER allows this to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = user_id AND role = 'admin'
    );
END;
$$;

-- Create a security definer function to check admin or manager role
CREATE OR REPLACE FUNCTION public.is_admin_or_manager(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    -- Check if user exists and is admin or manager
    -- SECURITY DEFINER allows this to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = user_id AND role IN ('admin', 'manager')
    );
END;
$$;

-- Recreate the admin policy using the function (non-recursive)
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id  -- Users can view their own profile
        OR public.is_admin(auth.uid())  -- Admins can view all profiles (uses function, no recursion)
    );

-- Update all other policies that reference user_profiles to use the function
-- This prevents recursion

-- Drop and recreate courts policies
DROP POLICY IF EXISTS "Admins and managers can manage courts" ON courts;
CREATE POLICY "Admins and managers can manage courts" ON courts
    FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Drop and recreate players policies
DROP POLICY IF EXISTS "Admins and managers can manage players" ON players;
CREATE POLICY "Admins and managers can manage players" ON players
    FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Drop and recreate matches policies
DROP POLICY IF EXISTS "Admins and managers can create matches" ON matches;
CREATE POLICY "Admins and managers can create matches" ON matches
    FOR INSERT WITH CHECK (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can update matches" ON matches;
CREATE POLICY "Admins and managers can update matches" ON matches
    FOR UPDATE USING (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete matches" ON matches;
CREATE POLICY "Admins can delete matches" ON matches
    FOR DELETE USING (public.is_admin(auth.uid()));

-- Drop and recreate invitations policies
DROP POLICY IF EXISTS "Admins and managers can manage invitations" ON invitations;
CREATE POLICY "Admins and managers can manage invitations" ON invitations
    FOR ALL USING (public.is_admin_or_manager(auth.uid()));

-- Drop and recreate payments policies
DROP POLICY IF EXISTS "Admins and managers can manage payments" ON payments;
CREATE POLICY "Admins and managers can manage payments" ON payments
    FOR ALL USING (public.is_admin_or_manager(auth.uid()));

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
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
        OR public.is_admin_or_manager(auth.uid())
    );

