-- Add court availability ranges (future-proof for multiple ranges)
-- Safe to run on existing DBs.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS court_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  court_id UUID NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT court_availability_valid_range CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_court_availability_court_id ON court_availability(court_id);

-- updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_court_availability_updated_at'
  ) THEN
    CREATE TRIGGER update_court_availability_updated_at
    BEFORE UPDATE ON court_availability
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE court_availability ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow all on court_availability'
  ) THEN
    CREATE POLICY "Allow all on court_availability" ON court_availability FOR ALL USING (true);
  END IF;
END $$;

-- Realtime publication (ignore errors if already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE court_availability;
  EXCEPTION WHEN duplicate_object THEN
    -- no-op
  END;
END $$;

