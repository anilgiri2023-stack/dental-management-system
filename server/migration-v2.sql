-- ═══════════════════════════════════════════════════════
-- Clinical Serenity — Migration V2
-- Run this in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ═══════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1: Create "reports" table for file uploads
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL DEFAULT 'report',
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS reports_patient_id_idx ON public.reports (patient_id);
CREATE INDEX IF NOT EXISTS reports_doctor_id_idx ON public.reports (doctor_id);

-- RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on reports"
ON public.reports FOR ALL
USING (true)
WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2: Add doctor_id index on appointments if missing
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments (date);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- DONE!
-- New table: public.reports
-- New indexes on appointments
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
