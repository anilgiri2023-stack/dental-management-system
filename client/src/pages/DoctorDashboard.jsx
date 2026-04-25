import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReportUploadModal from '../components/ReportUploadModal';
import AvatarUploadModal from '../components/AvatarUploadModal';
import {
  Calendar, Clock, LogOut, User, Users,
  CheckCircle2, XCircle, AlertCircle, Stethoscope,
  RefreshCw, Mail, Phone, Upload, FileText, Loader2,
  Edit3, Trash2, Activity, ClipboardList, ChevronRight, Zap, Bell, Camera
} from 'lucide-react';
import Logo from '../components/Logo';

// ─── Dynamic greeting based on time of day ───
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const STATUS_CONFIG = {
  Pending:  { color: 'bg-amber-50 text-amber-700 border-amber-200',    icon: AlertCircle,  label: 'Pending' },
  Approved: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Approved' },
  Rejected: { color: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle,      label: 'Rejected' },
};

const SERVICE_LABELS = {
  cleaning: 'Professional Cleaning', rootcanal: 'Root Canal Therapy',
  implants: 'Dental Implants', braces: 'Braces / Orthodontics',
  whitening: 'Teeth Whitening', cosmetic: 'Cosmetic Dentistry',
  extraction: 'Tooth Extraction', pediatric: 'Pediatric Dentistry', other: 'Other',
};

// ─── Date helpers ───
function toDateStr(d) { return d.toISOString().split('T')[0]; }
function isToday(dateStr)    { return dateStr === toDateStr(new Date()); }
function isTomorrow(dateStr) {
  const t = new Date(); t.setDate(t.getDate() + 1);
  return dateStr === toDateStr(t);
}
function isWithin7Days(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0);
  const end = new Date(today); end.setDate(end.getDate() + 7);
  const d = new Date(dateStr + 'T00:00:00');
  return d >= today && d <= end;
}
function dateBadge(dateStr) {
  if (isToday(dateStr))    return { text: 'Today',    cls: 'bg-red-100 text-red-700 border-red-200' };
  if (isTomorrow(dateStr)) return { text: 'Tomorrow', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
  return                          { text: 'Upcoming',  cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
}
function sortByTime(a, b) {
  return (a.time || '').localeCompare(b.time || '') || (a.date || '').localeCompare(b.date || '');
}

// ─── Stat Card ───
function StatCard({ icon: Icon, label, value, accent, delay }) {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex items-center gap-4 hover:shadow-md transition-all animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Appointment Card ───
function AppointmentCard({ apt, highlight, reports, onUpload, onEdit, onDelete, deletingId, onStatusChange }) {
  const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
  const StatusIcon = statusCfg.icon;
  const badge = dateBadge(apt.date);
  const aptReports = reports.filter(r => r.appointment_id === apt.id);

  const statusSelectColors = {
    Pending: 'border-amber-300 bg-amber-50 text-amber-700',
    Approved: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    Rejected: 'border-red-300 bg-red-50 text-red-700',
  };

  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${highlight ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-gray-100'}`}>
      {/* Top row: badge + status dropdown */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.text}
        </span>
        <select
          value={apt.status}
          onChange={(e) => onStatusChange(apt.id, e.target.value)}
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-colors ${statusSelectColors[apt.status] || statusSelectColors.Pending}`}
        >
          <option value="Pending">⏳ Pending</option>
          <option value="Approved">✅ Approved</option>
          <option value="Rejected">❌ Rejected</option>
        </select>
      </div>

      {/* Patient info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900 truncate">{apt.name}</p>
          {apt.email && <p className="text-[11px] text-gray-400 truncate flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" />{apt.email}</p>}
        </div>
      </div>

      {/* Service + Date/Time */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Stethoscope className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="font-medium">{SERVICE_LABELS[apt.service] || apt.service}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          {apt.time && (
            <span className="flex items-center gap-1 ml-1 text-emerald-600 font-semibold">
              <Clock className="w-3 h-3" />{apt.time}
            </span>
          )}
        </div>
        {apt.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Phone className="w-3.5 h-3.5 shrink-0" />{apt.phone}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onUpload(apt)}
          className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
        >
          <Upload className="w-3 h-3" /> Upload Report
        </button>
        {aptReports.map(report => (
          <div key={report.id} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
            <FileText className="w-3 h-3 text-emerald-500" />
            <span className="truncate max-w-[80px]">{report.title || 'Report'}</span>
            <button onClick={() => onEdit(apt, report)} className="text-gray-400 hover:text-blue-500 ml-1"><Edit3 className="w-3 h-3" /></button>
            <button onClick={() => onDelete(report.id)} disabled={deletingId === report.id} className="text-gray-400 hover:text-red-500 disabled:opacity-50">
              {deletingId === report.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Main Dashboard
// ═══════════════════════════════════════
export default function DoctorDashboard() {
  const { user, setUser, logout, authFetch } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.name || user?.email?.split('@')[0] || 'Doctor';

  const [appointments, setAppointments] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [deletingReportId, setDeletingReportId] = useState(null);
  const [showAllTable, setShowAllTable] = useState(false);

  // ─── New state: greeting, avatar, notifications ───
  const [greeting, setGreeting] = useState(getGreeting());
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarChecked, setAvatarChecked] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedNotifs, setDismissedNotifs] = useState(new Set());

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [aptData, repData] = await Promise.all([
        authFetch('/appointments'),
        authFetch('/doctor/reports'),
      ]);
      setAppointments(aptData.appointments || []);
      setReports(repData.reports || []);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load data');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // ─── Greeting auto-update (every 60s) ───
  useEffect(() => {
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ─── Avatar: fetch on mount, prompt if null ───
  useEffect(() => {
    (async () => {
      try {
        const data = await authFetch('/avatar');
        const url = data.avatar_url || null;
        setAvatarUrl(url);
        if (!url) setShowAvatarModal(true);
      } catch {
        // silent — fallback to icon
      } finally {
        setAvatarChecked(true);
      }
    })();
  }, []);

  // ─── Notifications: detect appointments within 30 min ───
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayStr = toDateStr(now);
      const alerts = appointments.filter(apt => {
        if (apt.date !== todayStr || !apt.time || apt.status === 'Rejected') return false;
        if (dismissedNotifs.has(apt.id)) return false;
        const [h, m] = apt.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) return false;
        const aptTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
        const diff = (aptTime - now) / 60000; // minutes
        return diff > 0 && diff <= 30;
      });
      setNotifications(alerts);
    };
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [appointments, dismissedNotifs]);

  const dismissNotif = (aptId) => {
    setDismissedNotifs(prev => new Set(prev).add(aptId));
  };

  const handleLogout = async () => { await logout(); navigate('/'); };
  const handleOpenUpload = (apt) => { setActiveAppointment(apt); setActiveReport(null); setShowUploadModal(true); };
  const handleOpenEdit = (apt, report) => { setActiveAppointment(apt); setActiveReport(report); setShowUploadModal(true); };
  const handleDeleteReport = async (reportId) => {
    if (!window.confirm('Delete this report?')) return;
    setDeletingReportId(reportId); setError('');
    try {
      await authFetch(`/reports/${reportId}`, { method: 'DELETE' });
      setReports(prev => prev.filter(r => r.id !== reportId));
      setSuccessMsg('Report deleted'); setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) { setError(err.message || 'Failed to delete'); }
    finally { setDeletingReportId(null); }
  };

  // ─── Status change: optimistic UI with rollback ───
  const handleStatusChange = async (aptId, newStatus) => {
    const prevAppointments = [...appointments];
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: newStatus } : a));
    try {
      await authFetch(`/doctor/appointments/${aptId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      // Rollback
      setAppointments(prevAppointments);
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(''), 4000);
    }
  };

  // ─── Avatar upload success ───
  const handleAvatarSuccess = (newUrl) => {
    setAvatarUrl(newUrl);
    setShowAvatarModal(false);
    setUser(prev => {
      const updated = { ...prev, avatar_url: newUrl };
      localStorage.setItem('cs_user', JSON.stringify(updated));
      return updated;
    });
    setSuccessMsg('Profile photo updated!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── Derived data ───
  const { todayApts, upcomingApts, pendingReportsCount } = useMemo(() => {
    const todayStr = toDateStr(new Date());
    const today = appointments.filter(a => a.date === todayStr).sort(sortByTime);
    const upcoming = appointments.filter(a => isWithin7Days(a.date) && a.date !== todayStr).sort((a, b) => (a.date || '').localeCompare(b.date || '') || sortByTime(a, b));
    // Reports that have no appointment yet — count appointments with status Approved but no report
    const aptIdsWithReports = new Set(reports.map(r => r.appointment_id));
    const pending = appointments.filter(a => a.status === 'Approved' && !aptIdsWithReports.has(a.id)).length;
    return { todayApts: today, upcomingApts: upcoming, pendingReportsCount: pending };
  }, [appointments, reports]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            {notifications.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-amber-500 animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setShowAvatarModal(true)}
                className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-emerald-200 hover:border-emerald-400 transition-colors group cursor-pointer"
                title="Update profile photo"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Dr. avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-emerald-50 items-center justify-center ${avatarUrl ? 'hidden' : 'flex'}`}
                >
                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="absolute inset-0 bg-black/30 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
              <span className="text-sm font-medium text-gray-700">Dr. {displayName}</span>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── Title ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              {greeting}, <span className="text-emerald-600">Dr. {displayName}</span>
            </h1>
            <p className="text-gray-500 text-sm">Here's your schedule overview for today and this week.</p>
          </div>
          <button onClick={fetchData} className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* ─── Messages ─── */}
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium flex items-center gap-2 animate-fade-in-up">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{successMsg}
            <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ─── Upcoming Appointment Notifications ─── */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(apt => (
              <div key={`notif-${apt.id}`} className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium flex items-center gap-3 animate-fade-in-up">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold">{apt.name}</span> — {SERVICE_LABELS[apt.service] || apt.service} at <span className="font-bold text-amber-900">{apt.time}</span>
                  <span className="text-amber-600 ml-1 text-xs">(starting soon)</span>
                </div>
                <button onClick={() => dismissNotif(apt.id)} className="text-amber-400 hover:text-amber-600 shrink-0 text-lg">✕</button>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading your schedule...</p>
          </div>
        ) : (
          <>
            {/* ═══ Summary Cards ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard icon={Activity}      label="Today's Patients"     value={todayApts.length}        accent="bg-red-50 text-red-600"     delay={0} />
              <StatCard icon={Calendar}      label="Upcoming (7 Days)"    value={upcomingApts.length}      accent="bg-blue-50 text-blue-600"   delay={100} />
              <StatCard icon={ClipboardList} label="Pending Reports"      value={pendingReportsCount}      accent="bg-amber-50 text-amber-600" delay={200} />
            </div>

            {/* ═══ Today's Appointments ═══ */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 bg-red-500 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900">Today's Appointments</h2>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{todayApts.length}</span>
              </div>
              {todayApts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No appointments for today</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {todayApts.map((apt, i) => (
                    <AppointmentCard
                      key={apt.id} apt={apt} highlight={i === 0}
                      reports={reports} onUpload={handleOpenUpload}
                      onEdit={handleOpenEdit} onDelete={handleDeleteReport}
                      deletingId={deletingReportId}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ═══ Upcoming 7 Days ═══ */}
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-6 bg-blue-500 rounded-full" />
                <h2 className="text-lg font-bold text-gray-900">Upcoming Patients</h2>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">{upcomingApts.length}</span>
                <span className="text-xs text-gray-400 ml-1">Next 7 days</span>
              </div>
              {upcomingApts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                  <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400 font-medium">No upcoming appointments this week</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {upcomingApts.map((apt, i) => (
                    <AppointmentCard
                      key={apt.id} apt={apt} highlight={i === 0}
                      reports={reports} onUpload={handleOpenUpload}
                      onEdit={handleOpenEdit} onDelete={handleDeleteReport}
                      deletingId={deletingReportId}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* ═══ All Appointments Table (collapsible) ═══ */}
            <section>
              <button
                onClick={() => setShowAllTable(v => !v)}
                className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform ${showAllTable ? 'rotate-90' : ''}`} />
                All Appointments ({appointments.length})
              </button>

              {showAllTable && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Service</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Date & Time</th>
                          <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {appointments.map((apt) => {
                          const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
                          const StatusIcon = statusCfg.icon;
                          const badge = dateBadge(apt.date);
                          const aptReports = reports.filter(r => r.appointment_id === apt.id);
                          return (
                            <tr key={apt.id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{apt.name}</p>
                                    {apt.email && <p className="text-[11px] text-gray-400 truncate">{apt.email}</p>}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 hidden md:table-cell">
                                <span className="text-sm text-gray-600 font-medium">{SERVICE_LABELS[apt.service] || apt.service}</span>
                              </td>
                              <td className="px-6 py-4 hidden lg:table-cell">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.text}</span>
                                  <span className="text-sm text-gray-600">{new Date(apt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  {apt.time && <span className="text-xs text-gray-400">{apt.time}</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={apt.status}
                                  onChange={(e) => handleStatusChange(apt.id, e.target.value)}
                                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-colors ${
                                    apt.status === 'Approved' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' :
                                    apt.status === 'Rejected' ? 'border-red-300 bg-red-50 text-red-700' :
                                    'border-amber-300 bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  <option value="Pending">⏳ Pending</option>
                                  <option value="Approved">✅ Approved</option>
                                  <option value="Rejected">❌ Rejected</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end gap-1.5">
                                  <button onClick={() => handleOpenUpload(apt)} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-emerald-200 transition-colors">
                                    <Upload className="w-3 h-3" /> Upload
                                  </button>
                                  {aptReports.map(r => (
                                    <div key={r.id} className="flex items-center gap-1 text-[11px] text-gray-500">
                                      <FileText className="w-3 h-3 text-emerald-400" />
                                      <span className="truncate max-w-[90px]">{r.title || 'Report'}</span>
                                      <button onClick={() => handleOpenEdit(apt, r)} className="text-gray-400 hover:text-blue-500"><Edit3 className="w-3 h-3" /></button>
                                      <button onClick={() => handleDeleteReport(r.id)} disabled={deletingReportId === r.id} className="text-gray-400 hover:text-red-500 disabled:opacity-50">
                                        {deletingReportId === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Upload/Edit Modal */}
      <ReportUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        appointment={activeAppointment}
        existingReport={activeReport}
        onSuccess={(msg) => { setSuccessMsg(msg); fetchData(); }}
      />

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        required={!avatarUrl}
        currentAvatar={avatarUrl}
        onSuccess={handleAvatarSuccess}
      />
    </div>
  );
}
