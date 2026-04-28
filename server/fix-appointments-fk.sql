-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- FIX: Resolve Foreign Key Errors in Appointments
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. Drop existing FK to public.users if it exists
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;

-- 2. Add new FK to auth.users (Supabase's internal users table)
-- This ensures that even if a user is NOT in public.users, 
-- they can still book an appointment as long as they are authenticated.
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Ensure doctor_id also points to auth.users for consistency (optional)
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;

ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_doctor_id_fkey 
FOREIGN KEY (doctor_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Verify RLS policies (Ensure they don't block inserts for auth users)
-- (Assuming service role handles inserts, but good to have)
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON public.appointments;
CREATE POLICY "Authenticated users can insert appointments" 
ON public.appointments FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);
