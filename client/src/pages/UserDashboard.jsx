import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, Plus, Sparkles, LogOut, User, Activity,
  CheckCircle2, XCircle, AlertCircle, Stethoscope, ArrowRight,
  RefreshCw, Edit3, Check, X, FileText, Download, Filter,
} from 'lucide-react';
import PatientReports from '../components/PatientReports';

const STATUS_CONFIG = {
  Pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, label: 'Pending' },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  Rejected: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
};

const SERVICE_LABELS = {
  cleaning: 'Professional Cleaning', rootcanal: 'Root Canal Therapy',
  implants: 'Dental Implants', braces: 'Braces / Orthodontics',
  whitening: 'Teeth Whitening', cosmetic: 'Cosmetic Dentistry',
  extraction: 'Tooth Extraction', pediatric: 'Pediatric Dentistry', other: 'Other',
};

// Simple Logo inline
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-white" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900">Clinical Serenity</h1>
        <p className="text-xs text-gray-500">Patient Portal</p>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const { user, logout, authFetch, updateProfile } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email?.split('@')[0] || user?.phone || 'User';

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/appointments');
      setAppointments(data.appointments || []);
    } catch (err) {
      setError(err.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/patient/reports');
      setReports(data.reports || []);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchReports();
    else fetchAppointments();
  }, [activeTab]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    try { await updateProfile(newName.trim()); setEditingName(false); } catch (err) { console.error(err); }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status === statusFilter;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    approved: appointments.filter(a => a.status === 'Approved').length,
    rejected: appointments.filter(a => a.status === 'Rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSaveName()} className="text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary w-32" autoFocus placeholder="Your name" />
                  <button onClick={handleSaveName} className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingName(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">{displayName}</span>
                  <button onClick={() => { setNewName(user?.name || ''); setEditingName(true); }} className="text-gray-400 hover:text-primary transition-colors" title="Edit name"><Edit3 className="w-3 h-3" /></button>
                </div>
              )}
            </div>
            <button onClick={handleLogout} id="user-logout" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome back, <span className="text-primary">{displayName}</span></h1>
            <p className="text-gray-500 text-sm">
              {user?.email && <span className="mr-3">{user.email}</span>}
              {user?.phone && <span>{user.phone}</span>}
            </p>
          </div>
          <Link to="/dashboard/book" id="book-appointment-btn" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 group shrink-0">
            <Plus className="w-4 h-4" /> Book Appointment <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Activity, color: 'text-primary', bg: 'bg-primary-50' },
            { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div></div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 w-fit">
            <button onClick={() => setActiveTab('appointments')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'appointments' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <Stethoscope className="w-4 h-4" /> My Appointments
            </button>
            <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'reports' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <FileText className="w-4 h-4" /> My Reports
            </button>
          </div>
          <button onClick={() => activeTab === 'reports' ? fetchReports() : fetchAppointments()} className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Status Filter for Appointments */}
        {activeTab === 'appointments' && (
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-4 h-4 text-gray-400" />
            {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>{s}</button>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
            {error}<button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : activeTab === 'reports' ? (
          /* Reports Tab */
          <PatientReports reports={reports} />
        ) : (
          /* Appointments Tab */
          filteredAppointments.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Calendar className="w-10 h-10 text-primary" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{statusFilter !== 'All' ? `No ${statusFilter} Appointments` : 'No Appointments Yet'}</h3>
              <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                {statusFilter !== 'All' ? `You don't have any ${statusFilter.toLowerCase()} appointments.` : "You haven't booked any appointments. Schedule your first visit today!"}
              </p>
              {statusFilter === 'All' && (
                <Link to="/dashboard/book" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all group">
                  <Plus className="w-4 h-4" /> Book Your First Appointment <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAppointments.map((apt) => {
                const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
                const StatusIcon = statusCfg.icon;
                return (
                  <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0"><Stethoscope className="w-5 h-5 text-primary" /></div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900">{SERVICE_LABELS[apt.service] || apt.service}</p>
                            <p className="text-xs text-gray-400">{apt.service}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {apt.time && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{apt.time}</span>}
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border ${statusCfg.color} shrink-0`}>
                        <StatusIcon className="w-3.5 h-3.5" /> {statusCfg.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>
    </div>
  );
}
