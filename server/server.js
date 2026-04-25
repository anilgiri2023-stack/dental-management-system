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
const { sendEmail } = require('./services/emailService');

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type "${file.mimetype}" is not allowed. Only PDF, JPG, and PNG files are accepted.`));
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
      return res.json({ success: true, user: { id: data.id, email: data.email, name: data.name, phone: data.phone, role: data.role, avatar_url: data.avatar_url || null } });
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
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: 'doctor', avatar_url: user.avatar_url || null },
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

    // ─── Email Logic ───
    if (email) {
      const subject = 'Appointment Booked Successfully';
      const message = `Dear ${name},\n\nYour appointment for ${service} has been successfully booked for ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${time}.\n\nWe will notify you once the doctor reviews and approves it.\n\nThank you,\nClinical Serenity`;
      // Send email without blocking the response
      sendEmail(email, subject, message);
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

    // Enrich appointments with user details for admin and doctor view
    let enriched = data || [];
    if ((req.user.role === 'admin' || req.user.role === 'doctor') && enriched.length > 0) {
      // Get unique user IDs
      const userIds = [...new Set(enriched.map(a => a.user_id).filter(Boolean))];
      
      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, name, phone')
        .in('id', userIds);

      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });

      enriched = enriched.map(apt => {
        const dbUser = userMap[apt.user_id] || {};
        return {
          ...apt,
          // Prioritize data in appointments table (set during booking), fallback to users table
          name: apt.name || dbUser.name || 'Patient',
          email: apt.email || dbUser.email || '',
          phone: apt.phone || dbUser.phone || '',
        };
      });
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
      const userIds = [...new Set(enriched.map(a => a.user_id).filter(Boolean))];
      const doctorIds = [...new Set(enriched.map(a => a.doctor_id).filter(Boolean))];
      const allIdsToFetch = [...new Set([...userIds, ...doctorIds])];
      
      const { data: usersData } = await supabase.from('users').select('id, email, name, phone, role').in('id', allIdsToFetch);
      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });

      enriched = enriched.map(apt => {
        const dbUser = userMap[apt.user_id] || {};
        const doctorUser = apt.doctor_id ? userMap[apt.doctor_id] : null;
        return {
          ...apt,
          name: apt.name || dbUser.name || 'Patient',
          email: apt.email || dbUser.email || '',
          phone: apt.phone || dbUser.phone || '',
          doctor_name: doctorUser ? doctorUser.name : 'N/A'
        };
      });
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
// PATCH /api/doctor/appointments/:id/status — doctor updates own appointment
// ═══════════════════════════════════════════════════════════
app.patch('/api/doctor/appointments/:id/status', authMiddleware, doctorOnly, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { status } = req.body;
    
    if (!appointmentId) return res.status(400).json({ success: false, message: 'Appointment ID required' });
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be Pending, Approved, or Rejected' });
    }

    // Verify the appointment belongs to this doctor
    const { data: apt, error: fetchErr } = await supabase
      .from('appointments').select('*').eq('id', appointmentId).single();
    if (fetchErr || !apt) return res.status(404).json({ success: false, message: 'Appointment not found' });
    if (apt.doctor_id !== req.user.id) return res.status(403).json({ success: false, message: 'Not your appointment' });

    const { error: updateErr } = await supabase
      .from('appointments').update({ status }).eq('id', appointmentId);
    if (updateErr) throw updateErr;

    // ─── Email Logic ───
    const patientEmail = apt.email || apt.patient_email; // Handle potential schema variations
    if (patientEmail && status !== 'Pending') {
      let subject, message;
      if (status === 'Approved') {
        subject = 'Appointment Approved';
        message = 'Your appointment has been approved by the doctor.';
      } else if (status === 'Rejected') {
        subject = 'Appointment Rejected';
        message = 'Your appointment has been rejected. Please contact clinic.';
      }
      // Send email without blocking the response
      sendEmail(patientEmail, subject, message);
    } else {
      console.log(`⚠️ No email sent for appointment ${appointmentId}. Status: ${status}`);
    }

    console.log(`🩺 Doctor ${req.user.id} updated appointment ${appointmentId} → ${status}`);
    res.json({ success: true, message: `Appointment ${status}` });
  } catch (err) {
    console.error('Doctor status update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

// ═══════════════════════════════════════════════════════════
// Avatar upload (images only, 2MB max)
// ═══════════════════════════════════════════════════════════
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WebP images are allowed for avatars'));
  },
});

// POST /api/avatar/upload — upload profile picture
app.post('/api/avatar/upload', authMiddleware, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No image file provided' });

    const userId = req.user.id;
    const fileExt = file.originalname.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}.${fileExt}`;

    console.log("Uploading to Supabase bucket: avatars");
    console.log("File name:", fileName);

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadErr) {
      console.error('❌ Avatar storage error:', uploadErr);
      return res.status(500).json({ success: false, message: `Avatar upload failed: ${uploadErr.message}` });
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatar_url = urlData?.publicUrl;

    // Save URL in users table
    const { error: dbErr } = await supabase
      .from('users').update({ avatar_url }).eq('id', userId);
    if (dbErr) {
      console.error('❌ Avatar DB update error:', dbErr);
      return res.status(500).json({ success: false, message: `Avatar saved but DB update failed: ${dbErr.message}` });
    }

    console.log(`✅ Avatar updated for ${userId}: ${avatar_url}`);
    res.json({ success: true, avatar_url });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/avatar — get current user's avatar
app.get('/api/avatar', authMiddleware, async (req, res) => {
  try {
    const { data } = await supabase
      .from('users').select('avatar_url').eq('id', req.user.id).single();
    res.json({ success: true, avatar_url: data?.avatar_url || null });
  } catch {
    res.json({ success: true, avatar_url: null });
  }
});

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

    if (!id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Protection: Don't allow deleting the admin user (checking by role)
    const { data: targetUser, error: fetchErr } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', id)
      .single();

    if (fetchErr || !targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an admin user' });
    }

    // 1. Delete associated reports
    const { error: reportsErr } = await supabase.from('reports').delete().eq('patient_id', id);
    if (reportsErr) console.warn('Reports cleanup warning:', reportsErr.message);

    // 2. Delete associated appointments
    const { error: aptsErr } = await supabase.from('appointments').delete().eq('user_id', id);
    if (aptsErr) console.warn('Appointments cleanup warning:', aptsErr.message);

    // 3. Delete from users table
    const { error: dbError } = await supabase.from('users').delete().eq('id', id);
    if (dbError) {
      console.error('❌ Delete user DB error:', dbError);
      return res.status(500).json({ success: false, message: 'Database deletion failed: ' + dbError.message });
    }
    console.log(`✅ User ${id} deleted from users table`);

    // 4. Delete from Supabase Auth (may not exist for OTP-only users)
    const { error: authErr } = await supabase.auth.admin.deleteUser(id);
    if (authErr) {
      console.warn(`⚠️ Auth delete skipped for ${id}: ${authErr.message}`);
    } else {
      console.log(`✅ User ${id} deleted from auth.users`);
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('❌ Delete user error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + (err.message || 'Unknown error') });
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

    console.log(`🔐 Password reset requested for: ${email}`);

    // Use Supabase built-in reset password functionality as requested
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: 'http://localhost:5173/reset-password',
    });

    if (error) {
      console.error('❌ Supabase resetPasswordForEmail failed:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    console.log(`✅ Supabase reset email triggered for: ${email}`);
    res.json({ success: true, message: 'Password reset email has been sent by Supabase to ' + email });
  } catch (err) {
    console.error('❌ SERVER ERROR — Reset password:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + (err.message || 'Unknown error') });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/complete-reset-password — finalize password reset
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/complete-reset-password', async (req, res) => {
  try {
    const { password, access_token } = req.body;
    if (!password || !access_token) {
      return res.status(400).json({ success: false, message: 'Password and token are required' });
    }

    // 1. Get user from Supabase using the access token
    const { data: { user }, error: authErr } = await supabase.auth.getUser(access_token);
    if (authErr || !user) {
      console.error('❌ Reset password — Invalid token:', authErr?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired session. Please request a new link.' });
    }

    console.log(`🔐 Completing password reset for: ${user.email}`);

    // 2. Update password in Supabase Auth (using service role to ensure success)
    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(user.id, {
      password: password
    });

    if (updateAuthErr) {
      console.error('❌ Reset password — Supabase Auth update failed:', updateAuthErr.message);
      return res.status(500).json({ success: false, message: 'Failed to update Auth password: ' + updateAuthErr.message });
    }

    // 3. Update password in our public.users table
    const { error: updateDbErr } = await supabase
      .from('users')
      .update({ password: password })
      .eq('id', user.id);

    if (updateDbErr) {
      console.error('❌ Reset password — public.users update failed:', updateDbErr.message);
      // We don't fail the whole request here as the Auth password is already updated, 
      // but it's good to log it.
    }

    console.log(`✅ Password reset complete for: ${user.email}`);
    res.json({ success: true, message: 'Your password has been reset successfully.' });
  } catch (err) {
    console.error('❌ SERVER ERROR — Complete reset password:', err);
    res.status(500).json({ success: false, message: 'Server error during password reset' });
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
    const { patient_id, appointment_id, title } = req.body;
    const file = req.file;
    const doctor_id = req.user.id;

    // ─── Debug: log everything received ───
    console.log('═══════════════════════════════════════');
    console.log('📤 UPLOAD-REPORT — Request received');
    console.log('  doctor_id (from JWT):', doctor_id);
    console.log('  patient_id:', patient_id);
    console.log('  appointment_id:', appointment_id);
    console.log('  title:', title);
    console.log('  file:', file ? { name: file.originalname, size: file.size, type: file.mimetype } : 'NONE');
    console.log('═══════════════════════════════════════');

    // ─── Validation ───
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    if (!patient_id) return res.status(400).json({ success: false, message: 'Patient ID is required' });
    if (!doctor_id) return res.status(400).json({ success: false, message: 'Doctor ID is missing from session. Please re-login.' });

    // ─── Validate FK references exist before insert ───
    // 1. Check doctor exists in users table
    const { data: doctorRow, error: doctorErr } = await supabase
      .from('users').select('id, role').eq('id', doctor_id).single();
    if (doctorErr || !doctorRow) {
      console.error('❌ doctor_id NOT FOUND in users table:', doctor_id, doctorErr);
      return res.status(400).json({ success: false, message: `Doctor ID "${doctor_id}" not found in users table. Your session may be stale — please log out and log back in.` });
    }
    console.log('✅ Doctor verified in users table:', doctorRow);

    // 2. Check patient exists in users table
    const { data: patientRow, error: patientErr } = await supabase
      .from('users').select('id, name, email').eq('id', patient_id).single();
    if (patientErr || !patientRow) {
      console.error('❌ patient_id NOT FOUND in users table:', patient_id, patientErr);
      return res.status(400).json({ success: false, message: `Patient ID "${patient_id}" not found in users table.` });
    }
    console.log('✅ Patient verified in users table:', patientRow);

    // 3. Check appointment exists (if provided)
    if (appointment_id) {
      const { data: aptRow, error: aptErr } = await supabase
        .from('appointments').select('id').eq('id', appointment_id).single();
      if (aptErr || !aptRow) {
        console.error('❌ appointment_id NOT FOUND in appointments table:', appointment_id, aptErr);
        return res.status(400).json({ success: false, message: `Appointment ID "${appointment_id}" not found in appointments table.` });
      }
      console.log('✅ Appointment verified in appointments table:', aptRow);
    }

    // ─── Upload to Supabase Storage ───
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = `${patient_id}/${fileName}`;

    console.log('📤 Uploading to Supabase Storage:', { bucket: 'reports', path: filePath });

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('reports')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadErr) {
      console.error('❌ Supabase Storage upload error:', uploadErr);
      return res.status(500).json({ success: false, message: `Storage upload failed: ${uploadErr.message}` });
    }

    console.log('✅ File uploaded to storage:', uploadData);

    // ─── Get public URL ───
    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(filePath);
    const file_url = urlData?.publicUrl;
    console.log('🔗 Public URL:', file_url);

    if (!file_url) {
      return res.status(500).json({ success: false, message: 'File uploaded but failed to generate public URL.' });
    }

    const insertPayload = {
      patient_id,
      doctor_id,
      appointment_id: appointment_id || null,
      title: title || 'Medical Report',
      file_url,
    };

    console.log('📝 INSERT PAYLOAD for reports table:', JSON.stringify(insertPayload, null, 2));

    // ─── Insert into DB ───
    const { data: report, error: dbErr } = await supabase
      .from('reports')
      .insert([insertPayload])
      .select()
      .single();

    if (dbErr) {
      console.error('❌ REPORT DB INSERT ERROR:', {
        message: dbErr.message,
        details: dbErr.details,
        hint: dbErr.hint,
        code: dbErr.code,
      });
      return res.status(500).json({
        success: false,
        message: `DB insert failed: ${dbErr.message}${dbErr.details ? ' — ' + dbErr.details : ''}${dbErr.hint ? ' (Hint: ' + dbErr.hint + ')' : ''}`,
      });
    }

    console.log(`✅ Report record created: ${report.id}, URL: ${file_url}`);
    res.status(201).json({ success: true, message: 'Report uploaded successfully', report });
  } catch (err) {
    console.error('❌ Upload report error:', err);
    res.status(500).json({ success: false, message: `Upload error: ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/edit-report — doctor edits existing report (with optional new file)
// ═══════════════════════════════════════════════════════════
app.post('/api/edit-report', authMiddleware, doctorOnly, upload.single('file'), async (req, res) => {
  try {
    const { report_id, patient_id, title } = req.body;
    const file = req.file;

    if (!report_id) {
      return res.status(400).json({ success: false, message: 'Report ID is required' });
    }

    console.log(`✏️ Editing report: ${report_id}`, { hasFile: !!file, title });
    if (file) {
      console.log('📎 New file info:', { name: file.originalname, size: file.size, type: file.mimetype });
    }

    // Get existing report
    const { data: existing, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', report_id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check ownership
    if (existing.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this report' });
    }

    let file_url = existing.file_url;

    // Upload new file if provided
    if (file) {
      const ownerPatientId = patient_id || existing.patient_id;
      const ext = path.extname(file.originalname);
      const storageFileName = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
      const filePath = `${ownerPatientId}/${storageFileName}`;

      console.log('📤 Uploading replacement file to:', { bucket: 'reports', path: filePath });

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('reports')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (uploadErr) {
        console.error('❌ Edit storage upload error:', uploadErr);
        return res.status(500).json({ success: false, message: `Storage upload failed: ${uploadErr.message}` });
      }

      console.log('✅ Replacement file uploaded:', uploadData);

      const { data: urlData } = supabase.storage.from('reports').getPublicUrl(filePath);
      file_url = urlData?.publicUrl;
      console.log('🔗 New public URL:', file_url);
    }

    // Update record
    const { data: updated, error: updateErr } = await supabase
      .from('reports')
      .update({
        file_url,
        title: title || existing.title,
      })
      .eq('id', report_id)
      .select()
      .single();

    if (updateErr) {
      console.error('❌ Report update error:', updateErr);
      return res.status(500).json({ success: false, message: `Report update failed: ${updateErr.message}` });
    }

    console.log(`✅ Report ${report_id} updated successfully`);
    res.json({ success: true, message: 'Report updated successfully', report: updated });
  } catch (err) {
    console.error('❌ Edit report error:', err);
    res.status(500).json({ success: false, message: `Edit error: ${err.message}` });
  }
});

// ═══════════════════════════════════════════════════════════
// PUT /api/reports/:id — doctor updates report title only
// ═══════════════════════════════════════════════════════════
app.put('/api/reports/:id', authMiddleware, doctorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const doctorId = req.user.id;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Report ID is required' });
    }

    // Check ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (existing.doctor_id !== doctorId) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this report' });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('reports')
      .update({ title: title || existing.title })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('❌ Report title update error:', updateErr);
      return res.status(500).json({ success: false, message: 'Failed to update report title' });
    }

    console.log(`✅ Report ${id} title updated`);
    res.json({ success: true, message: 'Report updated successfully', report: updated });
  } catch (err) {
    console.error('❌ Update report error:', err);
    res.status(500).json({ success: false, message: 'Server error during report update' });
  }
});

// ═══════════════════════════════════════════════════════════
// DELETE /api/reports/:id — doctor deletes their own report
// ═══════════════════════════════════════════════════════════
app.delete('/api/reports/:id', authMiddleware, doctorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const doctorId = req.user.id;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Report ID is required' });
    }

    console.log(`🗑️ Doctor ${doctorId} deleting report: ${id}`);

    // First get the report to check ownership and get file_url
    const { data: report, error: fetchErr } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Check ownership
    if (report.doctor_id !== doctorId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    }

    // Delete from database
    const { error: deleteErr } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      console.error('❌ Report delete error:', deleteErr);
      return res.status(500).json({ success: false, message: 'Failed to delete report' });
    }

    console.log(`✅ Report ${id} deleted successfully`);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (err) {
    console.error('❌ Delete report error:', err);
    res.status(500).json({ success: false, message: 'Server error during report deletion' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/doctor/reports — doctor views their uploaded reports
// ═══════════════════════════════════════════════════════════
app.get('/api/doctor/reports', authMiddleware, doctorOnly, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Ensure full URLs for files
    let enriched = data || [];
    if (enriched.length > 0) {
      enriched = enriched.map(r => {
        if (r.file_url && !r.file_url.startsWith('http')) {
          const { data: urlData } = supabase.storage.from('reports').getPublicUrl(r.file_url);
          return { ...r, file_url: urlData?.publicUrl };
        }
        return r;
      });
    }

    console.log(`📋 Doctor ${doctorId} fetched ${enriched.length} reports`);
    res.json({ success: true, reports: enriched });
  } catch (err) {
    console.error('❌ Doctor reports fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
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

    // Enrich with doctor name and ensure full URLs for files
    let enriched = data || [];
    if (enriched.length > 0) {
      // 1. Handle file URLs
      enriched = enriched.map(r => {
        if (r.file_url && !r.file_url.startsWith('http')) {
          const { data: urlData } = supabase.storage.from('reports').getPublicUrl(r.file_url);
          return { ...r, file_url: urlData?.publicUrl };
        }
        return r;
      });

      // 2. Add doctor names
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
    // Check reports table with ALL columns used in insert
    const { error: rErr } = await supabase.from('reports').select('id, patient_id, doctor_id, appointment_id, title, file_url').limit(1);
    if (rErr) {
      console.log(`⚠️  reports table: ${rErr.message}`);
      console.log('   ↳ Run migration-v2.sql AND update-reports-schema.sql in Supabase SQL Editor');
    } else {
      console.log('✅ reports table OK (all columns verified)');
    }
    // Check storage bucket
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucket = (buckets || []).find(b => b.name === 'reports');
    if (reportsBucket) {
      console.log(`✅ Storage bucket "reports" OK (public: ${reportsBucket.public})`);
    } else {
      console.log('⚠️  Storage bucket "reports" NOT FOUND — create it in Supabase Dashboard → Storage');
    }
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
