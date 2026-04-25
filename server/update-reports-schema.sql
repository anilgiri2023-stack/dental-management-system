-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- UPDATE REPORTS TABLE SCHEMA & RLS
-- Run this in Supabase SQL Editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Add new columns
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS "uploadedAt" TIMESTAMPTZ;

-- 2. Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 3. Clean up any existing conflicting policies
DROP POLICY IF EXISTS "Service role full access on reports" ON public.reports;
DROP POLICY IF EXISTS "Doctor can insert reports" ON public.reports;
DROP POLICY IF EXISTS "Doctor can view their reports" ON public.reports;
DROP POLICY IF EXISTS "Doctor can update their reports" ON public.reports;
DROP POLICY IF EXISTS "Doctor can delete their reports" ON public.reports;
DROP POLICY IF EXISTS "Patient can view their reports" ON public.reports;

-- 4. Create RLS Policies

-- Allow Service Role full access (for backend API)
CREATE POLICY "Service role full access on reports"
ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- DOCTOR: Insert
CREATE POLICY "Doctor can insert reports" ON public.reports
FOR INSERT WITH CHECK (auth.uid() = doctor_id);

-- DOCTOR: Select
CREATE POLICY "Doctor can view their reports" ON public.reports
FOR SELECT USING (auth.uid() = doctor_id);

-- DOCTOR: Update
CREATE POLICY "Doctor can update their reports" ON public.reports
FOR UPDATE USING (auth.uid() = doctor_id);

-- DOCTOR: Delete
CREATE POLICY "Doctor can delete their reports" ON public.reports
FOR DELETE USING (auth.uid() = doctor_id);

-- PATIENT: Select (Note: For users in auth.users. If using custom OTP via backend, this policy isn't hit, but safe to have)
CREATE POLICY "Patient can view their reports" ON public.reports
FOR SELECT USING (auth.uid() = patient_id);
