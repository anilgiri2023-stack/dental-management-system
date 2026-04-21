-- ═══════════════════════════════════════════════════════
-- Clinical Serenity — Database Setup Script
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ═══════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Drop old tables/policies if they exist (clean slate)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Drop old policies on profiles (if exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop old policies on appointments (if exists)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can insert their own appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Service role can view all appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Service role can update all appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Service role can delete appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Admin can view all appointments" ON public.appointments;
  DROP POLICY IF EXISTS "Admin can update all appointments" ON public.appointments;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Drop old tables (order matters for FK)
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Create "users" table (standalone, NO auth.users dependency)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    name TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Allow NULLs in email/phone but enforce uniqueness only for non-null values
-- (a user might sign up with only email OR only phone)
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON public.users (phone) WHERE phone IS NOT NULL;

-- RLS: The server uses SERVICE_ROLE key which bypasses RLS.
-- We enable RLS but add a permissive policy for service role.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on users"
ON public.users FOR ALL
USING (true)
WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: Create "appointments" table
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    service TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT DEFAULT 'Pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS appointments_user_id_idx ON public.appointments (user_id);
CREATE INDEX IF NOT EXISTS appointments_status_idx ON public.appointments (status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on appointments"
ON public.appointments FOR ALL
USING (true)
WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE! Tables created:
--   • public.users        (id, email, phone, name, role, created_at)
--   • public.appointments (id, user_id → users.id, name, email, phone,
--                          service, date, time, notes, status, created_at)
--
-- The server (using SERVICE_ROLE key) has full access.
-- No dependency on auth.users — we manage users ourselves.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
