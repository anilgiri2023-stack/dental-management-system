import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Sparkles,
  LogOut,
  User,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  RefreshCw,
  Mail,
  Phone,
} from 'lucide-react';
import Logo from '../components/Logo';

const STATUS_CONFIG = {
  Pending: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    icon: AlertCircle,
    label: 'Pending',
  },
  Approved: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
    label: 'Approved',
  },
  Rejected: {
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-400',
    icon: XCircle,
    label: 'Rejected',
  },
};

const SERVICE_LABELS = {
  cleaning: 'Professional Cleaning',
  rootcanal: 'Root Canal Therapy',
  implants: 'Dental Implants',
  braces: 'Braces / Orthodontics',
  whitening: 'Teeth Whitening',
  cosmetic: 'Cosmetic Dentistry',
  extraction: 'Tooth Extraction',
  pediatric: 'Pediatric Dentistry',
  other: 'Other',
};

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, logout, authFetch } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.name || user?.email?.split('@')[0] || user?.phone || 'Doctor';

  // Fetch doctor's assigned appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/appointments');
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'Pending').length,
    approved: appointments.filter((a) => a.status === 'Approved').length,
    rejected: appointments.filter((a) => a.status === 'Rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-gray-700">Dr. {displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Welcome back, <span className="text-primary">Dr. {displayName}</span>
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your assigned patient appointments below.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Activity, color: 'text-primary', bg: 'bg-primary-50' },
            { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label} Patients</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            My Schedule
          </h2>
          <button
            onClick={fetchAppointments}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading your schedule...</p>
          </div>
        ) : appointments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Appointments</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              You don't have any appointments assigned to you yet.
            </p>
          </div>
        ) : (
          /* Appointment Cards */
          <div className="grid gap-4">
            {appointments.map((apt) => {
              const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={apt.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-gray-900">
                            {apt.name}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {apt.email && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> {apt.email}
                              </span>
                            )}
                            {apt.phone && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> {apt.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="font-semibold text-primary">
                          {SERVICE_LABELS[apt.service] || apt.service}
                        </span>
                        <div className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {apt.time && (
                          <>
                            <div className="w-1 h-1 bg-gray-300 rounded-full" />
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {apt.time}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${statusCfg.color} shrink-0`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusCfg.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
