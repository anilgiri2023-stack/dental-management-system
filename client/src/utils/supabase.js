import { createClient } from '@supabase/supabase-js';

// ─── Replace these with your Supabase project credentials ───
// You can find them in: Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://mvdiosufclqmfcznakhn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ETYhRptvdFez7TbQarOZyg_E3tbwr1X';

// Create and export the Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
