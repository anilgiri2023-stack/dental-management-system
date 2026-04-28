require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer with Brevo SMTP.
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
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
    
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
      console.error("❌ MISSING SMTP CONFIGURATION:");
      console.table({
        SMTP_HOST: SMTP_HOST || "MISSING",
        SMTP_PORT: SMTP_PORT || "MISSING",
        SMTP_USER: SMTP_USER || "MISSING",
        SMTP_PASS: SMTP_PASS ? "PRESENT" : "MISSING",
        SMTP_FROM: SMTP_FROM || "MISSING"
      });
      return false;
    }

    // 2. Debug logs for credentials
    console.log("DEBUG - SMTP_USER:", SMTP_USER);
    console.log("DEBUG - SMTP_PASS:", SMTP_PASS ? "EXISTS (HIDDEN)" : "MISSING");
    console.log(`DEBUG - Target: ${to} | Subject: ${subject}`);

    // 3. Create transporter INSIDE function (Brevo Config)
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST, // Expected: smtp-relay.brevo.com
      port: parseInt(SMTP_PORT), // Expected: 587
      secure: false, // true for 465, false for 587
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // 4. Send the email
    const info = await transporter.sendMail({
      from: `"Clinical Serenity" <${SMTP_FROM}>`,
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
    if (error.responseCode) {
      console.error("SMTP Response Code:", error.responseCode);
    }
    
    console.error("Full Error Object:", error);
    console.log("=== EMAIL SENDING FAILED ===");
    
    return false;
  }
};

module.exports = {
  sendEmail,
};
