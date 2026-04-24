// ═══════════════════════════════════════════════════════════
// Clinical Serenity — Full-Stack Backend API
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Supabase (Service Role — bypasses RLS) ──────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Nodemailer ──────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── JWT ─────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ─── OTP Store (in-memory) ───────────────────────────────
const otpStore = new Map();
const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (now > val.expiresAt) otpStore.delete(key);
  }
}, 60_000);

// ─── Auth Middleware ─────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Session expired' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin only' });
  }
  next();
}

function doctorOnly(req, res, next) {
  if (req.user?.role !== 'doctor') {
    return res.status(403).json({ success: false, message: 'Doctor only' });
  }
  next();
}

function patientOnly(req, res, next) {
  if (req.user?.role !== 'user' && req.user?.role !== 'patient') {
    return res.status(403).json({ success: false, message: 'Patient only' });
  }
  next();
}

// ─── Multer (memory storage for Supabase upload) ────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, PNG, and WebP files are allowed'));
    }
  },
});

// ═══════════════════════════════════════════════════════════
// 1. POST /send-otp
// ═══════════════════════════════════════════════════════════
app.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Rate limit: 1 OTP per 60s per email
    const existing = otpStore.get(email);
    if (existing && Date.now() - existing.createdAt < 60_000) {
      return res.status(429).json({ success: false, message: 'Wait 60 seconds before requesting again' });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    otpStore.set(email, { otp, expiresAt: Date.now() + OTP_EXPIRY, createdAt: Date.now(), attempts: 0 });

    console.log(`📨 OTP for ${email}: ${otp}`);

    // Send email
    try {
      await transporter.sendMail({
        from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Your Login Code — Clinical Serenity',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
            <div style="text-align:center;margin-bottom:30px">
              <h1 style="color:#0f172a;font-size:22px;margin:0">Clinical Serenity</h1>
            </div>
            <p style="color:#475569;font-size:15px;margin-bottom:24px">Your verification code (expires in 5 minutes):</p>
            <div style="background:#f0fdfa;border:2px dashed #0D9488;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#0D9488">${otp}</span>
            </div>
            <p style="color:#94a3b8;font-size:13px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      console.log(`✅ OTP email sent to ${email}`);
    } catch (emailErr) {
      console.error('⚠️  Email send failed:', emailErr.message);
      // OTP is still stored — user can use it even if email fails
    }

    res.json({ success: true, message: `Verification code sent to ${email}` });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// Also mount on /api/auth/send-otp for frontend compatibility
app.post('/api/auth/send-otp', (req, res) => {
  // Map type-based request to email-based
  const { identifier, type } = req.body;
  if (type === 'email' && identifier) req.body.email = identifier;
  else if (!req.body.email && identifier) req.body.email = identifier;
  // Forward to the main handler
  app.handle({ ...req, url: '/send-otp', method: 'POST' }, res);
});

// ═══════════════════════════════════════════════════════════
// 2. POST /verify-otp
// ═══════════════════════════════════════════════════════════
app.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, phone } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const stored = otpStore.get(email);
    if (!stored) return res.status(400).json({ success: false, message: 'No OTP found. Request a new one.' });
    if (Date.now() > stored.expiresAt) { otpStore.delete(email); return res.status(400).json({ success: false, message: 'OTP expired' }); }
    if (stored.attempts >= 5) { otpStore.delete(email); return res.status(429).json({ success: false, message: 'Too many attempts' }); }
    if (stored.otp !== otp) { stored.attempts++; return res.status(400).json({ success: false, message: `Wrong OTP. ${5 - stored.attempts} tries left` }); }

    // OTP correct — clear it
    otpStore.delete(email);

    // Find or create user in "users" table
    let user;
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      user = existingUser;
      console.log(`✅ Existing user: ${user.id}`);
      // Update name/phone if provided and different
      let updates = {};
      if (name && user.name !== name) updates.name = name;
      if (phone && user.phone !== phone) updates.phone = phone;

      if (Object.keys(updates).length > 0) {
        const { data: updatedUser } = await supabase.from('users').update(updates).eq('id', user.id).select().single();
        if (updatedUser) user = updatedUser;
      }
    } else {
      // Validate required fields for new user
      if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Name is required' });
      if (!phone || !phone.trim()) return res.status(400).json({ success: false, message: 'Phone is required' });

      // Create new user
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert([{ 
           email, 
           name: name.trim(), 
           phone: phone.trim(),
           role: 'user' 
        }])
        .select()
        .single();

      if (createErr) {
        console.error('Create user error:', createErr);
        return res.status(400).json({ success: false, message: createErr.message || 'Failed to create user' });
      }
      user = newUser;
      console.log(`✅ New user created: ${user.id}`);
    }

    // Generate JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role || 'user',
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role || 'user' },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// Frontend-compatible alias
app.post('/api/auth/verify-otp', (req, res) => {
  const { identifier, type, otp: otpVal, name } = req.body;
  if (identifier && !req.body.email) req.body.email = identifier;
  if (otpVal && !req.body.otp) req.body.otp = otpVal;
  app.handle({ ...req, url: '/verify-otp', method: 'POST' }, res);
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/check-user — check if email exists (public)
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const { data } = await supabase.from('users').select('id').eq('email', email.trim().toLowerCase()).single();
    res.json({ success: true, exists: !!data });
  } catch {
    // If no row found, supabase throws — treat as "does not exist"
    res.json({ success: true, exists: false });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/auth/me — validate token & return user
// ═══════════════════════════════════════════════════════════
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === 'admin') {
      return res.json({ success: true, user: req.user });
    }
    const { data } = await supabase.from('users').select('*').eq('id', req.user.id).single();
    if (data) {
      return res.json({ success: true, user: { id: data.id, email: data.email, name: data.name, phone: data.phone, role: data.role } });
    }
    res.json({ success: true, user: req.user });
  } catch {
    res.json({ success: true, user: req.user });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/update-profile
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/update-profile', authMiddleware, (req, res) => {
  const { name } = req.body;
  // Re-issue token with name embedded
  const token = signToken({ ...req.user, name: name || req.user.name });
  res.json({ success: true, token });
});

// ═══════════════════════════════════════════════════════════
// Admin Login (password-based)
// ═══════════════════════════════════════════════════════════
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'anilofficial2005@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Anil@8080';

  if (email !== adminEmail) return res.status(403).json({ success: false, message: 'Not an admin' });
  if (password !== adminPassword) return res.status(401).json({ success: false, message: 'Wrong password' });

  const token = signToken({ id: 'admin', email: adminEmail, name: 'Admin', role: 'admin' });
  console.log('✅ Admin login');
  res.json({ success: true, token, user: { id: 'admin', email: adminEmail, name: 'Admin', role: 'admin' } });
});

// ═══════════════════════════════════════════════════════════
// Doctor Login (Supabase Auth based)
// ═══════════════════════════════════════════════════════════
app.post('/api/doctor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const trimmedEmail = email.trim().toLowerCase();

    // 1. Verify credentials via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError || !authData?.user) {
      console.log('Doctor auth failed:', authError?.message);
      return res.status(401).json({ success: false, message: 'Wrong email or password' });
    }

    // 2. Fetch user from our users table to check role
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('email', trimmedEmail)
      .single();

    if (dbError || !user) {
      return res.status(401).json({ success: false, message: 'Doctor account not found in system' });
    }

    if (user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'This account is not a doctor account' });
    }

    // 3. Generate our custom JWT for the app
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: 'doctor',
    });

    console.log(`✅ Doctor login: ${user.email}`);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: 'doctor' },
    });
  } catch (err) {
    console.error('Doctor login error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════
// 3. POST /book-appointment
//    Accepts: date, time, service
//    user_id comes from JWT (NEVER from frontend)
// ═══════════════════════════════════════════════════════════
async function bookAppointment(req, res) {
  try {
    const { date, time, service, phone, name, email, doctor_id } = req.body;

    // Add console logs to confirm values before inserting into database
    console.log('--- Incoming Booking Request ---');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone);
    console.log('Service:', service);
    console.log('Date:', date);
    console.log('Time:', time);
    console.log('Doctor ID:', doctor_id || 'Not specified');
    console.log('--------------------------------');

    if (!date || !time || !service || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'date, time, service, name, email, and phone are required' });
    }

    const userId = req.user.id; // From JWT — never from body

    const insertData = {
      user_id: userId,
      date,
      time,
      service,
      phone,
      name,
      email,
      status: 'Pending',
    };

    // Include doctor_id if provided
    if (doctor_id) {
      insertData.doctor_id = doctor_id;
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Insert appointment error:', error);
      return res.status(500).json({ success: false, message: error.message });
    }

    console.log(`📅 Appointment booked: ${service} on ${date} at ${time} [user: ${userId}]`);
    res.status(201).json({ success: true, message: 'Appointment booked', appointment: data });
  } catch (error) {
    console.error('Book appointment error:', error);
    res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
}

app.post('/book-appointment', authMiddleware, bookAppointment);
app.post('/api/appointments', authMiddleware, bookAppointment);
app.post('/api/book-appointment', authMiddleware, bookAppointment);

// ═══════════════════════════════════════════════════════════
// 4. GET /my-appointments — logged-in user's appointments only
// ═══════════════════════════════════════════════════════════
async function getMyAppointments(req, res) {
  try {
    let query = supabase.from('appointments').select('*');

    if (req.user.role === 'admin') {
      // Admin sees all, no filter needed
    } else if (req.user.role === 'doctor') {
      // Doctor sees only their assigned appointments
      query = query.eq('doctor_id', req.user.id);
    } else {
      // Regular user sees only their own
      query = query.eq('user_id', req.user.id);
    }

    query = query.order('date', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    // Enrich appointments with user email for admin and doctor view
    let enriched = data || [];
    if ((req.user.role === 'admin' || req.user.role === 'doctor') && enriched.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(enriched.map(a => a.user_id))];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);

      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });

      enriched = enriched.map(apt => ({
        ...apt,
        // Use apt.name from appointments table, fallback to user map, then 'Patient'
        name: apt.name || userMap[apt.user_id]?.email?.split('@')[0] || 'Patient',
        email: apt.email || userMap[apt.user_id]?.email || '',
      }));
    }

    res.json({ success: true, appointments: enriched });
  } catch (error) {
    console.error('Fetch appointments error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
}

app.get('/my-appointments', authMiddleware, getMyAppointments);
app.get('/api/appointments', authMiddleware, getMyAppointments);
app.get('/api/my-appointments', authMiddleware, getMyAppointments);

// ═══════════════════════════════════════════════════════════
// 5. GET /all-appointments — admin only
// ═══════════════════════════════════════════════════════════
app.get('/all-appointments', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    // Enrich with user info
    let enriched = data || [];
    if (enriched.length > 0) {
      const userIds = [...new Set(enriched.map(a => a.user_id))];
      const { data: usersData } = await supabase.from('users').select('id, email').in('id', userIds);
      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });

      enriched = enriched.map(apt => ({
        ...apt,
        name: apt.name || userMap[apt.user_id]?.email?.split('@')[0] || 'Patient',
        email: apt.email || userMap[apt.user_id]?.email || '',
      }));
    }

    res.json({ success: true, appointments: enriched });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
});

app.get('/api/all-appointments', authMiddleware, adminOnly, (req, res) => {
  req.url = '/all-appointments';
  app.handle(req, res);
});

// ═══════════════════════════════════════════════════════════
// 6. PUT /update-status — admin only
//    Updates status and sends email notification to the user
// ═══════════════════════════════════════════════════════════
async function updateStatus(req, res) {
  try {
    const appointmentId = req.params.id || req.body.id;
    const { status } = req.body;

    if (!appointmentId) return res.status(400).json({ success: false, message: 'Appointment ID required' });
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Pending, Approved, or Rejected' });
    }

    // Get appointment
    const { data: apt, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !apt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    // Update
    const { error: updateErr } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', appointmentId);

    if (updateErr) throw updateErr;
    console.log(`✅ Appointment ${appointmentId} → ${status}`);

    // Get user email for notification
    const { data: aptUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', apt.user_id)
      .single();

    const userEmail = aptUser?.email;
    if (userEmail) {
      try {
        const statusEmoji = status === 'Approved' ? '✅' : status === 'Rejected' ? '❌' : '⏳';
        const statusColor = status === 'Approved' ? '#10b981' : status === 'Rejected' ? '#ef4444' : '#f59e0b';
        const svc = { cleaning:'Professional Cleaning', rootcanal:'Root Canal', implants:'Dental Implants', braces:'Braces', whitening:'Teeth Whitening', cosmetic:'Cosmetic Dentistry', extraction:'Tooth Extraction', pediatric:'Pediatric Dentistry' };

        await transporter.sendMail({
          from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
          to: userEmail,
          subject: `${statusEmoji} Appointment ${status} — Clinical Serenity`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
              <h1 style="color:#0f172a;font-size:22px;margin:0 0 24px;text-align:center">Clinical Serenity</h1>
              <p style="color:#475569;font-size:15px">Your appointment status has been updated:</p>
              <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:16px 0">
                <table style="width:100%;border-collapse:collapse">
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Service</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right">${svc[apt.service] || apt.service}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Date</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right">${new Date(apt.date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Time</td><td style="padding:8px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right">${apt.time || 'N/A'}</td></tr>
                  <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">Status</td><td style="padding:8px 0;text-align:right"><span style="background:${statusColor}15;color:${statusColor};border:1px solid ${statusColor}30;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700">${statusEmoji} ${status}</span></td></tr>
                </table>
              </div>
              ${status === 'Approved' ? '<p style="color:#10b981;background:#ecfdf5;padding:14px;border-radius:10px;border-left:4px solid #10b981">🎉 Your appointment is confirmed!</p>' : ''}
              ${status === 'Rejected' ? '<p style="color:#ef4444;background:#fef2f2;padding:14px;border-radius:10px;border-left:4px solid #ef4444">Your appointment could not be accommodated. Please reschedule.</p>' : ''}
            </div>
          `,
        });
        console.log(`📧 Notification sent to ${userEmail}`);
        return res.json({ success: true, message: `Appointment ${status}. Email sent to ${userEmail}.` });
      } catch (emailErr) {
        console.error('Email failed:', emailErr.message);
      }
    }

    res.json({ success: true, message: `Appointment ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
}

app.put('/update-status', authMiddleware, adminOnly, updateStatus);
app.patch('/api/appointments/:id/status', authMiddleware, adminOnly, updateStatus);
app.put('/api/update-status', authMiddleware, adminOnly, updateStatus);

// ═══════════════════════════════════════════════════════════
// DELETE /api/appointments/:id — admin only
// ═══════════════════════════════════════════════════════════
app.delete('/api/appointments/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { error } = await supabase.from('appointments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/admin/users — admin only
// ═══════════════════════════════════════════════════════════
app.get('/api/admin/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('id', { ascending: false });
    if (error) throw error;
    res.json({ success: true, users: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/admin/invite-doctor — admin only
// ═══════════════════════════════════════════════════════════
app.post('/api/admin/invite-doctor', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // 2. Generate invite link via Supabase Auth Admin API
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email.trim().toLowerCase(),
      options: {
        data: { name: name.trim(), role: 'doctor' },
        redirectTo: 'http://localhost:5173/set-password'
      }
    });

    if (linkError) {
      console.error('GENERATE LINK FAILED — Invite error:', linkError);
      return res.status(500).json({ success: false, message: linkError.message || 'Failed to generate invite link' });
    }

    const actionLink = linkData.properties?.action_link;
    const authUser = linkData.user;

    // 3. Send email via Nodemailer
    try {
      await transporter.sendMail({
        from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
        to: email.trim().toLowerCase(),
        subject: 'Doctor Invitation — Clinical Serenity',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
            <h1 style="color:#0f172a;font-size:22px;text-align:center;margin:0 0 20px">Clinical Serenity</h1>
            <p style="color:#475569;font-size:15px">Hi Dr. ${name},</p>
            <p style="color:#475569;font-size:15px">You have been invited to join Clinical Serenity as a Doctor.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${actionLink}" style="background:#0D9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Accept Invitation & Set Password</a>
            </div>
            <p style="color:#94a3b8;font-size:13px;word-break:break-all;">If the button doesn't work, copy this link: <br/>${actionLink}</p>
          </div>
        `
      });
      console.log('EMAIL SENT SUCCESS — Doctor invited:', email);
    } catch (emailErr) {
      console.error('EMAIL SEND FAILED:', emailErr);
      // We still created the user in auth, maybe we shouldn't insert to public.users?
      // Actually we should fail the request if email fails so they can retry.
      // But user is already in auth... Let's delete them from auth if email fails
      await supabase.auth.admin.deleteUser(authUser.id);
      return res.status(500).json({ success: false, message: 'Failed to send invite email. Please try again.' });
    }

    // 4. Insert into public.users table
    const { error: insertError } = await supabase
      .from('users')
      .insert([{
        id: authUser.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'doctor',
        phone: 'N/A'
      }]);

    if (insertError) {
      console.error('INSERT USER FAILED — error:', insertError);
      return res.status(500).json({ success: false, message: 'Invited, but failed to save to database' });
    }

    res.json({ success: true, message: 'Doctor invited successfully. Email sent to ' + email });
  } catch (error) {
    console.error('SERVER ERROR — Invite doctor:', error);
    res.status(500).json({ success: false, message: 'Server error during invite' });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/admin/delete-user/:id — admin only
// Deletes user from users table AND Supabase Auth
// ═══════════════════════════════════════════════════════════
app.delete('/api/admin/delete-user/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Admin deleting user: ${id}`);

    // 1. Delete associated reports
    const { error: reportsErr } = await supabase.from('reports').delete().eq('patient_id', id);
    if (reportsErr) console.warn('Reports cleanup warning:', reportsErr.message);

    // 2. Delete from users table (appointments cascade via FK)
    const { error: dbError } = await supabase.from('users').delete().eq('id', id);
    if (dbError) {
      console.error('❌ Delete user DB error:', dbError);
      return res.status(500).json({ success: false, message: dbError.message });
    }
    console.log(`✅ User ${id} deleted from users table`);

    // 3. Delete from Supabase Auth (may not exist for OTP-only users)
    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (authErr) {
      console.warn(`⚠️ Auth delete skipped for ${id}: ${authErr.message}`);
    } else {
      console.log(`✅ User ${id} deleted from auth.users`);
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/appointments/booked-slots?date=YYYY-MM-DD
// Returns booked time slots for a given date (auth required)
// ═══════════════════════════════════════════════════════════

// Normalize any date string to YYYY-MM-DD
function normalizeDate(dateStr) {
  if (!dateStr) return '';
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  // DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3 && parts[0].length <= 2) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  // Fallback: parse with Date constructor
  const d = new Date(dateStr);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return dateStr;
}

app.get('/api/appointments/booked-slots', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query param is required' });

    const formattedDate = normalizeDate(date);
    console.log(`📅 Checking booked slots for: ${formattedDate} (raw: ${date})`);

    const { data, error } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', formattedDate)
      .neq('status', 'Rejected');  // Rejected appointments free up the slot

    if (error) throw error;

    const bookedSlots = (data || []).map(a => a.time).filter(Boolean);
    console.log(`📅 Found ${bookedSlots.length} booked slot(s) for ${formattedDate}:`, bookedSlots);
    res.json({ success: true, bookedSlots });
  } catch (error) {
    console.error('Fetch booked slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booked slots' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/doctors — list all doctors (auth required)
// Uses service_role key so RLS doesn't block
// ═══════════════════════════════════════════════════════════
app.get('/api/doctors', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'doctor')
      .order('name', { ascending: true });

    if (error) throw error;

    console.log(`👨‍⚕️ Found ${(data || []).length} doctor(s)`);
    res.json({ success: true, doctors: data || [] });
  } catch (error) {
    console.error('Fetch doctors error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/reset-password — send reset email
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    // Generate password reset link via Supabase
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim().toLowerCase(),
      options: { redirectTo: 'http://localhost:5173/reset-password' }
    });

    if (linkError) {
      console.error('GENERATE LINK FAILED — Reset password:', linkError);
      return res.status(500).json({ success: false, message: linkError.message || 'Failed to generate reset link' });
    }

    const actionLink = linkData.properties?.action_link;

    // Send via Nodemailer
    try {
      await transporter.sendMail({
        from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
        to: email.trim().toLowerCase(),
        subject: 'Password Reset — Clinical Serenity',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
            <h1 style="color:#0f172a;font-size:22px;text-align:center;margin:0 0 20px">Clinical Serenity</h1>
            <p style="color:#475569;font-size:15px">You requested a password reset.</p>
            <div style="text-align:center;margin:30px 0;">
              <a href="${actionLink}" style="background:#0D9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;display:inline-block;">Reset Password</a>
            </div>
            <p style="color:#94a3b8;font-size:13px;word-break:break-all;">If the button doesn't work, copy this link: <br/>${actionLink}</p>
            <p style="color:#94a3b8;font-size:13px">If you didn't request this, ignore this email.</p>
          </div>
        `
      });
      console.log('EMAIL SENT SUCCESS — Reset password for:', email);
      res.json({ success: true, message: 'Password reset email sent to ' + email });
    } catch (emailErr) {
      console.error('EMAIL FAILED — Reset password email error:', emailErr);
      res.status(500).json({ success: false, message: 'Failed to send reset email' });
    }
  } catch (err) {
    console.error('SERVER ERROR — Reset password:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/admin/analytics — admin analytics data
// ═══════════════════════════════════════════════════════════
app.get('/api/admin/analytics', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Total patients
    const { count: totalPatients } = await supabase
      .from('users').select('*', { count: 'exact', head: true })
      .or('role.eq.user,role.eq.patient');

    // Total doctors
    const { count: totalDoctors } = await supabase
      .from('users').select('*', { count: 'exact', head: true })
      .eq('role', 'doctor');

    // All appointments for analytics
    const { data: allApts } = await supabase
      .from('appointments').select('service, date, status').order('date', { ascending: false });

    // Monthly bookings (last 12 months)
    const monthlyBookings = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyBookings[key] = 0;
    }
    (allApts || []).forEach(apt => {
      if (!apt.date) return;
      const key = apt.date.substring(0, 7); // YYYY-MM
      if (monthlyBookings.hasOwnProperty(key)) monthlyBookings[key]++;
    });

    // Popular services
    const serviceCounts = {};
    (allApts || []).forEach(apt => {
      serviceCounts[apt.service] = (serviceCounts[apt.service] || 0) + 1;
    });
    const popularServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([service, count]) => ({ service, count }));

    // Status breakdown
    const statusBreakdown = { Pending: 0, Approved: 0, Rejected: 0 };
    (allApts || []).forEach(apt => {
      if (statusBreakdown.hasOwnProperty(apt.status)) statusBreakdown[apt.status]++;
    });

    res.json({
      success: true,
      analytics: {
        totalPatients: totalPatients || 0,
        totalDoctors: totalDoctors || 0,
        totalAppointments: (allApts || []).length,
        monthlyBookings,
        popularServices,
        statusBreakdown,
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/upload-report — doctor uploads report file
// ═══════════════════════════════════════════════════════════
app.post('/api/upload-report', authMiddleware, doctorOnly, upload.single('file'), async (req, res) => {
  try {
    const { patient_id, notes } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!patient_id) return res.status(400).json({ success: false, message: 'Patient ID is required' });

    // Upload to Supabase Storage
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = `reports/${patient_id}/${fileName}`;

    const { error: uploadErr } = await supabase.storage
      .from('reports')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      return res.status(500).json({ success: false, message: 'Failed to upload file: ' + uploadErr.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(filePath);
    const fileUrl = urlData?.publicUrl;

    // Save record in DB
    const { data: report, error: dbErr } = await supabase
      .from('reports')
      .insert([{
        patient_id,
        doctor_id: req.user.id,
        file_url: fileUrl,
        file_name: file.originalname,
        file_type: file.mimetype,
        notes: notes || '',
      }])
      .select()
      .single();

    if (dbErr) {
      console.error('Report DB insert error:', dbErr);
      return res.status(500).json({ success: false, message: 'File uploaded but failed to save record' });
    }

    console.log(`📄 Report uploaded by Dr. ${req.user.name} for patient ${patient_id}`);
    res.status(201).json({ success: true, message: 'Report uploaded', report });
  } catch (err) {
    console.error('Upload report error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to upload report' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/patient/reports — patient views their reports
// ═══════════════════════════════════════════════════════════
app.get('/api/patient/reports', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('patient_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with doctor name
    let enriched = data || [];
    if (enriched.length > 0) {
      const docIds = [...new Set(enriched.map(r => r.doctor_id).filter(Boolean))];
      if (docIds.length > 0) {
        const { data: docs } = await supabase.from('users').select('id, name').in('id', docIds);
        const docMap = {};
        (docs || []).forEach(d => { docMap[d.id] = d.name; });
        enriched = enriched.map(r => ({ ...r, doctor_name: docMap[r.doctor_id] || 'Doctor' }));
      }
    }

    res.json({ success: true, reports: enriched });
  } catch (err) {
    console.error('Fetch patient reports error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/doctor/patients — doctor's unique patients
// ═══════════════════════════════════════════════════════════
app.get('/api/doctor/patients', authMiddleware, doctorOnly, async (req, res) => {
  try {
    const { data: apts, error } = await supabase
      .from('appointments')
      .select('user_id, name, email, phone')
      .eq('doctor_id', req.user.id);

    if (error) throw error;

    // Deduplicate by user_id
    const patientMap = {};
    (apts || []).forEach(apt => {
      if (!patientMap[apt.user_id]) {
        patientMap[apt.user_id] = {
          id: apt.user_id,
          name: apt.name || 'Patient',
          email: apt.email || '',
          phone: apt.phone || '',
        };
      }
    });

    res.json({ success: true, patients: Object.values(patientMap) });
  } catch (err) {
    console.error('Doctor patients error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch patients' });
  }
});

// ═══════════════════════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

// ═══════════════════════════════════════════════════════════
// JSON 404 handler (no HTML responses)
// ═══════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ═══════════════════════════════════════════════════════════
// Global error handler (returns JSON, never HTML)
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
  }
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// ═══════════════════════════════════════════════════════════
// Cron: Daily appointment reminders (8 AM every day)
// ═══════════════════════════════════════════════════════════
cron.schedule('0 8 * * *', async () => {
  console.log('⏰ Running appointment reminder cron job...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const { data: apts, error } = await supabase
      .from('appointments')
      .select('*, users!appointments_user_id_fkey(email, name)')
      .eq('date', tomorrowStr)
      .eq('status', 'Approved');

    if (error) {
      console.error('Reminder cron DB error:', error);
      return;
    }

    console.log(`📧 Found ${(apts || []).length} appointment(s) for tomorrow (${tomorrowStr})`);

    for (const apt of (apts || [])) {
      const email = apt.email || apt.users?.email;
      if (!email) continue;

      try {
        await transporter.sendMail({
          from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
          to: email,
          subject: '📅 Appointment Reminder — Clinical Serenity',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:40px 30px;background:#fff;border-radius:16px;border:1px solid #e2e8f0">
              <h1 style="color:#0f172a;font-size:22px;text-align:center;margin:0 0 20px">Clinical Serenity</h1>
              <p style="color:#475569;font-size:15px">Hi ${apt.name || 'Patient'},</p>
              <p style="color:#475569;font-size:15px">This is a reminder that you have an appointment <strong>tomorrow</strong>:</p>
              <div style="background:#f0fdfa;border:2px solid #0D9488;border-radius:12px;padding:20px;margin:16px 0">
                <p style="margin:4px 0;color:#0f172a"><strong>Service:</strong> ${apt.service}</p>
                <p style="margin:4px 0;color:#0f172a"><strong>Date:</strong> ${tomorrowStr}</p>
                <p style="margin:4px 0;color:#0f172a"><strong>Time:</strong> ${apt.time || 'TBD'}</p>
              </div>
              <p style="color:#94a3b8;font-size:13px">If you need to reschedule, please contact us.</p>
            </div>
          `,
        });
        console.log(`✅ Reminder sent to ${email}`);
      } catch (emailErr) {
        console.error(`❌ Reminder failed for ${email}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error('Reminder cron error:', err);
  }
});

// ─── Start ───────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`🚀 Clinical Serenity API — Port ${PORT}`);
  console.log('═══════════════════════════════════════════');

  // Verify database
  try {
    const { error: uErr } = await supabase.from('users').select('id').limit(1);
    console.log(uErr ? `❌ users table: ${uErr.message}` : '✅ users table OK');
    const { error: aErr } = await supabase.from('appointments').select('id, name, email, phone').limit(1);
    console.log(aErr ? `❌ appointments table: ${aErr.message}` : '✅ appointments table OK');
    const { error: rErr } = await supabase.from('reports').select('id').limit(1);
    console.log(rErr ? `⚠️  reports table: ${rErr.message} (run migration-v2.sql)` : '✅ reports table OK');
  } catch (e) {
    console.error('❌ DB check failed:', e.message);
  }

  // Verify SMTP
  transporter.verify((err) => {
    console.log(err ? `⚠️  SMTP: ${err.message}` : '✅ SMTP ready');
  });

  console.log('');
  console.log('📋 Routes:');
  console.log('  POST /send-otp');
  console.log('  POST /verify-otp');
  console.log('  POST /book-appointment');
  console.log('  GET  /my-appointments');
  console.log('  GET  /all-appointments       (admin)');
  console.log('  PUT  /update-status           (admin)');
  console.log('  DEL  /admin/delete-user/:id   (admin)');
  console.log('  GET  /admin/analytics         (admin)');
  console.log('  POST /auth/reset-password');
  console.log('  POST /upload-report           (doctor)');
  console.log('  GET  /patient/reports');
  console.log('  GET  /doctor/patients          (doctor)');
  console.log('  ⏰  Cron: daily reminder at 8 AM');
  console.log('');
});
