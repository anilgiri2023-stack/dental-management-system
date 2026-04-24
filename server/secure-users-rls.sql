-- ═══════════════════════════════════════════════════════════
-- RLS Policies for users table — Secure doctor data
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- 1. Enable RLS on the users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing permissive policies that allow anon access
DROP POLICY IF EXISTS "Allow public read" ON public.users;
DROP POLICY IF EXISTS "Allow anon read" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;

-- 3. Only authenticated users can read the users table
CREATE POLICY "Only auth users can read users"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- 4. Allow service_role full access (your backend uses service_role key)
-- This is automatic — service_role bypasses RLS by default.

-- 5. Allow authenticated users to update their own row (for set-password)
CREATE POLICY "Users can update own row"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 6. Allow service_role to insert/delete (handled automatically)
-- No explicit policy needed — service_role bypasses RLS.

-- Verify: Run this to check policies
-- SELECT * FROM pg_policies WHERE tablename = 'users';
