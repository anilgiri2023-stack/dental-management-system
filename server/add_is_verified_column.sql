-- Run this in Supabase SQL Editor
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
