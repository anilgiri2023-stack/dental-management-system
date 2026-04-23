-- ═══════════════════════════════════════════════════════
-- Fix: Allow anon (client-side) to read doctors from users table
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Add a policy that allows anyone (including anon key) to read doctors
CREATE POLICY "Anyone can read doctors"
ON public.users FOR SELECT
TO anon, authenticated
USING (role = 'doctor');

-- ═══════════════════════════════════════════════════════
-- Insert sample doctors (skip if you already have doctors)
-- Remove or modify these as needed
-- ═══════════════════════════════════════════════════════

INSERT INTO public.users (email, name, phone, role) VALUES
  ('dr.sharma@clinicalserenity.com', 'Rajesh Sharma', '9876543210', 'doctor'),
  ('dr.patel@clinicalserenity.com', 'Priya Patel', '9876543211', 'doctor'),
  ('dr.singh@clinicalserenity.com', 'Arjun Singh', '9876543212', 'doctor')
ON CONFLICT (email) DO NOTHING;

-- Verify: Check doctors exist
SELECT id, name, email, role FROM public.users WHERE role = 'doctor';
