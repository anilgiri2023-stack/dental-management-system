const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const { sendEmail, sendOTPEmail } = require('../services/emailService');
const { saveOTP, verifyOTP } = require('../services/otpStore');
const { supabase } = require('../utils/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// ─── CHECK USER ───
router.post("/check-user", async (req, res) => { 
  try { 
    const { email, name, phone } = req.body; 

    console.log("Incoming:", { email, name, phone }); 

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const finalEmail = email.trim().toLowerCase();

    const { data: existingUser } = await supabase 
      .from("users") 
      .select("*") 
      .eq("email", finalEmail) 
      .maybeSingle(); 

    if (existingUser) { 
      // Fix old users with default name 
      if (name && existingUser.name === "User") { 
        const { data: updatedUser } = await supabase 
          .from("users") 
          .update({ name }) 
          .eq("email", finalEmail) 
          .select() 
          .single(); 

        return res.json({ exists: true, user: updatedUser }); 
      } 

      return res.json({ exists: true, user: existingUser }); 
    } 

    // Create new user 
    const { data, error } = await supabase 
      .from("users") 
      .insert([ 
        { 
          email: finalEmail, 
          name: name && name.trim() !== "" ? name : "User", 
          phone: phone || null, 
          role: "user" 
        } 
      ]) 
      .select() 
      .single(); 

    if (error) throw error; 

    return res.json({ exists: false, user: data }); 

  } catch (err) { 
    console.error("CHECK USER ERROR:", err); 
    res.status(500).json({ message: "Server error" }); 
  } 
}); 

// ─── ME ───
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, phone, role')
      .eq('email', req.user.email)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}); 

// ─── OTP AUTH ───
router.post("/send-otp", async (req, res) => { 
  try { 
    const { email } = req.body; 

    if (!email) { 
      return res.status(400).json({ success: false, message: "Email required" }); 
    } 

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 

    // Store OTP in memory
    saveOTP(email, otp); 

    console.log("OTP for", email, ":", otp); 

    const result = await sendOTPEmail(email, otp); 

    if (!result.success) {
      return res.status(500).json({ success: false, message: "Failed to send verification email" });
    }

    res.json({ success: true }); 
  } catch (err) { 
    console.error("SEND OTP ERROR:", err); 
    res.status(500).json({ success: false, message: "Server error" }); 
  } 
}); 

router.post("/verify-otp", async (req, res) => { 
  try {
    const { email, otp } = req.body; 

    if (!email || !otp) { 
      return res.status(400).json({ message: "Email and OTP required" }); 
    } 

    console.log("VERIFY:", { email, otp });

    // 1. Verify OTP from memory store
    const result = verifyOTP(email, otp); 

    if (!result.valid) { 
      return res.status(400).json({ 
        success: false,
        message: result.error
      }); 
    } 

    const otpData = result.record;

    const finalEmail = email.trim().toLowerCase();

    // 2. Fetch user from public.users table
    const { data: user, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("email", finalEmail)
      .single();

    if (fetchErr || !user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Generate JWT session token
    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      name: user.name,
      phone: user.phone
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

// ─── UPDATE PROFILE ───
router.post('/update-profile', async (req, res) => {
  try {
    const { email, name, phone } = req.body;
    if (!email || !name || !phone) {
      return res.status(400).json({ success: false, message: 'Email, name and phone are required' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ name, phone })
      .eq('email', email.trim().toLowerCase())
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user: data });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ACTIVATE ACCOUNT (Supabase Flow Sync) ───
router.post('/activate-account', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log(`📡 [activate-account] Syncing status and password for: ${email}`);

    // Hash password for our custom login system (sync with Supabase)
    let updateData = { 
      status: 'active',
      is_active: true,
      invite_token: null
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email.trim().toLowerCase())
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, message: 'Account activated and password synced', user: data });
  } catch (err) {
    console.error('❌ [activate-account] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── RESET PASSWORD (Custom Token Implementation) ───
router.post('/reset-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const finalEmail = email.trim().toLowerCase();
    console.log(`📡 [reset-password] Initiating for: ${finalEmail}`);

    // 1. Verify user exists in public.users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', finalEmail)
      .single();

    if (userError || !user) {
      console.log(`❌ [reset-password] User not found: ${finalEmail}`);
      // Security: Don't reveal if user exists, but here we can be helpful for admins
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // 2. Generate a custom reset token
    const resetToken = require('crypto').randomUUID();
    
    // 3. Save token in users table (Source of Truth)
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        invite_token: resetToken // Reusing invite_token column for reset tokens
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // 4. Send Custom Reset Email via Resend
    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/update-password?email=${encodeURIComponent(finalEmail)}&token=${resetToken}`;
    
    const emailResult = await sendEmail({
      to: finalEmail,
      subject: "Reset Your Password - Clinical Serenity",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2e7d6b;">Password Reset Request</h2>
          <p>Hello ${user.name || 'Admin'},</p>
          <p>We received a request to reset your password for the Clinical Serenity portal.</p>
          <p>Please click the button below to set a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background: #2e7d6b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link: <br/> <span style="color: #666; font-size: 12px;">${resetLink}</span></p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
          <p style="font-size: 10px; color: #aaa;">© Clinical Serenity Dental Clinic</p>
        </div>
      `
    });

    if (!emailResult.success) {
      console.error("❌ [reset-password] Resend failed:", emailResult.error);
      return res.status(500).json({ success: false, message: 'Failed to send email. Please check your Resend configuration.' });
    }

    console.log(`✅ [reset-password] Link sent successfully to: ${finalEmail}`);
    res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('❌ [reset-password] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
