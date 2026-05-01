const { Resend } = require("resend"); 

// Initializing with environment variable
const resend = new Resend(process.env.RESEND_API_KEY); 

console.log(`✅ Resend initialized (Using verified domain: roamflux.site)`);

/**
 * Reusable generic email sending function using Resend API.
 */
async function sendEmail({ to, subject, html, from }) { 
  try { 
    console.log(`📤 Sending email to: ${to}`);
    
    // Verified domain sender: Clinical Serenity <no-reply@roamflux.site>
    // Explicit format to satisfy Resend verification checks
    const fromEmail = "no-reply@roamflux.site";

    const { data, error } = await resend.emails.send({ 
      from: `"Clinical Serenity" <${fromEmail}>`, 
      to, 
      subject, 
      html, 
    }); 

    if (error) {
      console.error("❌ RESEND ERROR:", JSON.stringify(error, null, 2));
      return { success: false, error: error.message || "Validation error" };
    }

    console.log("✅ RESEND SUCCESS:", data); 
    console.log(`✅ Email successfully sent to: ${to}`);
    return { success: true, id: data.id }; 
  } catch (err) { 
    console.error("❌ EMAIL FUNCTION ERROR:", err);
    if (err.cause) console.error("   Cause:", err.cause);
    return { success: false, error: err.message }; 
  } 
} 

/**
 * Specifically for sending OTP emails
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP code
 */
async function sendOTPEmail(to, otp) { 
  const html = ` 
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
      <h2 style="color: #2e7d6b; text-align: center;">Your OTP Code</h2>
      <p>Hello,</p>
      <p>Your verification code for Clinical Serenity is:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d6b; background: #f4f7fb; padding: 10px 20px; border-radius: 5px;">${otp}</span>
      </div>
      <p>This code is valid for <b>5 minutes</b>. Please do not share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 10px; color: #aaa; text-align: center;">© Clinical Serenity Dental Clinic</p>
    </div>
  `; 

  return sendEmail({ 
    to, 
    subject: "OTP Verification", 
    html, 
  }); 
} 

async function sendBookingEmail(to, appointment) {
  const doctorName = appointment.doctor_name || appointment.doctor?.name || "our specialist";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #2e7d6b;">Appointment Confirmed</h2>
      <p>Your appointment has been booked successfully at <b>Clinical Serenity</b>.</p>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><b>Doctor:</b> Dr. ${doctorName}</p>
        <p style="margin: 5px 0;"><b>Date:</b> ${appointment.date}</p>
        <p style="margin: 5px 0;"><b>Time:</b> ${appointment.time}</p>
      </div>
      <p>Status: <b>Pending Approval</b></p>
      <p>Thank you for choosing us!</p>
    </div>
  `;

  return sendEmail({
    to,
    subject: "Appointment Booked",
    html
  });
}

module.exports = { sendEmail, sendOTPEmail, sendBookingEmail }; 
