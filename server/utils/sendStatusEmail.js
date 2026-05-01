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
        <div style="font-family: Arial, sans-serif; background:#f4f7fb; padding:20px;">
          <div style="max-width:600px; margin:auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="background:linear-gradient(135deg,#0ea5e9,#22c55e); padding:20px; color:white;">
              <h2 style="margin:0;">Clinical Serenity</h2>
              <p style="margin:5px 0 0; font-size:14px;">Appointment Status Update</p>
            </div>
            <div style="padding:25px;">
              <h3 style="margin-top:0; color:#111;">
                Your appointment has been 
                <span style="color:${status === "Approved" || status === "approved" ? "#16a34a" : "#dc2626"};">
                  ${status}
                </span>
              </h3>
              <div style="margin-top:20px; border:1px solid #e5e7eb; border-radius:10px; padding:15px; background:#fafafa;">
                <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
                <p><strong>Service:</strong> ${appointment.service}</p>
                <p><strong>Date:</strong> ${appointment.date}</p>
                <p><strong>Time:</strong> ${appointment.time}</p>
              </div>
              <div style="margin-top:25px; text-align:center;">
                <a href="http://localhost:5173/appointments" style="background:#0ea5e9; color:white; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
                  View Appointment
                </a>
              </div>
              <p style="margin-top:25px; font-size:13px; color:#6b7280;">
                If you have any questions, feel free to contact us.
              </p>
            </div>
          </div>
        </div>
      `
    });

    console.log("STATUS EMAIL SENT TO:", appointment.email);

  } catch (error) {
    console.error("EMAIL ERROR:", error);
  }
};
