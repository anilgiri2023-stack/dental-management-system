const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/emailService');
const { saveOTP, verifyOTP } = require('../utils/otpStore');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// 1. POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailKey = email.trim().toLowerCase();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in memory
    saveOTP(emailKey, otp);

    // Send OTP via Brevo API
    await sendOTP(emailKey, otp);

    return res.json({
      success: true,
      message: "OTP sent successfully"
    });

  } catch (error) {
    console.error("OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Email send failed"
    });
  }
});

// 2. POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const isValid = verifyOTP(email, otp);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP"
      });
    }

    // Since we are not using a database, create a mock user object
    const user = {
      id: `user_${Date.now()}`,
      email: email.trim().toLowerCase(),
      name: name || 'User',
      role: 'user'
    };

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user
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
