const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends an email using Resend API.
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email body (HTML)
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    console.log("=== RESEND EMAIL START ===");
    console.log(`To: ${to} | Subject: ${subject}`);

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing in environment variables");
      return { success: false, error: "Missing API key" };
    }

    const { data, error } = await resend.emails.send({
      from: 'Clinical Serenity <onboarding@resend.dev>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return { success: false, error };
    }

    console.log("✅ Resend Email Success:", data);
    console.log("=== RESEND EMAIL END ===");
    return { success: true, data };

  } catch (error) {
    console.error("🔥 Resend Fatal Error:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
};
