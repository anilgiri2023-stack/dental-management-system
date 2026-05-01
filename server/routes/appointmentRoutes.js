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
    console.log("REQ BODY:", req.body);
    const { service, date, time, doctor_id, patient_name, email, notes } = req.body;

    // 1. Validation
    if (!doctor_id || !service || !date || !time || !patient_name || !email) {
      const missing = [];
      if (!doctor_id) missing.push("doctor_id");
      if (!service) missing.push("service");
      if (!date) missing.push("date");
      if (!time) missing.push("time");
      if (!patient_name) missing.push("patient_name");
      if (!email) missing.push("email");
      
      console.log("❌ Validation failed:", missing);
      return res.status(400).json({ 
        success: false,
        error: `Missing required fields: ${missing.join(", ")}` 
      });
    }

    // Insert into DB
    const { data: newAppointment, error } = await supabase
      .from("appointments")
      .insert([{
        user_id: req.user.id, // Using user ID from authMiddleware
        email: email,
        doctor_id,
        service,
        date,
        time,
        notes: notes || "",
        status: "Pending",
        name: patient_name
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

    console.log("APPOINTMENT CREATED:", newAppointment.id);

    // Send confirmation email
    const doctorName = newAppointment.doctor?.name || "our specialist";
    await sendEmail({
      to: newAppointment.email,
      subject: "Appointment Booked",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e7d6b;">Appointment Confirmed</h2>
          <p>Hello ${patient_name},</p>
          <p>Your appointment has been booked successfully at <b>Clinical Serenity</b>.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><b>Doctor:</b> Dr. ${doctorName}</p>
            <p style="margin: 5px 0;"><b>Service:</b> ${service}</p>
            <p style="margin: 5px 0;"><b>Date:</b> ${date}</p>
            <p style="margin: 5px 0;"><b>Time:</b> ${time}</p>
          </div>
          <p>Status: <b>Pending Approval</b></p>
          <p>Thank you for choosing us!</p>
        </div>
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
