const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../utils/supabase');
const authMiddleware = require('../middleware/authMiddleware');
const { sendEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// ─── ADMIN LOGIN (Custom Implementation) ───
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // 1. Fetch user by email from public.users table ONLY
    const { data: admin, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', cleanEmail)
      .eq('role', 'admin')
      .single();

    if (error || !admin) {
      console.log(`❌ [admin-login] Admin not found: ${cleanEmail}`);
      return res.status(404).json({ success: false, message: 'Admin account not found' });
    }

    // 2. Reject if password is NULL
    if (!admin.password) {
      console.log(`⚠️ [admin-login] No password set for: ${cleanEmail}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Set password first. Please use the invitation link in your email.' 
      });
    }

    // 3. Reject if status != active
    if (admin.status !== 'active') {
      console.log(`⚠️ [admin-login] Account not activated for: ${cleanEmail}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Account not activated. Please complete your setup.' 
      });
    }

    // 4. Debugging Logs
    console.log(`📡 [admin-login] Attempt for: ${cleanEmail}`);
    console.log(`🔑 Entered Password Length: ${cleanPassword.length}`);

    // 5. Secure Bcrypt Comparison
    const isMatch = await bcrypt.compare(cleanPassword, admin.password);
    console.log(`✅ [admin-login] Bcrypt Match Result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: admin.id, role: 'admin', email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error('❌ [admin-login] Error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Admin only' });

// ─── Protected Admin Routes ───
router.use(authMiddleware, adminOnly);

router.get('/analytics', async (req, res) => { 
  try { 
    // 1. Fetch all appointments for status and service breakdown
    const { data: appointments, error: aptError } = await supabase 
      .from("appointments") 
      .select("status, service, date"); 

    if (aptError) throw aptError; 

    // 2. Fetch user counts by role
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("role");

    if (userError) throw userError;

    const totalAppointments = appointments.length; 
    const pending = appointments.filter(a => a.status === "Pending").length; 
    const approved = appointments.filter(a => a.status === "Approved").length; 
    const rejected = appointments.filter(a => a.status === "Rejected").length; 

    const totalPatients = users.filter(u => u.role === 'user' || u.role === 'patient').length;
    const totalDoctors = users.filter(u => u.role === 'doctor').length;

    // 3. Service Breakdown
    const serviceMap = {};
    appointments.forEach(a => {
      serviceMap[a.service] = (serviceMap[a.service] || 0) + 1;
    });
    const popularServices = Object.entries(serviceMap)
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Monthly Bookings (Last 6 months)
    const monthlyBookings = {};
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().slice(0, 7); // YYYY-MM
    }).reverse();

    last6Months.forEach(m => monthlyBookings[m] = 0);
    appointments.forEach(a => {
      const month = a.date.slice(0, 7);
      if (monthlyBookings.hasOwnProperty(month)) {
        monthlyBookings[month]++;
      }
    });

    res.json({ 
      success: true,
      analytics: {
        total: totalAppointments, // for user's Step 3
        pending, // for user's Step 3
        approved, // for user's Step 3
        rejected, // for user's Step 3
        totalAppointments,
        totalPatients,
        totalDoctors,
        statusBreakdown: {
          Pending: pending,
          Approved: approved,
          Rejected: rejected
        },
        popularServices,
        monthlyBookings
      }
    }); 

  } catch (err) { 
    console.error('Analytics error:', err); 
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' }); 
  } 
});

router.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_active');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ success: true, users: data });
});

router.post('/invite-doctor', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }

    // 1. Generate Supabase Invitation Link (contains access_token)
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { redirectTo: "http://localhost:5173/set-password" }
    });

    if (inviteError) throw inviteError;
    const inviteLink = inviteData.properties.action_link;

    // 2. Send Custom Invitation Email via Resend
    const emailResult = await sendEmail({
      to: email,
      subject: "Invitation to Join Clinical Serenity",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e7d6b;">Doctor Invitation</h2>
          <p>Hello ${name},</p>
          <p>You have been invited to join <strong>Clinical Serenity</strong> as a Doctor.</p>
          <p>Please set your account password using the link below to get started:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background: #2e7d6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Your Password</a>
          </div>
          <p>Or copy and paste this link: <br/> <span style="color: #666; font-size: 12px;">${inviteLink}</span></p>
          <p style="font-size: 11px; color: #999; margin-top: 20px;">Note: This link is valid for 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 10px; color: #aaa;">© Clinical Serenity Dental Clinic</p>
        </div>
      `
    });

    if (!emailResult.success) {
      console.warn("⚠️ Invitation email failed:", emailResult.error);
    }

    // 2. Insert into users table with status: 'invited' (Source of Truth)
    const { error: dbError } = await supabase.from('users').upsert({
      email: email.trim().toLowerCase(),
      name, 
      role: 'doctor', 
      status: 'invited', 
      is_active: false,
      password: null // Password will be set via /set-password
    }, { onConflict: 'email' });

    if (dbError) throw dbError;

    res.json({ success: true, message: 'Doctor invited successfully! Link sent via email.' });
  } catch (err) {
    console.error('Invite doctor error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/invite-admin', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required' });
    }

    // 1. Generate Supabase Invitation Link
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: { redirectTo: "http://localhost:5173/set-password" }
    });

    if (inviteError) throw inviteError;
    const inviteLink = inviteData.properties.action_link;
    
    // 2. Send Custom Invitation Email
    const emailResult = await sendEmail({
      to: email,
      subject: "Admin Invitation - Clinical Serenity",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e7d6b;">Welcome, ${name}!</h2>
          <p>You have been invited as an <strong>Administrator</strong> to Clinical Serenity.</p>
          <p>Please set your password using the link below:</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background: #2e7d6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Set Admin Password</a>
          </div>
          <p>Or copy and paste this link: <br/> <span style="color: #666; font-size: 12px;">${inviteLink}</span></p>
          <p style="font-size: 11px; color: #999; margin-top: 20px;">Note: This link is valid for 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 10px; color: #aaa;">© Clinical Serenity Dental Clinic</p>
        </div>
      `
    });

    if (!emailResult.success) {
      console.warn("⚠️ Invitation email failed:", emailResult.error);
    }

    // 2. Insert into users table
    const { error: dbError } = await supabase.from('users').upsert({
      email: email.trim().toLowerCase(),
      name, 
      role: 'admin', 
      status: 'invited', 
      is_active: false,
      password: null
    }, { onConflict: 'email' });

    if (dbError) throw dbError;

    res.json({ success: true, message: 'Admin invitation sent successfully!' });
  } catch (err) {
    console.error('Invite admin error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/delete-user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safety: prevent self-delete
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete yourself' });
    }

    await supabase.from('users').delete().eq('id', id);
    // Note: auth.admin.deleteUser requires service_role key, 
    // which our client should already be using
    await supabase.auth.admin.deleteUser(id);
    
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/delete-multiple-users', async (req, res) => {
  try {
    const { ids } = req.body;
    
    // 4. Handle empty array
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: true, count: 0, message: 'No user IDs provided' });
    }

    // Safety: prevent self-delete
    const validIds = ids.filter(id => id !== req.user.id);
    if (validIds.length === 0) {
      return res.json({ success: true, count: 0, message: 'Cannot delete self' });
    }

    // 2. First delete related appointments to satisfy FK constraints
    // Delete where the user is the patient (user_id)
    await supabase.from('appointments').delete().in('user_id', validIds);
    
    // Also delete where the user is the doctor (doctor_id) to prevent constraint errors for doctors
    await supabase.from('appointments').delete().in('doctor_id', validIds);

    // 3. Then delete users: DELETE FROM users WHERE id IN (ids)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .in('id', validIds);

    if (deleteError) throw deleteError;
    
    // Delete from Supabase Auth
    await Promise.all(validIds.map(id => supabase.auth.admin.deleteUser(id)));

    // 3. Return success count
    res.json({ 
      success: true, 
      count: validIds.length,
      message: `${validIds.length} users and related appointments deleted successfully` 
    });
  } catch (err) {
    console.error('❌ Bulk delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
