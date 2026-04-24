import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadFetch } from '../utils/api';
import {
  Calendar, Clock, Sparkles, LogOut, User, Activity,
  CheckCircle2, XCircle, AlertCircle, Stethoscope,
  RefreshCw, Mail, Phone, Upload, FileText, Users, Loader2, X,
} from 'lucide-react';
import Logo from '../components/Logo';

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

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upload modal
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPatientId, setUploadPatientId] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const { user, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email?.split('@')[0] || 'Doctor';

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

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/doctor/patients');
      setPatients(data.patients || []);
    } catch (err) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'patients') fetchPatients();
    else fetchAppointments();
  }, [activeTab]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => {
    const d = new Date(a.date).toISOString().split('T')[0];
    return d === todayStr;
  });

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadPatientId) { setError('Select a patient and file'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('patient_id', uploadPatientId);
      formData.append('notes', uploadNotes);
      await uploadFetch('/upload-report', formData);
      setSuccessMsg('Report uploaded successfully');
      setShowUpload(false);
      setUploadFile(null);
      setUploadPatientId('');
      setUploadNotes('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const stats = {
    total: appointments.length,
    today: todayApts.length,
    pending: appointments.filter(a => a.status === 'Pending').length,
    approved: appointments.filter(a => a.status === 'Approved').length,
  };

  const renderAptCards = (list) => (
    <div className="grid gap-4">
      {list.map((apt) => {
        const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
        const StatusIcon = statusCfg.icon;
        return (
          <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900">{apt.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {apt.email && <span className="text-xs text-gray-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {apt.email}</span>}
                      {apt.phone && <span className="text-xs text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {apt.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="font-semibold text-primary">{SERVICE_LABELS[apt.service] || apt.service}</span>
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-gray-400" />{new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {apt.time && (<><div className="w-1 h-1 bg-gray-300 rounded-full" /><span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" />{apt.time}</span></>)}
                </div>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border ${statusCfg.color} shrink-0`}>
                <StatusIcon className="w-4 h-4" /> {statusCfg.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center"><Stethoscope className="w-4 h-4 text-primary" /></div>
              <span className="text-sm font-medium text-gray-700">Dr. {displayName}</span>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Welcome back, <span className="text-primary">Dr. {displayName}</span></h1>
            <p className="text-gray-500 text-sm">Manage your appointments and patient reports.</p>
          </div>
          <button onClick={() => { fetchPatients(); setShowUpload(true); }} className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shrink-0">
            <Upload className="w-4 h-4" /> Upload Report
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: Activity, color: 'text-primary', bg: 'bg-primary-50' },
            { label: "Today", value: stats.today, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending', value: stats.pending, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3"><div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div></div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label} Patients</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-6 w-fit">
          {[
            { id: 'today', label: "Today's Schedule", icon: Calendar },
            { id: 'all', label: 'All Appointments', icon: Stethoscope },
            { id: 'patients', label: 'My Patients', icon: Users },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
            {error}<button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading...</p>
          </div>
        ) : activeTab === 'patients' ? (
          patients.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-primary" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Patients</h3>
              <p className="text-gray-500 text-sm">No patients assigned to you yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Email</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Phone</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {patients.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center"><User className="w-4 h-4 text-primary" /></div><span className="text-sm font-semibold text-gray-900">{p.name}</span></div></td>
                        <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-gray-600">{p.email || '—'}</span></td>
                        <td className="px-6 py-4 hidden sm:table-cell"><span className="text-sm text-gray-600">{p.phone || '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <>
            {(activeTab === 'today' ? todayApts : appointments).length === 0 ? (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6"><Calendar className="w-10 h-10 text-primary" /></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{activeTab === 'today' ? 'No Appointments Today' : 'No Appointments'}</h3>
                <p className="text-gray-500 text-sm">{activeTab === 'today' ? 'You have no appointments scheduled for today.' : 'No appointments assigned to you yet.'}</p>
              </div>
            ) : renderAptCards(activeTab === 'today' ? todayApts : appointments)}
          </>
        )}
      </main>

      {/* Upload Report Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />Upload Report</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
                <select required value={uploadPatientId} onChange={(e) => setUploadPatientId(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none">
                  <option value="">Choose patient...</option>
                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File (PDF, JPG, PNG)</label>
                <input type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setUploadFile(e.target.files[0])} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input type="text" value={uploadNotes} onChange={(e) => setUploadNotes(e.target.value)} placeholder="e.g. X-ray results" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none" />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowUpload(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className={`flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {uploading ? (<><Loader2 className="w-4 h-4 animate-spin" />Uploading...</>) : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
