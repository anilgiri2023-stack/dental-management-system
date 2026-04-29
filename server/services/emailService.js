require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter ONCE (Singleton) to be reused
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // IMPORTANT for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

/**
 * Sends an email using Nodemailer with Gmail SMTP.
 * 
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body (text)
 * @returns {Promise<boolean>} - true on success, false on failure
 */
const sendEmail = async (to, subject, message) => {
  try {
    console.log("=== EMAIL SENDING START ===");
    
    // 1. Validate environment variables
    const { SMTP_USER, SMTP_PASS } = process.env;
    
    if (!SMTP_USER || !SMTP_PASS) {
      console.error("❌ MISSING SMTP CREDENTIALS:");
      console.table({
        SMTP_USER: SMTP_USER || "MISSING",
        SMTP_PASS: SMTP_PASS ? "PRESENT" : "MISSING",
      });
      return false;
    }

    // 2. Debug logs for credentials
    console.log("DEBUG - SMTP_USER:", SMTP_USER);
    console.log(`DEBUG - Target: ${to} | Subject: ${subject}`);

    // 3. Send the email
    const info = await transporter.sendMail({
      from: `"Clinical Serenity" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: message,
    });

    console.log("✅ EMAIL SENT SUCCESSFULLY");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log("=== EMAIL SENDING END ===");
    
    return true;

  } catch (error) {
    console.error("❌ CRITICAL EMAIL ERROR:");
    console.error("Error Message:", error.message);
    
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    
    console.error("Full Error Object:", error);
    console.log("=== EMAIL SENDING FAILED ===");
    
    return false;
  }
};

module.exports = {
  sendEmail,
  transporter,
};
