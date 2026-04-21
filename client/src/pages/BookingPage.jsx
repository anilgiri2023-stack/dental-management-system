import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowLeft,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  Stethoscope,
  FileText,
  User,
  Loader2,
} from 'lucide-react';
import supabase from '../utils/supabase';

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
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

  const [formData, setFormData] = useState({
    phone: '',
    date: '',
    time: '',
    service: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectService = (value) => {
    setFormData({ ...formData, service: value });
  };

  const selectTime = (time) => {
    setFormData({ ...formData, time });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!formData.date) {
      setError('Please select a date');
      return;
    }
    if (!formData.time) {
      setError('Please select a time slot');
      return;
    }
    if (!formData.service) {
      setError('Please select a service');
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user details from Supabase users table using logged-in user's ID
      const { data: dbUser, error: dbErr } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbErr) {
        console.warn('Could not fetch user details from Supabase:', dbErr);
      }

      // 2. Ensure we have the required details (falling back to context/form if necessary)
      const bookingName = dbUser?.name || user?.name || 'Patient';
      const bookingEmail = dbUser?.email || user?.email || '';
      const bookingPhone = formData.phone || dbUser?.phone || user?.phone || '';

      // 3. Modify the booking API request to include exactly these fields
      const payload = {
        name: bookingName,
        email: bookingEmail,
        phone: bookingPhone,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        notes: formData.notes
      };

      console.log('Confirmed Booking Details BEFORE sending:', payload);

      await authFetch('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Appointment Booked!</h1>
          <p className="text-gray-500 mb-2">
            Your appointment has been submitted and is pending approval.
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-6 mb-8 text-left">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Patient</span>
                <span className="font-semibold text-gray-700">{user?.name || 'Patient'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Mobile</span>
                <span className="font-semibold text-gray-700">{formData.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service</span>
                <span className="font-semibold text-gray-700">
                  {SERVICES.find(s => s.value === formData.service)?.label || formData.service}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date</span>
                <span className="font-semibold text-gray-700">
                  {new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Time</span>
                <span className="font-semibold text-gray-700">{formData.time}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Status</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  <AlertCircleIcon className="w-3 h-3" />
                  Pending
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-dark transition-all"
            >
              View Dashboard
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ phone: '', date: '', time: '', service: '', notes: '' });
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Book Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:inline">
              Clinical <span className="text-primary">Serenity</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book an Appointment</h1>
          <p className="text-gray-500 text-sm">
            Schedule your visit. We'll confirm your appointment shortly.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Patient Contact Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Patient Contact Info
            </h2>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
               pattern="[0-9]{10}"
               maxLength="10"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          {/* Service Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" />
              Select Service
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SERVICES.map((svc) => (
                <button
                  key={svc.value}
                  type="button"
                  onClick={() => selectService(svc.value)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-xl border-2 text-left transition-all duration-200 text-sm ${
                    formData.service === svc.value
                      ? 'border-primary bg-primary-50 text-primary font-semibold shadow-sm'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{svc.icon}</span>
                  <span className="text-xs sm:text-sm leading-tight">{svc.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Date & Time
            </h2>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                Preferred Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={today}
                required
                className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Time Slot
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => selectTime(slot)}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-all duration-200 ${
                      formData.time === slot
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Additional Notes
            </h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tell us about any specific concerns, allergies, or preferences..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="submit-booking"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-semibold text-base hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                Confirm Appointment
                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

// Small helper since the icon isn't imported at top level for the success panel
function AlertCircleIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
