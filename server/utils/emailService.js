const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * Sends a general email using Nodemailer.
 */
async function sendEmail({ to, subject, html }) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent: ${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Email send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Sends an OTP email specifically.
 */
async function sendOTP(email, otp) {
  return await sendEmail({
    to: email,
    subject: "Dental OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes.</p>`
  });
}

module.exports = { sendEmail, sendOTP };
