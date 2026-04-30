const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendOTPEmail } = require('../utils/emailService');
const { saveOTP, verifyOTP } = require('../utils/otpStore');
const { supabase } = require('../utils/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 1. POST /api/auth/send-otp
router.post("/send-otp", async (req, res) => { 
  try { 
    const { email } = req.body; 

    if (!email) { 
      return res.status(400).json({ success: false, message: "Email required" }); 
    } 

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 

    saveOTP(email, otp); 

    await sendOTPEmail(email, otp); 

    res.json({ success: true }); 
  } catch (err) { 
    console.error(err); 
    res.status(500).json({ success: false }); 
  } 
}); 

// 2. POST /api/auth/verify-otp
router.post("/verify-otp", async (req, res) => { 
  try {
    const { email, otp, name } = req.body; 

    const isValid = verifyOTP(email, otp); 

    if (!isValid) { 
      return res.status(400).json({ 
        success: false, 
        message: "Invalid or expired OTP", 
      }); 
    } 

    const finalEmail = email.trim().toLowerCase();

    // 1. Find or create user in Supabase Auth via Admin API
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    let authUser = (usersData?.users || []).find(u => u.email === finalEmail);

    if (!authUser) {
      console.log(`🆕 Creating new auth user for: ${finalEmail}`);
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: finalEmail,
        email_confirm: true,
        user_metadata: { name: name || 'User' }
      });
      if (createErr) throw createErr;
      authUser = newUser.user;
    }

    if (!authUser) {
      return res.status(401).json({ success: false, message: 'Authentication failed. Please try again.' });
    }

    // 2. Find or create user in "users" table
    const { data: existingUser, error: fetchErr } = await supabase
      .from('users')
      .select('*')
      .eq('email', finalEmail)
      .single();

    let user;
    if (existingUser) {
      user = existingUser;
      // Update name if provided and verify user
      let updates = { is_verified: true };
      if (name && user.name !== name) updates.name = name;

      const { data: updatedUser, error: updateErr } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (updateErr) console.error('Update user error:', updateErr.message);
      if (updatedUser) user = updatedUser;
    } else {
      // Create new user in public.users linked to auth user ID (which is a UUID)
      const { data: newUser, error: createErr } = await supabase
        .from('users')
        .insert([{
          id: authUser.id,
          email: finalEmail,
          name: name || 'User',
          role: 'user',
          is_verified: true
        }])
        .select()
        .single();

      if (createErr) {
        console.error('❌ Create user error:', createErr.message);
        return res.status(500).json({ success: false, message: 'Failed to create user profile' });
      }
      user = newUser;
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role || 'user',
      name: user.name
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error("VERIFY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during verification"
    });
  }
});

module.exports = router;
