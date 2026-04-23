-- ═══════════════════════════════════════════════════════
-- Migration: Add password to users table
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Add password column for email/password authentication
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS password TEXT;

-- Update existing doctors to have a default password
UPDATE public.users 
SET password = 'password123' 
WHERE role = 'doctor' AND password IS NULL;

-- ═══════════════════════════════════════════════════════
-- DONE! The users table now has a password column.
-- ═══════════════════════════════════════════════════════
