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

  const { name, email, phone, service, date, time, doctor_id, notes } = req.body;
  const user_id = req.user?.id;

  // 1. Validation
  if (!name || !phone) {
    return res.status(400).json({ error: "Missing patient name or phone" });
  }

  if (!user_id) {
    return res.status(401).json({ success: false, error: "User not authenticated" });
  }

  if (!email || !service || !date || !time || !doctor_id) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    // 2. Prepare Data for Insertion
    const appointmentData = {
      user_id,
      patient_name: name, // name -> patient_name
      email,
      phone,
      service,
      date,
      time,
      notes: notes || '',
      doctor_id,
      status: 'Pending'
    };

    console.log("FINAL INSERT DATA:", appointmentData);

    // 3. Fetch doctor details for the email
    const { data: doctorData } = await supabase
      .from("users")
      .select("name")
      .eq("id", doctor_id)
      .single();

    const doctor_name = doctorData?.name || "Assigned Doctor";

    // 4. Insert into database
    const { data, error } = await supabase
      .from("appointments")
      .insert([appointmentData]);

    if (error) {
      console.log("❌ SUPABASE ERROR:", error);
      return res.status(400).json({ success: false, error: error.message });
    }

    console.log("✅ APPOINTMENT CREATED:", data);

    // 5. Send premium confirmation email (non-blocking)
    try {
      await sendStatusEmail({
        email: email,
        patient_name: name,
        service: service,
        date: date,
        time: time,
        doctor_name: doctor_name
      }, "Pending Approval");
    } catch (emailErr) {
      console.warn("⚠️ Confirmation email failed:", emailErr.message);
    }

    res.json({ success: true, data, doctor_name });

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
