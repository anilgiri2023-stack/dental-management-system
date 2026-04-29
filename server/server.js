// ═══════════════════════════════════════════════════════════
// Clinical Serenity — Full-Stack Backend API
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

dotenv.config(); // Must be called before local imports

const { sendEmail, sendOTP } = require('./utils/emailService');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Auth Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Supabase (Service Role — bypasses RLS) ──────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY;
const SERVICE_ROLE_KEY_SOURCE = process.env.SERVICE_ROLE_KEY
  ? 'SERVICE_ROLE_KEY'
  : process.env.SUPABASE_SERVICE_ROLE_KEY
    ? 'SUPABASE_SERVICE_ROLE_KEY'
    : process.env.SUPABASE_SERVICE_KEY
      ? 'SUPABASE_SERVICE_KEY'
      : null;

function getSupabaseProjectRef(url) {
  try {
    return new URL(url).hostname.split('.')[0];
  } catch {
    return 'invalid-url';
  }
}

function getJwtRole(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(decoded).role || 'unknown';
  } catch {
    return 'unknown';
  }
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAppointmentDate(dateValue) {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

async function sendReportReadyEmail({ patientEmail, patientName, doctorName }) {
  if (!patientEmail) {
    console.log('📧 Report email skipped: patient email missing');
    return;
  }

  const frontendUrl = (process.env.FRONTEND_URL || "https://example.com").replace(/\/+$/, '');
  const logoUrl = process.env.LOGO_URL || "https://via.placeholder.com/150";
  const reportUrl = `${frontendUrl}/patient-reports`;

  const reportHtmlTemplate = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px; margin:0;">
  <div style="display:none; max-height:0; overflow:hidden;">Your medical report has been uploaded by Clinical Serenity.</div>
  <div style="max-width:600px; width:100%; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(15,23,42,0.12);">
    <div style="background:#0f766e; padding:24px 20px; text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="Clinical Serenity Logo" style="height:54px; max-width:180px; object-fit:contain;" />
      <h2 style="color:#ffffff; margin:12px 0 0; font-size:24px; line-height:1.2;">Clinical Serenity</h2>
    </div>

    <div style="padding:30px; color:#1f2937;">
      <h3 style="margin:0 0 14px; font-size:20px; line-height:1.4;">Hello ${escapeHtml(patientName || 'there')},</h3>
      <p style="margin:0 0 18px; color:#4b5563; font-size:15px; line-height:1.7;">Your report has been uploaded.</p>

      <div style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin:0 0 22px;">
        <div style="padding:14px 16px; background:#f8fafc; border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">Report Details</strong>
        </div>
        <div style="padding:16px;">
          <p style="margin:0 0 10px;"><strong>Patient:</strong> ${escapeHtml(patientName || 'Patient')}</p>
          <p style="margin:0;"><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName || 'Your Doctor')}</p>
        </div>
      </div>

      <div style="margin:20px 0; padding:15px; background:#f1f5f9; border-radius:8px;">
        Your medical report is now ready to view in your Clinical Serenity dashboard.
      </div>

      <div style="margin:28px 0; text-align:center;">
        <a href="${escapeHtml(reportUrl)}" style="display:inline-block; background:#0f766e; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:8px; font-weight:bold; font-size:15px;">
          View Report
        </a>
      </div>

      <p style="margin:30px 0 0; color:#374151; line-height:1.6;">Thank you,<br/>Clinical Serenity Team</p>
    </div>

    <div style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#777;">
      © Clinical Serenity. All rights reserved.
    </div>
  </div>
</div>
`;

  // Non-blocking call to email service
  sendEmail({
    to: patientEmail,
    subject: "Your Medical Report is Ready 🧾",
    html: reportHtmlTemplate,
  }).catch(err => {
    console.error("❌ Failed to send report email:", err);
  });
}

console.log('SUPABASE_URL:', SUPABASE_URL || 'MISSING');
console.log("ENV:", process.env.SUPABASE_URL);
console.log('SUPABASE_PROJECT_REF:', SUPABASE_URL ? getSupabaseProjectRef(SUPABASE_URL) : 'MISSING');
console.log('SUPABASE_KEY_SOURCE:', SERVICE_ROLE_KEY_SOURCE || 'MISSING');
console.log('SUPABASE_KEY_ROLE:', SERVICE_ROLE_KEY ? getJwtRole(SERVICE_ROLE_KEY) : 'MISSING');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY) in Vercel.');
} else if (getJwtRole(SERVICE_ROLE_KEY) !== 'service_role') {
  console.error('Supabase backend key is not service_role. Replace it with the Supabase service role key in Vercel.');
}

const supabase = createClient(
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Email system is now using Nodemailer with Brevo SMTP.
// Outdated email references have been removed.

// Simple in-memory throttle to prevent hitting Supabase rate limits too hard
const otpThrottle = new Map();
const THROTTLE_WINDOW = 30000; // 30 seconds

// ─── JWT ─────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ─── Auth Middleware ─────────────────────────────────────
async function authMiddleware(req, res, next) {
  try {
    // 1. Accept user data from frontend via headers (Requirement #2)
    const xUser = req.headers['x-user'];
    
    if (xUser) {
      try {
        // Decode base64 user object
        const decodedUser = JSON.parse(decodeURIComponent(escape(Buffer.from(xUser, 'base64').toString())));
        
        if (decodedUser && decodedUser.id) {
          req.user = {
            ...decodedUser,
            role: decodedUser.role || 'user'
          };
          return next();
        }
      } catch (parseErr) {
        console.error('❌ Failed to parse x-user header:', parseErr.message);
      }
    }

    // 2. Fallback to token validation (Legacy/Custom JWT)
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      try {
        req.user = jwt.verify(token, JWT_SECRET);
        return next();
      } catch (jwtErr) {
        console.error('❌ Legacy JWT verification failed');
      }
    }

    // 3. If neither provided, return 401 (Requirement #5)
    return res.status(401).json({ success: false, message: 'Authentication required' });

  } catch (err) {
    console.error('Middleware error:', err.message);
    return res.status(401).json({ success: false, message: 'Authentication error' });
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

async function ensureStorageBucket(bucketName, options = {}) {
  const { public: isPublic = false } = options;
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error(`❌ Failed to list Supabase storage buckets for "${bucketName}":`, listError);
    throw listError;
  }

  const bucket = (buckets || []).find((item) => item.name === bucketName);

  if (!bucket) {
    console.log(`🪣 Creating Supabase storage bucket "${bucketName}"`);
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (createError) {
      console.error(`❌ Failed to create Supabase storage bucket "${bucketName}":`, createError);
      throw createError;
    }

    return;
  }

  if (isPublic && bucket.public !== true) {
    console.log(`🪣 Making Supabase storage bucket "${bucketName}" public`);
    const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
    });

    if (updateError) {
      console.error(`❌ Failed to update Supabase storage bucket "${bucketName}":`, updateError);
      throw updateError;
    }
  }
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
// POST /api/auth/check-user — check if email exists (public)
// ═══════════════════════════════════════════════════════════
app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const { data } = await supabase.from('users').select('id').eq('email', email.trim().toLowerCase()).single();
    res.json({ success: true, exists: !!data });
  } catch (err) {
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
  } catch (err) {
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

function redactSensitiveRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(({ password, password_hash, passwordHash, ...safeRow }) => ({
    ...safeRow,
    ...(password ? { password: '[REDACTED]' } : {}),
    ...(password_hash ? { password_hash: '[REDACTED]' } : {}),
    ...(passwordHash ? { passwordHash: '[REDACTED]' } : {})
  }));
}

async function validatePassword(plainPassword, storedPassword) {
  if (!storedPassword) return false;

  if (storedPassword.startsWith('$2')) {
    return bcrypt.compare(plainPassword, storedPassword);
  }

  return storedPassword === plainPassword;
}

// GET /api/test-admin — temporary DB connectivity check for the admins table
app.get('/api/test-admin', async (req, res) => {
  try {
    const result = await supabase.from('admins').select('*');

    console.log('TEST_ADMIN_DATA:', redactSensitiveRows(result.data));
    console.log('TEST_ADMIN_ERROR:', result.error);

    res.status(result.error ? 500 : 200).json({
      ...result,
      data: redactSensitiveRows(result.data)
    });
  } catch (error) {
    console.error('TEST_ADMIN_EXCEPTION:', error);
    res.status(500).json({ data: null, error: { message: error.message } });
  }
});

// ═══════════════════════════════════════════════════════════
// Unified Authentication Logic (Requirement #1 & #7)
// ═══════════════════════════════════════════════════════════
async function handleAdminLogin(req, res) {
  try {
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    email = email.trim().toLowerCase();

    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', email);

    console.log('EMAIL:', email);
    console.log('DATA:', redactSensitiveRows(data));
    console.log('ERROR:', error);

    if (error) {
      return res.status(500).json({ success: false, message: error.message || 'Failed to fetch admin account' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found. Please contact support.' });
    }

    const admin = data[0];
    const storedPassword = admin.password || admin.password_hash || admin.passwordHash;
    const isMatch = await validatePassword(password, storedPassword);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const adminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name || admin.full_name || admin.email,
      role: 'admin',
      avatar_url: admin.avatar_url || null
    };

    const token = signToken(adminUser);
    res.json({ success: true, token, user: adminUser });
  } catch (err) {
    console.error('🔥 Admin login error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
}

async function handleLogin(req, res, targetRole) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const trimmedEmail = email.trim().toLowerCase();
    
    // 1. Fetch user
    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .ilike('email', trimmedEmail);

    if (dbError) {
      return res.status(500).json({ success: false, message: dbError.message || 'Failed to fetch account' });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found. Please contact support.' });
    }

    const user = data[0];

    if (user.role !== targetRole && targetRole !== 'any') {
      return res.status(403).json({ success: false, message: `Access denied: This account is not a ${targetRole}.` });
    }

    // 2. Validate Password Existence (Requirement #5 & #6)
    if (!user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Password missing. Please set your password using the "Forgot Password" or invitation link.' 
      });
    }

    // 3. Bcrypt Comparison (Requirement #1)
    let isMatch = false;
    try {
      isMatch = await validatePassword(password, user.password);
    } catch (err) {
      console.error('Bcrypt comparison failed:', err.message);
      isMatch = false;
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    // 4. Generate Session
    const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url || null }
    });

  } catch (err) {
    console.error(`🔥 Login error for ${targetRole}:`, err.message);
    res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
}

app.post('/api/admin/login', handleAdminLogin);
app.post('/api/doctor/login', (req, res) => handleLogin(req, res, 'doctor'));

// ═══════════════════════════════════════════════════════════
// 3. POST /book-appointment
//    Accepts: date, time, service
//    user_id comes from JWT (NEVER from frontend)
// ═══════════════════════════════════════════════════════════
async function bookAppointment(req, res) {
  try {
    const { date, time, service, phone, name, email, doctor_id } = req.body;
    
    // 1. Use user attached by authMiddleware (Requirement #1: Removed supabase.auth.getUser)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const user = req.user;

    // 4. Log user.id for debugging (Requirement #4)
    console.log('--- Appointment Booking Debug ---');
    console.log('Authenticated User ID:', user.id);

    if (!date || !time || !service || !name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'All booking fields are required' });
    }

    // 2. Construct final insert payload (Requirement #2 & #3)
    const insertData = {
      user_id: user.id,
      doctor_id: doctor_id || null,
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

    console.log(`📅 Appointment booked: ${service} on ${date} at ${time} [user: ${user.id}]`);

    try {
      console.log("📧 Fetching doctor details...");
      let doctorName = "Assigned Doctor";
      
      if (doctor_id) {
        const { data: doctorData } = await supabase
          .from('users')
          .select('name')
          .eq('id', doctor_id)
          .single();
        
        if (doctorData) doctorName = doctorData.name || "Assigned Doctor";
      }

      console.log("📧 Sending appointment email...");

      const htmlContent = `
<div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:20px;">
  <div style="max-width:600px;margin:auto;background:white;border-radius:12px;padding:24px;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    
    <h2 style="color:#2e7d6b;">Clinical Serenity</h2>
    <p style="font-size:16px;">Hello ${name},</p>

    <p>Your appointment has been successfully booked.</p>

    <div style="background:#f9fafc;padding:15px;border-radius:8px;">
      <p><b>Doctor:</b> ${doctorName}</p>
      <p><b>Service:</b> ${service}</p>
      <p><b>Date:</b> ${date}</p>
      <p><b>Time:</b> ${time}</p>
      <p><b>Status:</b> Pending Approval</p>
    </div>

    <p style="margin-top:20px;">We look forward to serving you.</p>

    <p style="font-size:14px;color:gray;">
      — Clinical Serenity Team
    </p>
  </div>
</div>
`;

      sendEmail({
        to: email,
        subject: "Appointment Confirmation - Clinical Serenity",
        html: htmlContent
      }).catch(err => {
        console.error("❌ Appointment email failed:", err);
      });

      console.log("✅ Appointment email initiated");
    } catch (err) {
      console.error("❌ Appointment email failed:", err);
    }

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
      const doctorIds = [...new Set(enriched.map(a => a.doctor_id).filter(Boolean))];
      const allIds = [...new Set([...userIds, ...doctorIds])];

      const { data: usersData } = await supabase
        .from('users')
        .select('id, email, name, phone')
        .in('id', allIds);

      const userMap = {};
      (usersData || []).forEach(u => { userMap[u.id] = u; });

      enriched = enriched.map(apt => {
        const dbUser = userMap[apt.user_id] || {};
        const doctorUser = apt.doctor_id ? userMap[apt.doctor_id] : null;
        return {
          ...apt,
          // Prioritize data in appointments table (set during booking), fallback to users table
          name: apt.name || dbUser.name || 'Patient',
          email: apt.email || dbUser.email || '',
          phone: apt.phone || dbUser.phone || '',
          doctor_name: doctorUser ? doctorUser.name : 'N/A',
          doctorId: doctorUser ? { _id: doctorUser.id, name: doctorUser.name, email: doctorUser.email } : null
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
          doctor_name: doctorUser ? doctorUser.name : 'N/A',
          doctorId: doctorUser ? { _id: doctorUser.id, name: doctorUser.name, email: doctorUser.email } : null
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

    res.json({ success: true, message: `Appointment status updated to ${status}.` });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
}

app.put('/update-status', authMiddleware, adminOnly, updateStatus);
app.patch('/api/appointments/:id/status', authMiddleware, adminOnly, updateStatus);
app.put('/api/update-status', authMiddleware, adminOnly, updateStatus);

// PUT /api/appointment/status — doctor/admin updates status and notifies patient
app.put('/api/appointment/status', authMiddleware, async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Doctor or admin only' });
    }

    const { appointmentId, status: requestedStatus, patientEmail } = req.body;
    const normalizedStatus = String(requestedStatus || '').trim().toLowerCase();
    const statusMap = {
      approved: 'Approved',
      rejected: 'Rejected',
    };
    const dbStatus = statusMap[normalizedStatus];

    if (!appointmentId) {
      return res.status(400).json({ success: false, message: 'appointmentId is required' });
    }

    if (!dbStatus) {
      return res.status(400).json({ success: false, message: 'status must be approved or rejected' });
    }

    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'doctor' && appointment.doctor_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not your appointment' });
    }

    const recipientEmail = (patientEmail || appointment.email || '').trim();
    if (!recipientEmail) {
      return res.status(400).json({ success: false, message: 'patientEmail is required' });
    }

    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: dbStatus })
      .eq('id', appointmentId);

    if (updateError) throw updateError;

    let doctorName = req.user?.name || 'Your Doctor';
    if (appointment.doctor_id) {
      const { data: doctor } = await supabase
        .from('users')
        .select('name')
        .eq('id', appointment.doctor_id)
        .single();
      doctorName = doctor?.name || doctorName;
    }

    const logoUrl = process.env.LOGO_URL || "https://via.placeholder.com/150";
    const frontendUrl = (process.env.FRONTEND_URL || "https://example.com").replace(/\/+$/, '');
    const patientName = appointment.name || 'there';
    const date = formatAppointmentDate(appointment.date);
    const status = dbStatus;
    const statusColor = normalizedStatus === 'approved' ? '#16a34a' : '#dc2626';
    const statusBackground = normalizedStatus === 'approved' ? '#dcfce7' : '#fee2e2';
    const statusBorder = normalizedStatus === 'approved' ? '#86efac' : '#fecaca';
    const statusLabel = normalizedStatus === 'approved' ? 'Approved ✅' : 'Rejected ❌';

    const subject = normalizedStatus === 'approved'
      ? 'Appointment Approved ✅'
      : 'Appointment Rejected ❌';

    const htmlTemplate = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px; margin:0;">
  <div style="display:none; max-height:0; overflow:hidden;">Your Clinical Serenity appointment status has been updated.</div>
  <div style="max-width:600px; width:100%; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(15,23,42,0.12);">
    <div style="background:#0f766e; padding:24px 20px; text-align:center;">
      <img src="${escapeHtml(logoUrl)}" alt="Clinical Serenity Logo" style="height:54px; max-width:180px; object-fit:contain;" />
      <h2 style="color:#ffffff; margin:12px 0 0; font-size:24px; line-height:1.2;">Clinical Serenity</h2>
    </div>

    <div style="padding:30px; color:#1f2937;">
      <h3 style="margin:0 0 14px; font-size:20px; line-height:1.4;">Hello ${escapeHtml(patientName)},</h3>

      <p style="margin:0 0 18px; color:#4b5563; font-size:15px; line-height:1.7;">Your appointment status has been updated.</p>

      <div style="margin:18px 0 24px;">
        <span style="display:inline-block; padding:8px 14px; border-radius:999px; background:${statusBackground}; border:1px solid ${statusBorder}; color:${statusColor}; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.4px;">
          ${escapeHtml(statusLabel)}
        </span>
      </div>

      <div style="border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; margin:0 0 22px;">
        <div style="padding:14px 16px; background:#f8fafc; border-bottom:1px solid #e5e7eb;">
          <strong style="color:#111827;">Appointment Details</strong>
        </div>
        <div style="padding:16px;">
          <p style="margin:0 0 10px;"><strong>Patient:</strong> ${escapeHtml(patientName)}</p>
          <p style="margin:0 0 10px;"><strong>Doctor:</strong> Dr. ${escapeHtml(doctorName)}</p>
          ${date ? `<p style="margin:0 0 10px;"><strong>Appointment Date:</strong> ${escapeHtml(date)}</p>` : ''}
          <p style="margin:0;"><strong>Status:</strong> ${escapeHtml(status)}</p>
        </div>
      </div>

      <div style="margin:20px 0; padding:15px; background:#f1f5f9; border-radius:8px;">
        We appreciate your trust in Clinical Serenity.
      </div>

      <div style="margin:28px 0; text-align:center;">
        <a href="${escapeHtml(`${frontendUrl}/doctor`)}" style="display:inline-block; background:#0f766e; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:8px; font-weight:bold; font-size:15px;">
          View Dashboard
        </a>
      </div>

      <p style="margin:30px 0 0; color:#374151; line-height:1.6;">Thank you,<br/>Clinical Serenity Team</p>
    </div>

    <div style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#777;">
      © Clinical Serenity. All rights reserved.
    </div>
  </div>
</div>
`;

    // Replace the transporter.sendMail call with sendEmail service
    sendEmail({
      to: recipientEmail,
      subject,
      html: htmlTemplate,
    }).catch(err => {
      console.error("❌ Appointment status email failed:", err);
    });

    console.log("✅ Appointment status email initiation logged.");
    res.json({ success: true });
  } catch (error) {
    console.error('Appointment status notification error:', error);
    res.status(500).json({ success: false, message: 'Failed to update appointment status' });
  }
});

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

    // Custom status update emails removed.

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

function handleAvatarUpload(req, res, next) {
  avatarUpload.single('avatar')(req, res, (err) => {
    if (!err) return next();

    console.log("ENV:", process.env.SUPABASE_URL);
    console.log("Request file:", req.file);
    console.error('❌ Avatar multer error:', err);

    const status = err instanceof multer.MulterError ? 400 : 400;
    return res.status(status).json({
      success: false,
      message: err.message || 'Invalid avatar upload',
    });
  });
}

// POST /api/avatar/upload — upload profile picture
app.post('/api/avatar/upload', authMiddleware, handleAvatarUpload, async (req, res) => {
  try {
    console.log("ENV:", process.env.SUPABASE_URL);
    console.log("Request file:", req.file);

    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No image file provided' });

    const userId = req.user.id;
    const fileExt = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    console.log("Uploading to Supabase bucket: avatars");
    console.log("File name:", fileName);
    console.log("File metadata:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      bufferBytes: file.buffer?.length || 0,
    });

    await ensureStorageBucket('avatars', { public: true });

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, { contentType: file.mimetype, upsert: true });

    if (uploadErr) {
      console.error('❌ Avatar storage error:', uploadErr);
      return res.status(500).json({ success: false, message: `Avatar upload failed: ${uploadErr.message}` });
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatar_url = urlData?.publicUrl;

    if (!avatar_url) {
      console.error('❌ Avatar public URL missing:', urlData);
      return res.status(500).json({ success: false, message: 'Avatar uploaded, but public URL could not be generated' });
    }

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
  } catch (err) {
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
    const { role } = req.query;
    let query = supabase.from('users').select('*').order('id', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase error fetching users:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, users: data || [] });
  } catch (err) {
    console.error('❌ Server error fetching users:', err);
    res.status(500).json({ success: false, error: err.message });
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

    // 1. Generate Custom Invite Link
    const frontendUrl = process.env.FRONTEND_URL || 'https://dental-management-system-sand.vercel.app';
    const inviteLink = `${frontendUrl}/doctor-register?email=${email.trim().toLowerCase()}`;

    console.log('📧 Sending custom doctor invitation to:', email);

    // 2. Send Invitation Email using email service
    sendEmail({
      to: email.trim().toLowerCase(),
      subject: "You're invited as a Doctor - Clinical Serenity",
      html: `
<div style="font-family: Arial, sans-serif; padding:30px; background:#f4f7fb;">
  <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; box-shadow:0 4px 20px rgba(0,0,0,0.1);">
    <h2 style="color:#2e7d6b;">Clinical Serenity</h2>
    <p style="font-size:16px;">Hello ${name},</p>
    <p>You have been invited to join <b>Clinical Serenity</b> as a professional doctor.</p>
    <p>Please click the button below to set up your account and complete your registration:</p>

    <div style="margin:30px 0; text-align:center;">
      <a href="${inviteLink}" style="display:inline-block; padding:14px 28px; background:#2e7d6b; color:white; border-radius:8px; text-decoration:none; font-weight:bold; font-size:16px;">
        Accept Invitation & Register
      </a>
    </div>

    <p style="margin-top:20px; font-size:14px; color:gray;">
      If the button above doesn't work, copy and paste this link into your browser:<br/>
      <span style="color:#2e7d6b;">${inviteLink}</span>
    </p>

    <p style="margin-top:25px; font-size:14px; color:gray; border-top:1px solid #eee; padding-top:20px;">
      Thank you,<br/>
      <b>Clinical Serenity Team</b>
    </p>
  </div>
</div>
`
    }).catch(err => {
      console.error('❌ Failed to send doctor invite email:', err);
    });

    // 3. Upsert into public.users table (allows re-inviting or updating existing user)
    // We use email as conflict target since we don't have a Supabase Auth ID yet
    const { error: upsertError } = await supabase
      .from('users')
      .upsert({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: 'doctor',
        status: 'invited',
        phone: 'N/A'
      }, { onConflict: 'email' });

    if (upsertError) {
      console.error('UPSERT USER FAILED:', upsertError);
      return res.status(500).json({ success: false, message: 'Doctor invited, but failed to record in database' });
    }

    res.json({ success: true, message: 'Doctor invitation initiated successfully' });
  } catch (error) {
    console.error('SERVER ERROR — Invite doctor:', error);
    res.status(500).json({ success: false, message: 'Server error during invite' });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/doctor/register — complete doctor invitation
// ═══════════════════════════════════════════════════════════
app.post('/api/doctor/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    console.log(`🩺 Registration attempt for invited doctor: ${email}`);

    // 1. Check if user is actually invited
    const { data: invitedUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (findError || !invitedUser) {
      console.warn(`⚠️ Registration failed: No invitation found for ${email}`);
      return res.status(404).json({ success: false, message: 'No invitation found for this email' });
    }

    if (invitedUser.role !== 'doctor' || invitedUser.status !== 'invited') {
      if (invitedUser.role === 'doctor' && invitedUser.status === 'active') {
        return res.status(400).json({ success: false, message: 'This account is already registered. Please login.' });
      }
      return res.status(403).json({ success: false, message: 'Invalid invitation status' });
    }

    // 2. Hash password for local database (Requirement #1 & #2)
    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = invitedUser.id;

    // 3. Update public.users table with the password and status='active' (Requirement #7: No Supabase Auth dependency)
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        status: 'active' 
      })
      .eq('email', email.trim().toLowerCase());

    if (updateError) {
      console.error('❌ Database sync error:', updateError.message);
      return res.status(500).json({ success: false, message: 'Auth created but failed to sync database' });
    }

    console.log(`✅ Doctor registered successfully: ${email}`);
    res.json({ success: true, message: 'Registration complete. You can now log in.' });
  } catch (err) {
    console.error('❌ Doctor registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});
// ═══════════════════════════════════════════════════════════
// POST /api/admin/invite-admin — admin only
// ═══════════════════════════════════════════════════════════
app.post('/api/admin/invite-admin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("Invite request:", { name, email });

    // 1. Validation
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const adminEmail = email.trim().toLowerCase();
    const adminName = name.trim();
    // Generate a random secure password
    const tempPassword = crypto.randomBytes(12).toString('hex') + "A1!"; 

    // Step 1: Create admin user (Supabase)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name: adminName, role: 'admin' }
    });

    if (createError) {
      console.error("User creation error:", createError);
      return res.status(500).json({ error: "User creation failed: " + createError.message });
    }

    const authUser = userData.user;

    // Step 2: Database sync with safe check (avoid trigger conflicts)
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!existingUser) {
        const { error: syncError } = await supabase
          .from('users')
          .insert([{
            id: authUser.id,
            email: adminEmail,
            name: adminName,
            role: 'admin',
            phone: 'N/A'
          }]);

        if (syncError) {
          console.error("Database sync error (non-fatal):", syncError);
        } else {
          console.log("Admin synced to public.users table");
        }
      } else {
        console.log("Admin already exists in public.users, skipping sync");
      }
    } catch (dbErr) {
      console.error("Database sync exception (non-fatal):", dbErr);
    }

    // Step 3: Send email (non-blocking)
    const frontendUrl = (process.env.FRONTEND_URL || 'https://dental-management-system-sand.vercel.app').replace(/\/+$/, '');
    const loginUrl = `${frontendUrl}/login`;

    const inviteHtml = `
<div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:24px;">
  <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 18px rgba(15,23,42,0.12);">
    <div style="background:#0f766e; padding:24px 20px; text-align:center;">
      <h2 style="color:#ffffff; margin:0;">Clinical Serenity</h2>
    </div>
    <div style="padding:30px; color:#1f2937;">
      <h3 style="margin-top:0;">Hello ${escapeHtml(adminName)},</h3>
      <p>You have been invited to join <b>Clinical Serenity</b> as an administrator.</p>
      <p>Your account has been created. You can log in using the credentials below:</p>
      <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
        <p style="margin:5px 0;"><b>Email:</b> ${adminEmail}</p>
        <p style="margin:5px 0;"><b>Temporary Password:</b> <code style="background:#e2e8f0; padding:2px 5px; border-radius:4px;">${tempPassword}</code></p>
      </div>
      <p>Please log in and change your password immediately.</p>
      <div style="margin:28px 0; text-align:center;">
        <a href="${escapeHtml(loginUrl)}" style="display:inline-block; background:#0f766e; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:8px; font-weight:bold;">Log In Now</a>
      </div>
      <p style="font-size:13px; color:#6b7280;">If you were not expecting this invitation, you can ignore this email.</p>
    </div>
    <div style="background:#f9fafb; text-align:center; padding:15px; font-size:12px; color:#777;">
      © Clinical Serenity. All rights reserved.
    </div>
  </div>
</div>`;

    // Non-blocking email sending via email service
    sendEmail({
      to: adminEmail,
      subject: "You're invited as Admin - Clinical Serenity",
      html: inviteHtml,
    }).catch(err => {
      console.error("Email error:", err);
    });

    return res.json({ success: true, message: "Admin invited successfully" });

  } catch (err) {
    console.error("Invite admin fatal error:", err);
    res.status(500).json({ error: "Internal server error" });
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
// POST /api/auth/reset-password — send custom reset email
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const trimmedEmail = email.trim().toLowerCase();
    console.log(`🔐 Custom password reset requested for: ${trimmedEmail}`);

    // 1. Check if user exists in our database
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', trimmedEmail)
      .single();

    if (fetchErr || !user) {
      console.log('❌ Reset password — User not found:', trimmedEmail);
      // For security, don't reveal if email exists, but the user requested clear messages.
      // Given the context, we'll return an error.
      return res.status(404).json({ success: false, message: 'Account not found. Please check your email.' });
    }

    // 2. Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // 3. Save token to database (Requirement #1 & #2: reset_token_expiry)
    const { error: updateErr } = await supabase
      .from('users')
      .update({ 
        reset_token: resetToken, 
        reset_token_expiry: resetExpires.toISOString() 
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('❌ Failed to save reset token:', updateErr.message);
      return res.status(500).json({ success: false, message: 'Database error: ' + updateErr.message });
    }

    // 4. Send custom email using email service
    const resetUrl = `https://dental-management-system-sand.vercel.app/reset-password?token=${resetToken}`;
    const emailResult = await sendEmail({
      to: trimmedEmail,
      subject: "Reset Your Password - Clinical Serenity",
      html: `
<div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
  <h2 style="color: #2e7d6b; text-align: center;">Password Reset Request</h2>
  <p>Hello ${user.name || 'there'},</p>
  <p>We received a request to reset your password for your Clinical Serenity account.</p>
  <p>Please click the button below to set a new password. This link will expire in 1 hour.</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" style="background-color: #2e7d6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
  </div>
  <p style="font-size: 12px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
  <p style="font-size: 10px; color: #aaa; text-align: center;">© Clinical Serenity Dental Clinic</p>
</div>`
    });

    if (emailResult.success) {
      console.log(`✅ Custom reset email sent to: ${trimmedEmail}`);
      res.json({ success: true, message: 'Password reset instructions have been sent to your email.' });
    } else {
      console.error('❌ Failed to send reset email:', emailResult.error);
      res.status(500).json({ success: false, message: 'Failed to send reset email. Please contact support.' });
    }

  } catch (err) {
    console.error('❌ SERVER ERROR — Reset password:', err.message);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ═══════════════════════════════════════════════════════════
// POST /api/auth/complete-reset-password — finalize password reset
// ═══════════════════════════════════════════════════════════
// POST /api/auth/complete-reset-password — finalize custom password reset (Requirement #2)
app.post('/api/auth/complete-reset-password', async (req, res) => {
  try {
    const { password, token } = req.body;

    if (!password || !token) {
      return res.status(400).json({ success: false, message: 'Password and token are required' });
    }

    console.log('🔑 Finalizing password reset with token...');

    // 1. Find user by reset token (Requirement #2)
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('reset_token', token)
      .single();

    if (fetchErr || !user) {
      console.error('❌ Reset password — Invalid token (Requirement #6)');
      return res.status(401).json({ success: false, message: 'Invalid token. Please request a new link.' });
    }

    // 2. Check expiry (Requirement #6)
    if (new Date() > new Date(user.reset_token_expiry)) {
      console.error('❌ Reset password — Token expired for:', user.email);
      return res.status(401).json({ success: false, message: 'Token expired. Please request a new one.' });
    }

    console.log(`🔐 Hashing and saving new password for: ${user.email}`);

    // 3. Update password with hashing (Requirement #2)
    const hashedPassword = await bcrypt.hash(password, 10);
    const { error: updateErr } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        reset_token: null,
        reset_token_expiry: null
      })
      .eq('id', user.id);

    if (updateErr) {
      console.error('❌ Reset password — Database update failed:', updateErr.message);
      return res.status(500).json({ success: false, message: 'Database error: ' + updateErr.message });
    }

    console.log(`✅ Password reset successfully completed for: ${user.email}`);
    res.json({
      success: true,
      message: 'Your password has been reset successfully. You can now log in.'
    });

  } catch (err) {
    console.error('❌ SERVER ERROR — Complete reset password:', err.message);
    res.status(500).json({ success: false, message: 'Server error during password reset: ' + err.message });
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
      .from('users').select('id, role, name, email').eq('id', doctor_id).single();
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
      file_url
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

    try {
      console.log(`📧 Sending report-ready email to ${patientRow.email}`);
      await sendReportReadyEmail({
        patientEmail: patientRow.email,
        patientName: patientRow.name,
        doctorName: doctorRow.name || req.user.name,
      });
      console.log(`✅ Report-ready email sent to ${patientRow.email}`);
    } catch (emailErr) {
      console.error('❌ Report upload email failed:', {
        message: emailErr.message,
        response: emailErr.response,
        responseCode: emailErr.responseCode,
      });
    }

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

// GET /api/test-email — verify SMTP delivery
app.get('/api/test-email', async (req, res) => {
  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: "Test Email - Clinical Serenity",
      html: "<h2>SMTP is working ✅</h2>",
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("Test email error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
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

    // Manual reminder emails disabled.
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
    // Check storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    const reportsBucket = (buckets || []).find(b => b.name === 'reports');
    if (reportsBucket) {
      console.log(`✅ Storage bucket "reports" OK (public: ${reportsBucket.public})`);
    } else {
      console.log('⚠️  Storage bucket "reports" NOT FOUND — create it in Supabase Dashboard → Storage');
    }
    const avatarsBucket = (buckets || []).find(b => b.name === 'avatars');
    if (avatarsBucket) {
      console.log(`✅ Storage bucket "avatars" OK (public: ${avatarsBucket.public})`);
    } else {
      console.log('⚠️  Storage bucket "avatars" NOT FOUND — avatar upload will attempt to create it');
    }
  } catch (e) {
    console.error('❌ DB check failed:', e.message);
  }


  console.log('');
  console.log('📋 Routes:');
  console.log('  POST /send-otp');
  console.log('  POST /verify-otp');
  console.log('  GET  /api/test-admin');
  console.log('  POST /book-appointment');
  console.log('  GET  /my-appointments');
  console.log('  GET  /all-appointments       (admin)');
  console.log('  PUT  /update-status           (admin)');
  console.log('  PUT  /api/appointment/status   (doctor/admin)');
  console.log('  DEL  /admin/delete-user/:id   (admin)');
  console.log('  GET  /admin/analytics         (admin)');
  console.log('  POST /auth/reset-password');
  console.log('  POST /upload-report           (doctor)');
  console.log('  GET  /patient/reports');
  console.log('  GET  /doctor/patients          (doctor)');
  console.log('  ⏰  Cron: daily reminder at 8 AM');
  console.log('');
});
