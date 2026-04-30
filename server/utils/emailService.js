const { Resend } = require("resend"); 

const resend = new Resend(process.env.RESEND_API_KEY); 

console.log("USING RESEND"); 

async function sendEmail({ to, subject, html }) { 
  try { 
    const data = await resend.emails.send({ 
      from: `"Clinical Serenity" <${process.env.EMAIL_FROM}>`, 
      to, 
      subject, 
      html, 
    }); 

    console.log("Email sent:", data.id); 
    return { success: true }; 
  } catch (error) { 
    console.error("Email failed:", error); 
    return { success: false }; 
  } 
} 

async function sendOTPEmail(to, otp) { 
  const html = ` 
    <h2>Your OTP Code</h2> 
    <p>Your OTP is: <b>${otp}</b></p> 
    <p>This code is valid for 5 minutes.</p> 
  `; 

  return sendEmail({ 
    to, 
    subject: "OTP Verification", 
    html, 
  }); 
} 

module.exports = { sendEmail, sendOTPEmail }; 
