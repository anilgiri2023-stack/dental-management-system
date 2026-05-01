import { Resend } from "resend";

// Resend initialization (using environment variable)
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Shared utility to send appointment status update emails.
 * @param {Object} appointment - The appointment object containing patient and doctor details.
 * @param {string} status - The new status (Approved/Rejected/etc.).
 */
export const sendStatusEmail = async (appointment, status) => {
  try {
    if (!appointment.email) {
      console.error("No patient email found, skipping notification.");
      return;
    }

    // Map doctor name from nested object if needed
    const doctorName = appointment.doctor_name || (appointment.doctor?.name) || "our specialist";

    console.log("📧 Sending status update email to:", appointment.email);

    await resend.emails.send({
      from: "Clinical Serenity <no-reply@roamflux.site>",
      to: appointment.email,
      subject: `Appointment Status Update: ${status}`,
      html: `
        <div style="background-color: #f4f7f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #eef2f1;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, ${status.toLowerCase() === "approved" ? "#2e7d6b 0%, #3d9e8b 100%" : "#b91c1c 0%, #dc2626 100%"}); padding: 40px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Clinical Serenity</h1>
                <p style="color: #d1e9e4; margin: 10px 0 0 0; font-size: 16px;">Appointment Update</p>
              </td>
            </tr>
            
            <!-- Body -->
            <tr>
              <td style="padding: 40px;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 700; color: #1a1a1a;">Status Update</h2>
                <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #555;">
                  Your appointment has been 
                  <span style="color: ${status.toLowerCase() === "approved" ? "#2e7d6b" : "#dc2626"}; font-weight: 700;">${status}</span>.
                </p>
                
                <!-- Details Box -->
                <div style="background-color: #f9fcfb; border: 1px solid #e2ece9; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Doctor</span>
                        <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 4px;">Dr. ${doctorName}</div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 15px;">
                        <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Service</span>
                        <div style="font-size: 16px; font-weight: 600; color: #2e7d6b; margin-top: 4px;">${appointment.service}</div>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span style="font-size: 11px; font-weight: 700; color: #8e9a97; text-transform: uppercase; letter-spacing: 1px;">Date & Time</span>
                        <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin-top: 4px;">${appointment.date} at ${appointment.time}</div>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- CTA -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/appointments" style="background: linear-gradient(135deg, #2e7d6b 0%, #3d9e8b 100%); color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(46, 125, 107, 0.2);">View Details</a>
                </div>
                
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #777; text-align: center;">If you have any questions, please reach out to us at support@clinicalserenity.com</p>
              </td>
            </tr>
            
            <!-- Footer -->
            <tr>
              <td style="padding: 0 40px 40px 40px; text-align: center;">
                <div style="border-top: 1px solid #eee; padding-top: 30px;">
                  <p style="margin: 0; font-size: 14px; font-weight: 700; color: #2e7d6b;">Clinical Serenity</p>
                  <p style="margin: 15px 0 0 0; font-size: 12px; color: #aaa;">Modern Dental Care Excellence</p>
                </div>
              </td>
            </tr>
          </table>
        </div>
      `
    });

    console.log("STATUS EMAIL SENT TO:", appointment.email);

  } catch (error) {
    console.error("EMAIL ERROR:", error);
  }
};
