-- ═══════════════════════════════════════════════════════════
-- Migration: Add Password Column & Force Reset for Doctors
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Add password column if it doesn't already exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Force password reset for existing doctors (Requirement #4)
-- By setting the password to NULL, the system will prompt them
-- to use the "Forgot Password" flow, ensuring they get a secure hashed password.
UPDATE public.users 
SET password = NULL 
WHERE role = 'doctor' 
AND (password IS NULL OR password = 'password123');

-- 3. Ensure index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ═══════════════════════════════════════════════════════════
-- DONE!
-- ═══════════════════════════════════════════════════════════
