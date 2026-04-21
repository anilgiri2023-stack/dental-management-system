// Run SQL migrations against Supabase using the Management API
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');
console.log('Project ref:', projectRef);

const SQL = `
-- Drop old tables
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table (standalone, no auth.users dependency)
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT,
    phone TEXT,
    name TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Unique indexes (allow NULLs)
CREATE UNIQUE INDEX users_email_uniq ON public.users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_phone_uniq ON public.users(phone) WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "full_access_users" ON public.users;
CREATE POLICY "full_access_users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- Create appointments table
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
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX apt_user_idx ON public.appointments(user_id);
CREATE INDEX apt_status_idx ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "full_access_appts" ON public.appointments;
CREATE POLICY "full_access_appts" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
`;

async function runSQL() {
  console.log('🔄 Running SQL migration via Supabase Management API...\n');

  // Try the pg-meta SQL endpoint
  const url = `${SUPABASE_URL}/pg/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: SQL }),
  });

  if (res.ok) {
    console.log('✅ Migration completed successfully via pg/query!');
    return true;
  }

  // Fallback: try /rest/v1/rpc
  console.log('pg/query not available, trying rpc...');

  // Try splitting SQL into individual statements
  const statements = SQL.split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ sql: stmt + ';' }),
    });

    if (!rpcRes.ok) {
      const text = await rpcRes.text();
      if (text.includes('function') && text.includes('does not exist')) {
        console.error('❌ Cannot run SQL remotely. The exec_sql function is not available.');
        console.error('');
        console.error('╔══════════════════════════════════════════════════════╗');
        console.error('║  PLEASE RUN setup.sql MANUALLY in Supabase:        ║');
        console.error('║                                                      ║');
        console.error('║  1. Go to: https://supabase.com/dashboard           ║');
        console.error('║  2. Select your project                             ║');
        console.error('║  3. Click "SQL Editor" in the left sidebar          ║');
        console.error('║  4. Click "+ New Query"                             ║');
        console.error('║  5. Paste ALL content from server/setup.sql          ║');
        console.error('║  6. Click "Run" (or Ctrl+Enter)                     ║');
        console.error('║  7. Restart the server: npm run dev                  ║');
        console.error('╚══════════════════════════════════════════════════════╝');
        return false;
      }
    }
  }

  return true;
}

runSQL().then(ok => {
  if (ok) {
    // Verify
    const { createClient } = require('@supabase/supabase-js');
    const s = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    return s.from('users').insert([{
      email: '__verify_test@test.com',
      name: 'Verify Test',
      role: 'user',
    }]).select().single().then(({ data, error }) => {
      if (error) {
        console.error('❌ Verification failed:', error.message);
        console.error('   Please run setup.sql manually in Supabase SQL Editor.');
      } else {
        console.log('✅ Verified: user created with id', data.id);
        console.log('   Columns:', Object.keys(data).join(', '));
        // Cleanup
        return s.from('users').delete().eq('id', data.id);
      }
    });
  }
}).catch(err => {
  console.error('Error:', err.message);
});
