const axios = require("axios");

async function sendEmail({ to, subject, html }) {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.SMTP_USER },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Email sent via Brevo API");
    return { success: true };

  } catch (error) {
    console.error("❌ Brevo API error:", error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

async function sendOTP(email, otp) {
  return await sendEmail({
    to: email,
    subject: "Dental OTP Verification",
    html: `<h2>Your OTP is: ${otp}</h2><p>Valid for 5 minutes.</p>`
  });
}

module.exports = { sendEmail, sendOTP };