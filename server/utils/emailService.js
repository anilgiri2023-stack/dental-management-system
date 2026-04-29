const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error) {
    console.log("Email error:", error);
    return { success: false, error };
  }
}

async function sendOTP(email, otp) {
  return await sendEmail({
    to: email,
    subject: "Dental OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2>`
  });
}

module.exports = { sendEmail, sendOTP };
