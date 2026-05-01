import supabase from "../config/supabaseClient.js";

/**
 * Controller to fetch all appointments with doctor and patient details.
 * Optimized for the existing schema where doctors are stored in the 'users' table.
 */
export const getAllAppointments = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_name,
        phone,
        service,
        date,
        time,
        status,
        doctor_id,
        doctors:users!appointments_doctor_id_fkey (
          name
        )
      `)
      .order("date", { ascending: true });

    if (error) throw error;

    // Mapping to requested format with robust fallback for doctor_name
    const formatted = data.map((item) => ({
      id: item.id,
      patient_name: item.patient_name,
      phone: item.phone,
      service: item.service,
      date: item.date,
      time: item.time,
      status: item.status,
      doctor_name: (item.doctors?.name) || "N/A"
    }));

    res.json({ success: true, appointments: formatted });

  } catch (err) {
    console.error("ADMIN FETCH ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
