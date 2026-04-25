-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ADD avatar_url COLUMN TO users TABLE
-- Run this in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url';
