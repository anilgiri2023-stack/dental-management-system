import { createClient } from '@supabase/supabase-js';

// ─── Supabase project credentials ───
// Must match the same project as the server (Dashboard → Settings → API)
const SUPABASE_URL = 'https://qpxuzujxopejqndxyaep.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFweHV6dWp4b3BlanFuZHh5YWVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODQ1NzksImV4cCI6MjA5MjI2MDU3OX0.NGJ6UPtms93a2fXLd4yPQHJnLUV5JE57h4QDvHmaUb8';

// Create and export the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
