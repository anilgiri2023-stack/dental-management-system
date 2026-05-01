require("dotenv").config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const { supabase } = require('./utils/supabase');
const { sendEmail } = require('./services/emailService');

const authRoutes = require('./routes/authRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// ─── Request Logger (Debug) ──────────────────────────────
app.use((req, res, next) => {
  console.log(`📡 [${req.method}] ${req.url}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);

// ─── Status Update (Specific Path) ────────────────────────
// Route removed as part of consolidation to PUT /api/appointments/:id/status

// ─── Reports & Avatars ────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload-report - Upload new report
app.post('/api/upload-report', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { patient_id, appointment_id, title } = req.body;
    
    console.log('📡 [POST] /upload-report:', { patient_id, appointment_id, title, file: file?.originalname });

    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileName = `reports/${patient_id}/${Date.now()}-${file.originalname}`;
    const { error: uploadErr } = await supabase.storage.from('reports').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
    const { error: dbErr } = await supabase.from('reports').insert([{
      patient_id,
      appointment_id,
      doctor_id: req.user.id,
      report_url: urlData.publicUrl,
      file_name: file.originalname,
      title: title || 'Medical Report'
    }]);
    if (dbErr) throw dbErr;

    res.json({ success: true, reportUrl: urlData.publicUrl });
  } catch (err) {
    console.error('❌ Upload report error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/edit-report - Update report file
app.post('/api/edit-report', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { report_id, patient_id, title } = req.body;

    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileName = `reports/${patient_id}/${Date.now()}-${file.originalname}`;
    const { error: uploadErr } = await supabase.storage.from('reports').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('reports').getPublicUrl(fileName);
    const { error: dbErr } = await supabase.from('reports').update({
      report_url: urlData.publicUrl,
      file_name: file.originalname,
      title: title || 'Medical Report'
    }).eq('id', report_id);
    if (dbErr) throw dbErr;

    res.json({ success: true, reportUrl: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reports/:id - Update report title
app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    const { error } = await supabase.from('reports').update({ title }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reports/:id - Delete report
app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/patient/reports', authMiddleware, async (req, res) => {
  try {
    const patientId = req.user.id;
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        doctor:doctor_id (
          name,
          email
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, reports: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/reports/:patientId', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('reports').select('*').eq('patient_id', req.params.patientId);
    if (error) throw error;
    res.json({ success: true, reports: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/avatar - Fetch user avatar
app.get('/api/avatar', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ success: true, avatar_url: data?.avatar_url || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/avatar/upload - Upload new avatar
app.post('/api/avatar/upload', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileName = `avatars/${req.user.id}/${Date.now()}-${file.originalname}`;
    const { error: uploadErr } = await supabase.storage.from('avatars').upload(fileName, file.buffer, { contentType: file.mimetype });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const { error: dbErr } = await supabase.from('users').update({
      avatar_url: urlData.publicUrl
    }).eq('id', req.user.id);
    if (dbErr) throw dbErr;

    res.json({ success: true, avatar_url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/test-email - Send a test email for debugging
app.get('/api/test-email', async (req, res) => {
  try {
    const email = req.query.email || "onilofficial2005@gmail.com";
    console.log(`📡 [test-email] Sending to: ${email}`);
    
    const result = await sendEmail({
      to: email,
      subject: "Resend Configuration Test",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2e7d6b;">Test Success!</h2>
          <p>Your Resend configuration is working.</p>
          <p><strong>Recipient:</strong> ${email}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log("📡 [test-email] Full Result:", result);

    if (result.success) {
      res.json({ success: true, message: `Test email sent to ${email}`, result });
    } else {
      res.status(500).json({ success: false, error: result.error, result });
    }
  } catch (err) {
    console.error("❌ [test-email] Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Dental Management System API is running...');
});

// GET /test-email - Quick test route as requested
app.get('/test-email', async (req, res) => {
  try {
    console.log("📡 [test-email] Quick test triggered...");
    const result = await sendEmail({
      to: "onilofficial2005@gmail.com",
      subject: "Test Email - Resend Verified",
      html: "<h1>Resend is working with verified domain!</h1>"
    });
    res.json({ success: result.success, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
