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
  try {
    const { service, date, time, doctor_id, notes } = req.body;

    // 🔥 Step 2: Fetch user email from Supabase Auth
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user?.email) {
      console.error("User email not found");
      return res.status(400).json({ error: "User email missing" });
    }

    const userEmail = userData.user.email;
    console.log("BOOKING EMAIL:", userEmail);

    // Insert into DB
    const { data: newAppointment, error } = await supabase
      .from("appointments")
      .insert([{
        user_id: userData.user.id,
        email: userEmail,
        doctor_id,
        service,
        date,
        time,
        notes: notes || "",
        status: "Pending",
        name: req.body.name || userData.user.user_metadata?.name || ""
      }])
      .select(`
        *,
        doctor:users!appointments_doctor_id_fkey(name)
      `)
      .single();

    if (error) {
      console.error("Insert error:", error);
      return res.status(500).json({ error: "Insert failed" });
    }

    console.log("APPOINTMENT EMAIL STORED:", newAppointment.email);

    // Send confirmation email
    const doctorName = newAppointment.doctor?.name || "our specialist";
    await sendEmail({
      to: newAppointment.email,
      subject: "Appointment Booked",
      html: `
        <h2>Appointment Confirmed</h2>
        <p>Your appointment has been booked successfully.</p>
        <p><b>Doctor:</b> Dr. ${doctorName}</p>
        <p><b>Date:</b> ${newAppointment.date}</p>
        <p><b>Time:</b> ${newAppointment.time}</p>
      `
    });

    res.status(201).json({ success: true, appointment: newAppointment });
  } catch (err) {
    console.error("CREATE APPOINTMENT ERROR:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create appointment",
      error: err.message 
    });
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
