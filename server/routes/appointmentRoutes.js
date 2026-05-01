import express from 'express';
import { supabase } from '../utils/supabase.js';
import authMiddleware from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';
import { sendStatusEmail } from '../utils/sendStatusEmail.js';

const router = express.Router();

// Middleware for roles
const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Admin only' });
const doctorOnly = (req, res, next) => req.user.role === 'doctor' ? next() : res.status(403).json({ success: false, message: 'Doctor only' });

// ─── APPOINTMENTS ───

router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log("📡 GET /appointments | User:", req.user.id, "Role:", req.user.role);
    let query = supabase
      .from('appointments')
      .select(`
        *,
        users:users!appointments_user_id_fkey(name,email,phone),
        doctor:users!appointments_doctor_id_fkey(name)
      `);

    // Filter by user_id for non-admin/non-doctor users
    if (req.user.role === 'user') {
      query = query.eq('user_id', req.user.id);
    } else if (req.user.role === 'doctor') {
      query = query.eq('doctor_id', req.user.id);
    }
    // Admin sees all

    const { data, error } = await query.order('date', { ascending: true });
    if (error) throw error;
    res.json({ success: true, appointments: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/', authMiddleware, async (req, res) => {
  console.log("==== NEW APPOINTMENT REQUEST ====");
  console.log("REQ BODY:", req.body);
  console.log("HEADERS:", req.headers);

  const { name, email, phone, service, date, time, doctor_id } = req.body;
  const patient_name = req.body.patient_name || name;
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ success: false, error: "User not authenticated" });
  }

  // Validation
  if (!name || !email || !phone || !service || !date || !time || !doctor_id) {
    console.log("❌ Missing fields:", { name, email, phone, service, date, time, doctor_id });
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    const { data, error } = await supabase.from("appointments").insert([{
      user_id,
      patient_name,
      email,
      phone,
      service,
      date,
      time,
      doctor_id
    }]);

    if (error) {
      console.log("❌ SUPABASE ERROR:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log("✅ APPOINTMENT CREATED:", data);

    // Optional: Send confirmation email (non-blocking)
    try {
      await sendEmail({
        to: email,
        subject: "Appointment Booked - Clinical Serenity",
        html: `
          <div style="background-color: #f4f7f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0;">
            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eef2f1;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #2e7d6b 0%, #3d9e8b 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Clinical Serenity</h1>
                  <p style="color: #d1e9e4; margin: 10px 0 0 0; font-size: 16px;">Appointment Confirmed</p>
                </td>
              </tr>
              
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">Hello ${patient_name},</h2>
                  <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555;">Great news! Your appointment has been successfully booked. Our team is looking forward to seeing you.</p>
                  
                  <!-- Details Box -->
                  <div style="background-color: #f9fcfb; border: 1px solid #e2ece9; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                          <div style="font-size: 16px; font-weight: 600; color: #2e7d6b; margin-top: 4px;">${service}</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 15px;">
                          <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                          <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 4px;">${date} at ${time}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Status</span>
                          <div style="margin-top: 8px;">
                            <span style="background-color: #e6f4f1; color: #2e7d6b; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: inline-block;">Pending Approval</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- CTA -->
                  <div style="text-align: center; margin-bottom: 30px;">
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background: linear-gradient(135deg, #2e7d6b 0%, #3d9e8b 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(46, 125, 107, 0.2);">View Appointment</a>
                  </div>
                  
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #777; text-align: center;">If you need to reschedule or have any questions, please don't hesitate to reach out to us.</p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 0 40px 40px 40px; text-align: center;">
                  <div style="border-top: 1px solid #eee; padding-top: 30px;">
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2e7d6b;">Clinical Serenity</p>
                    <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Modern Dental Care Excellence</p>
                    <p style="margin: 15px 0 0 0; font-size: 12px; color: #aaa;">support@clinicalserenity.com</p>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        `
      });
    } catch (emailErr) {
      console.warn("⚠️ Confirmation email failed:", emailErr.message);
    }

    res.json({ success: true, data });

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

router.get('/my', authMiddleware, async (req, res) => {
  try {
    console.log("📡 GET /appointments/my | User:", req.user.id, "Role:", req.user.role);
    let query = supabase.from('appointments').select(`
      *,
      users:users!appointments_user_id_fkey(name,email,phone),
      doctor:users!appointments_doctor_id_fkey(name)
    `);
    if (req.user.role === 'doctor') query = query.eq('doctor_id', req.user.id);
    else if (req.user.role !== 'admin') query = query.eq('user_id', req.user.id);
    
    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    res.json({ success: true, appointments: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("🚀 STATUS UPDATE:", id, status);

    // 1. Fetch full appointment including email
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select(`
        *,
        doctor:users!appointments_doctor_id_fkey(name)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    console.log("EMAIL:", appointment.email);
    console.log("STATUS UPDATE EMAIL:", appointment.email);
    console.log("STATUS EMAIL:", appointment.email);

    // 2. Update status in DB
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (updateError) {
      console.error("❌ DB ERROR:", updateError);
      return res.status(500).json({ message: "DB update failed" });
    }

    // 3. Send email on status change via shared utility
    await sendStatusEmail(appointment, status);

    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (err) {
    console.error("🔥 SERVER ERROR:", err);
    res.status(500).json({ message: "Server crash during status update" });
  }
});


router.get('/booked-slots', authMiddleware, async (req, res) => {
  try {
    const { date } = req.query;
    const { data } = await supabase.from('appointments').select('time').eq('date', date).neq('status', 'Rejected');
    res.json({ success: true, bookedSlots: (data || []).map(a => a.time) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
