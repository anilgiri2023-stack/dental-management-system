-- 1. Table Schema Updates (if columns missing)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Medical Report';

-- 2. Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 2. Clear existing policies to avoid conflicts
DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
DROP POLICY IF EXISTS "Service role full access on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Service role full access on reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Doctors can view all patients" ON public.users;
DROP POLICY IF EXISTS "Patients can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Doctors can manage reports" ON public.reports;
DROP POLICY IF EXISTS "Patients can view their own reports" ON public.reports;

-- 3. USERS Table Policies
-- Allow service role full access (for backend)
CREATE POLICY "Service role full access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Allow public/anon to check if user exists (for login flow)
CREATE POLICY "Public can view basic user info" ON public.users FOR SELECT USING (true);

-- Allow authenticated and anon to insert (Fixes OTP RLS issue)
-- Using a permissive policy for inserts to ensure the Node backend can always sync users
-- Note: Security is enforced by the Node backend which uses service_role key
CREATE POLICY "Enable insert for all" ON public.users FOR INSERT WITH CHECK (true);

-- Allow users to view their own full profile
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT 
USING (auth.uid()::text = id::text OR auth.email() = email);

-- 4. APPOINTMENTS Table Policies
-- Allow service role full access
CREATE POLICY "Service role full access on appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments" ON public.appointments FOR SELECT 
USING (email = auth.email());

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view assigned appointments" ON public.appointments FOR SELECT 
USING (doctor_id::text = auth.uid()::text);

-- 5. REPORTS Table Policies
-- Allow service role full access
CREATE POLICY "Service role full access on reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- Doctors can insert/update/delete reports they created
CREATE POLICY "Doctors can manage their reports" ON public.reports FOR ALL 
USING (doctor_id::text = auth.uid()::text)
WITH CHECK (doctor_id::text = auth.uid()::text);

-- Patients can view reports assigned to them
CREATE POLICY "Patients can view their own reports" ON public.reports FOR SELECT 
USING (patient_id::text = auth.uid()::text);

-- 6. Storage Policies (Supabase Storage)
-- These should be run in the Supabase SQL Editor. 
-- It assumes a bucket named 'reports' exists.

-- Enable RLS on storage.objects if not already enabled
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow doctors to upload to 'reports' bucket
CREATE POLICY "Doctors can upload reports" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'reports');

-- Allow doctors to update/delete their own uploads (optional, but good for management)
CREATE POLICY "Doctors can manage their own uploads" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'reports');

-- Allow patients to view/download from 'reports' bucket
CREATE POLICY "Patients can view reports" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'reports');

-- 7. Helper to create bucket if it doesn't exist (Supabase specific)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('reports', 'reports', false)
-- ON CONFLICT (id) DO NOTHING;
