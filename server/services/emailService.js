const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

/**
 * Sends an email using Nodemailer.
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} message - Email body (text format)
 * @returns {Promise<boolean>} - Resolves to true if successful, false otherwise
 */
const sendEmail = async (to, subject, message) => {
  try {
    console.log(`📧 Attempting to send email to: ${to} | Subject: ${subject}`);
    
    const info = await transporter.sendMail({
      from: `"Dental Clinic" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
    });

    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = {
  sendEmail,
};
