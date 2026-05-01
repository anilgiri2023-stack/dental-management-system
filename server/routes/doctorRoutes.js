import express from 'express';
import { supabase } from '../utils/supabase.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    console.log(`📡 [doctor-register] Initiating for: ${email}`);

    // 1. Find the existing invited user in public.users
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (findError || !user) {
      console.log(`❌ [doctor-register] Invitation not found: ${email}`);
      return res.status(404).json({ success: false, message: 'Doctor invitation not found. Please contact admin.' });
    }

    // 2. Hash the password once using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Activate the user in public.users table ONLY
    const { error: dbError } = await supabase
      .from('users')
      .update({
        password: hashedPassword,
        is_active: true,
        status: 'active'
      })
      .eq('id', user.id);

    if (dbError) throw dbError;

    console.log(`✅ [doctor-register] Registration complete for: ${email}`);
    res.json({ success: true, message: 'Registration complete! You can now log in.' });
  } catch (err) {
    console.error('❌ [doctor-register] Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Fetch user by email from public.users table ONLY
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('role', 'doctor')
      .single();

    if (userError || !user) {
      console.log(`❌ [doctor-login] Doctor not found: ${cleanEmail}`);
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // 2. Check if password exists
    if (!user.password) {
      console.log(`⚠️ [doctor-login] No password set for: ${cleanEmail}`);
      return res.status(400).json({ 
        success: false, 
        message: 'No password set. Please use the registration link to set one.' 
      });
    }

    // 3. Debugging Logs
    console.log(`📡 [doctor-login] Attempt for: ${cleanEmail}`);
    console.log(`🔑 Entered Password Length: ${cleanPassword.length}`);

    // 4. Secure Bcrypt Comparison
    const isMatch = await bcrypt.compare(cleanPassword, user.password);
    console.log(`✅ [doctor-login] Bcrypt Match Result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // 5. Generate our custom JWT token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });

    res.json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Doctor login error:', err);
    res.status(500).json({ success: false, message: err.message || 'Login failed' });
  }
});

// GET /api/doctor/reports - Fetch reports for the logged-in doctor
router.get('/reports', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, reports: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/doctors', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('role', 'doctor');

    if (error) {
      console.error('Supabase error fetching doctors:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, doctors: data || [] });
  } catch (err) {
    console.error('Server error fetching doctors:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
