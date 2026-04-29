const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: Number(process.env.SMTP_PORT) || 2525, // ✅ FIXED
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  connectionTimeout: 20000, // ✅ important for Render
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

/**
 * Debug check (run once on server start)
 */
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP CONNECTION FAILED:", error);
  } else {
    console.log("✅ SMTP SERVER READY");
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
    console.error("❌ Email send error FULL:", error); // ✅ full log
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