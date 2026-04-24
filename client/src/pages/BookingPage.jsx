import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';
import {
  Sparkles, ArrowLeft, Calendar, Clock, Send,
  CheckCircle2, Stethoscope, FileText, Loader2,
  AlertCircle, UserCircle2,
} from 'lucide-react';
import Logo from '../components/Logo';

const TIME_SLOTS = [
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM',
  '06:00 PM','06:30 PM','07:00 PM','07:30 PM',
];

const SERVICES = [
  { value: 'cleaning', label: 'Professional Cleaning', icon: '🪥' },
  { value: 'rootcanal', label: 'Root Canal Therapy', icon: '🦷' },
  { value: 'implants', label: 'Dental Implants', icon: '🔩' },
  { value: 'braces', label: 'Braces / Orthodontics', icon: '😁' },
  { value: 'whitening', label: 'Teeth Whitening', icon: '✨' },
  { value: 'cosmetic', label: 'Cosmetic Dentistry', icon: '💎' },
  { value: 'extraction', label: 'Tooth Extraction', icon: '🩹' },
  { value: 'pediatric', label: 'Pediatric Dentistry', icon: '👶' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export default function BookingPage() {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ date: '', time: '', service: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Doctor selection state
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  // Slot availability state
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  // Fetch doctors on mount
  // NOTE: If RLS blocks anon read on users table, falls back to backend API
  useEffect(() => {
    if (!user) return;
    
    const fetchDoctors = async () => {
      try {
        console.log('Fetching doctors from Supabase...');
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'doctor');

        if (error) {
          console.error('Supabase doctor fetch error:', error);
          throw error;
        }

        console.log('Doctors from Supabase:', data);

        if (data && data.length > 0) {
          setDoctors(data);
        } else {
          // No data returned — likely RLS is blocking anon read access
          // Fall back to backend API which uses service_role key
          console.log('No doctors from Supabase (possible RLS block), trying backend API...');
          try {
            const res = await authFetch('/doctors');
            console.log('Doctors from backend API:', res);
            if (res.doctors && res.doctors.length > 0) {
              setDoctors(res.doctors);
            } else {
              console.warn('No doctors found in database. Ensure users with role="doctor" exist.');
              setDoctors([]);
            }
          } catch (apiErr) {
            console.error('Backend doctor fetch error:', apiErr);
            setDoctors([]);
          }
        }
      } catch (err) {
        console.error('Fetch doctors error:', err);
        // Try backend API as fallback
        try {
          const res = await authFetch('/doctors');
          if (res.doctors && res.doctors.length > 0) {
            setDoctors(res.doctors);
          }
        } catch (apiErr) {
          console.error('Backend fallback also failed:', apiErr);
        }
      } finally {
        setDoctorsLoading(false);
      }
    };
    fetchDoctors();
  }, [authFetch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const selectService = (value) => setFormData({ ...formData, service: value });
  const today = new Date().toISOString().split('T')[0];

  // Convert date string to YYYY-MM-DD for Supabase queries
  const toYMD = (dateStr) => {
    if (!dateStr) return '';
    // If already YYYY-MM-DD (from date input), return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // Otherwise parse and convert
    return new Date(dateStr).toISOString().split('T')[0];
  };

  // Fetch booked slots directly from Supabase whenever date changes
  const fetchBookedSlots = useCallback(async (date) => {
    if (!date) {
      setBookedSlots([]);
      return;
    }
    const formattedDate = toYMD(date);
    console.log('Fetching booked slots for date:', formattedDate);
    setSlotsLoading(true);
    setSlotsError('');
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('time')
        .eq('date', formattedDate)
        .neq('status', 'Rejected');

      if (error) throw error;

      const slots = (data || []).map(item => item.time).filter(Boolean);
      console.log('Booked slots found:', slots);
      setBookedSlots(slots);
    } catch (err) {
      console.error('Fetch booked slots error:', err);
      setSlotsError('Could not check slot availability');
      setBookedSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // When date changes, fetch booked slots and clear selected time
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setFormData({ ...formData, date: newDate, time: '' });
    fetchBookedSlots(newDate);
  };

  const selectTime = (time) => {
    // Don't allow selecting booked slots
    if (bookedSlots.includes(time)) return;
    setFormData({ ...formData, time });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.service) { setError('Please select a service'); return; }
    if (!selectedDoctorId) { setError('Please select a doctor'); return; }
    if (!formData.date) { setError('Please select a date'); return; }
    if (!formData.time) { setError('Please select a time slot'); return; }

    setLoading(true);
    try {
      const payload = {
        name: user?.name || 'Patient',
        email: user?.email || '',
        phone: user?.phone || '',
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
        doctor_id: selectedDoctorId,
      };
      console.log('Booking payload:', payload);
      await authFetch('/appointments', { method: 'POST', body: JSON.stringify(payload) });
      setSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to book appointment.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Appointment Booked!</h1>
          <p className="text-gray-500 mb-2">Your appointment has been submitted and is pending approval.</p>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6 mb-8 text-left">
            <div className="space-y-3">
              {[
                ['Patient', user?.name || 'Patient'],
                ['Email', user?.email || '—'],
                ['Phone', user?.phone || '—'],
                ['Doctor', doctors.find(d => d.id === selectedDoctorId)?.name || '—'],
                ['Service', SERVICES.find(s => s.value === formData.service)?.label || formData.service],
                ['Date', new Date(formData.date).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})],
                ['Time', formData.time],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-700">{val}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">⏳ Pending</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard" className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all">View Dashboard</Link>
            <button onClick={() => { setSubmitted(false); setFormData({ date:'', time:'', service:'', notes:'' }); setSelectedDoctorId(''); setBookedSlots([]); }} className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">Book Another</button>
          </div>
        </div>
      </div>
    );
  }

  const availableCount = TIME_SLOTS.length - bookedSlots.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <div className="hidden sm:block">
            <Logo className="scale-75 origin-right" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-500 text-sm">Schedule your visit. We'll confirm your appointment shortly.</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-primary-50 text-primary px-4 py-2 rounded-xl text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Booking as <span className="font-bold">{user?.name || user?.email}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Service Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Select Service
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map((svc) => (
                <button key={svc.value} type="button" onClick={() => selectService(svc.value)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all duration-200 text-sm ${
                    formData.service === svc.value
                      ? 'border-primary bg-primary-50 text-primary font-semibold shadow-sm'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  <span className="text-lg">{svc.icon}</span>
                  <span className="text-xs sm:text-sm leading-tight">{svc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <UserCircle2 className="w-4 h-4 text-primary" /> Select Doctor
            </h2>
            {doctorsLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading doctors...</span>
              </div>
            ) : doctors.length === 0 ? (
              <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>No doctors available at the moment.</span>
              </div>
            ) : (
              <select
                id="doctor-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="">— Choose a doctor —</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" /> Date & Time
            </h2>

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Preferred Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleDateChange} min={today} required
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all" />
            </div>

            {/* Time Slots */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Time Slot
                </label>
                {formData.date && !slotsLoading && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    availableCount > 0
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-red-50 text-red-500 border border-red-200'
                  }`}>
                    {availableCount} of {TIME_SLOTS.length} available
                  </span>
                )}
              </div>

              {!formData.date ? (
                /* Prompt to select date first */
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-400">
                  <Calendar className="w-5 h-5 text-gray-300 shrink-0" />
                  <span>Please select a date to view available time slots</span>
                </div>
              ) : slotsLoading ? (
                /* Loading state */
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Checking availability...</span>
                </div>
              ) : null}

              {/* Slot Grid — shown when date is selected and not loading */}
              {formData.date && !slotsLoading && (
                <>
                  {slotsError && (
                    <div className="flex items-center gap-2 p-4 mb-3 bg-amber-50 rounded-xl border border-amber-100 text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{slotsError}. You can still select a time slot.</span>
                    </div>
                  )}
                  {!slotsError && availableCount === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-7 h-7 text-red-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-700 mb-1">Fully Booked</h3>
                      <p className="text-sm text-gray-400">All slots are taken for this date. Please select another date.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = formData.time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => selectTime(slot)}
                            disabled={isBooked}
                            id={`slot-${slot.replace(/[: ]/g, '-')}`}
                            className={`relative py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-200 ${
                              isBooked
                                ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                : isSelected
                                  ? 'border-primary bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary hover:shadow-sm'
                            }`}
                          >
                            {slot}
                            {isBooked && (
                              <span className="absolute -top-1.5 -right-1.5 bg-red-100 text-red-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none border border-red-200">
                                Booked
                              </span>
                            )}
                            {isSelected && (
                              <CheckCircle2 className="w-3 h-3 absolute -top-1 -right-1 text-white bg-primary rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}


            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Additional Notes
            </h2>
            <textarea name="notes" value={formData.notes} onChange={handleChange}
              placeholder="Tell us about any specific concerns, allergies, or preferences..."
              rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all resize-none placeholder:text-gray-300" />
          </div>

          <button type="submit" id="submit-booking" disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold text-base hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group">
            {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Booking...</>) : (<>Confirm Appointment <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>)}
          </button>
        </form>
      </main>
    </div>
  );
}
