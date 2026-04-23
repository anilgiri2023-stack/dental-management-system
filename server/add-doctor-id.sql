-- ═══════════════════════════════════════════════════════
-- Migration: Add doctor_id to appointments table
-- Run this in Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → paste → Run)
-- ═══════════════════════════════════════════════════════

-- Add doctor_id column (nullable FK to users table)
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Index for fast doctor-specific queries
CREATE INDEX IF NOT EXISTS appointments_doctor_id_idx ON public.appointments (doctor_id);

-- ═══════════════════════════════════════════════════════
-- DONE! The appointments table now has a doctor_id column.
-- Existing rows will have doctor_id = NULL (no doctor assigned).
-- ═══════════════════════════════════════════════════════
