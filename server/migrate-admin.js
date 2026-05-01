require('dotenv').config();
const { supabase } = require('./utils/supabase');
const bcrypt = require('bcryptjs');

async function migrateAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
    return;
  }

  console.log(`🔍 Checking for admin: ${email}`);

  try {
    // 1. Check if admin exists in users table
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    const hashedPassword = await bcrypt.hash(password, 10);

    if (fetchErr || !user) {
      console.log('🆕 Admin not found. Creating new admin user...');
      
      // Create in Auth first to get a valid UUID if possible, or just insert into users
      // For simplicity in this migration, we insert directly into users table
      // In a real flow, you'd use supabase.auth.admin.createUser
      
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert([{
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role: 'admin',
          name: 'Admin',
          is_verified: true
        }])
        .select()
        .single();

      if (createErr) throw createErr;
      console.log('✅ Admin created successfully with hashed password.');
    } else {
      console.log('🔄 Admin exists. Updating password to hashed version...');
      
      const { error: updateErr } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          role: 'admin', // Ensure role is admin
          is_verified: true 
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;
      console.log('✅ Admin password updated to hashed version.');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

migrateAdmin();
