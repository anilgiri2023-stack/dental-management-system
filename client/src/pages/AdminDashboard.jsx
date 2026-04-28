import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  Sparkles,
  LogOut,
  Trash2,
  ChevronDown,
  Filter,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Stethoscope,
  Users,
  FileText,
  Loader2,
  Search,
  X,
  Shield,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

const STATUS_CONFIG = {
  Pending: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
    icon: AlertCircle,
  },
  Approved: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
    icon: CheckCircle2,
  },
  Rejected: {
    color: 'bg-red-50 text-red-700 border-red-200',
    dot: 'bg-red-400',
    icon: XCircle,
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('patient'); // 'patient' or 'doctor'
  const [updatingId, setUpdatingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  // User delete state
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(null);

  // Invite State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState('doctor'); // 'doctor' or 'admin'
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const { adminLogout, authFetch } = useAuth();
  const navigate = useNavigate();

  // Fetch appointments
  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/appointments');
      setAppointments(data.appointments || []);
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError(err.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await authFetch('/admin/analytics');
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(err.message || 'Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  // Filter appointments by status, search query, and date
  const filteredAppointments = appointments.filter((a) => {
    // Status filter
    if (filterStatus !== 'All' && a.status !== filterStatus) return false;

    // Search filter (name or email)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = a.name?.toLowerCase().includes(q);
      const emailMatch = a.email?.toLowerCase().includes(q);
      if (!nameMatch && !emailMatch) return false;
    }

    // Date filter
    if (filterDate) {
      const aptDate = new Date(a.date).toISOString().split('T')[0];
      if (aptDate !== filterDate) return false;
    }

    return true;
  });

  const hasActiveFilters = searchQuery.trim() || filterDate || filterStatus !== 'All';

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterDate('');
    setFilterStatus('All');
  };

  // Invite Function (Implements the doctor/admin invite system)
  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError('');
    setSuccessMsg('');
    try {
      const data = await authFetch(`/admin/invite-${inviteRole}`, {
        method: 'POST',
        body: JSON.stringify({ name: inviteName, email: inviteEmail }),
      });

      setSuccessMsg(data.message || `${inviteRole === 'admin' ? 'Admin' : 'Doctor'} invited successfully`);
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      if (activeTab === 'users') fetchUsers();
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(`Invite ${inviteRole} error:`, err);
      setError(err.message || `Failed to invite ${inviteRole}`);
    } finally {
      setInviting(false);
    }
  };

  // Update appointment status (triggers email notification on server)
  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    setError('');
    setSuccessMsg('');
    try {
      await authFetch(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );
      setSuccessMsg(`Appointment ${newStatus.toLowerCase()}. Email notification sent to patient.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Update status error:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete appointment
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await authFetch(`/appointments/${id}`, { method: 'DELETE' });
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Delete appointment error:', err);
      setError(err.message || 'Failed to delete appointment');
    } finally {
      setDeletingId(null);
    }
  };

  // Delete user (from users table + Supabase Auth)
  const handleDeleteUser = async (userId) => {
    try {
      setDeletingUserId(userId);
      setError('');
      setSuccessMsg('');
      
      const data = await authFetch(`/admin/delete-user/${userId}`, { 
        method: 'DELETE' 
      });

      if (data.success) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setShowDeleteUserConfirm(null);
        setSuccessMsg('User deleted successfully');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setError(data.message || 'Failed to delete user');
        setShowDeleteUserConfirm(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete user');
      setShowDeleteUserConfirm(null);
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  const stats = {
    total: appointments.length,
    pending: appointments.filter((a) => a.status === 'Pending').length,
    approved: appointments.filter((a) => a.status === 'Approved').length,
    rejected: appointments.filter((a) => a.status === 'Rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Clinical Serenity Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <div className="w-8 h-8 bg-primary-50 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="font-medium text-gray-700">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              id="admin-logout"
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'appointments'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            Appointments
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>

        {activeTab === 'appointments' ? (
          /* ═══ APPOINTMENTS TAB ═══ */
          <>
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
                  <p className="text-xs text-gray-500 mt-1">{stat.label} Appointments</p>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                All Appointments
                <span className="text-sm font-normal text-gray-400">({filteredAppointments.length})</span>
              </h2>
              <button
                onClick={fetchAppointments}
                id="refresh-appointments"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="search-appointments"
                    type="text"
                    placeholder="Search by name or email"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Date Picker */}
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    id="date-filter"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all cursor-pointer min-w-[180px]"
                  />
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="status-filter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white cursor-pointer transition-all min-w-[150px]"
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    id="clear-filters"
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark bg-primary-50 hover:bg-primary-100 px-4 py-2.5 rounded-xl transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium animate-fade-in-up flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
                <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
              </div>
            )}

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
                <p className="text-gray-500 text-sm">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              /* Empty state */
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Appointments Found</h3>
                <p className="text-sm text-gray-500">
                  {hasActiveFilters
                    ? 'No appointments match your current filters.'
                    : 'No appointments have been booked yet.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-sm font-medium text-primary hover:text-primary-dark underline underline-offset-2 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              /* Appointments Table */
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Doctor
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Service
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                          Date & Time
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAppointments.map((apt) => {
                        const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.Pending;
                        const StatusIcon = statusCfg.icon;
                        return (
                          <tr
                            key={apt.id}
                            className="hover:bg-gray-50/50 transition-colors group"
                          >
                            {/* Patient info */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">
                                    {apt.name}
                                  </p>
                                  <div className="flex flex-col gap-0.5 mt-0.5">
                                    {apt.email && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        {apt.email}
                                      </span>
                                    )}
                                    {apt.phone && (
                                      <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        {apt.phone}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Doctor */}
                            <td className="px-6 py-4 hidden sm:table-cell">
                              <span className="text-sm font-medium text-gray-700">
                                {apt.doctorId?.name ? `Dr. ${apt.doctorId.name}` : 'N/A'}
                              </span>
                            </td>

                            {/* Service */}
                            <td className="px-6 py-4 hidden md:table-cell">
                              <span className="text-sm text-gray-600">
                                {SERVICE_LABELS[apt.service] || apt.service}
                              </span>

                            </td>

                            {/* Date & Time */}
                            <td className="px-6 py-4 hidden lg:table-cell">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {new Date(apt.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </div>
                              {apt.time && (
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {apt.time}
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <div className="relative inline-block">
                                <select
                                  value={apt.status}
                                  onChange={(e) =>
                                    handleStatusChange(apt.id, e.target.value)
                                  }
                                  disabled={updatingId === apt.id}
                                  className={`appearance-none pl-7 pr-8 py-1.5 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${statusCfg.color} ${
                                    updatingId === apt.id ? 'opacity-50' : ''
                                  }`}
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Approved">Approved</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                                {updatingId === apt.id ? (
                                  <Loader2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none animate-spin" />
                                ) : (
                                  <StatusIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                )}
                                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              {showDeleteConfirm === apt.id ? (
                                <div className="inline-flex items-center gap-2">
                                  <button
                                    onClick={() => handleDelete(apt.id)}
                                    disabled={deletingId === apt.id}
                                    className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    {deletingId === apt.id ? 'Deleting...' : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setShowDeleteConfirm(apt.id)}
                                  className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                  title="Delete appointment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Upcoming Appointments List with Doctor */}
            {(() => {
              const parseDateTime = (dateStr, timeStr) => {
                if (!dateStr || !timeStr) return new Date();
                const [year, month, day] = dateStr.split("-");
                let [timePart, ampm] = timeStr.split(" ");
                if (!timePart) return new Date(year, month - 1, day);
                
                let [hour, minute] = timePart.split(":");
                hour = parseInt(hour);
                if (ampm === "PM" && hour !== 12) hour += 12;
                if (ampm === "AM" && hour === 12) hour = 0;

                return new Date(year, month - 1, day, hour, minute);
              };

              const now = new Date();
              const upcomingList = appointments
                .filter(a => {
                  if (!a.time) return false;
                  const dt = parseDateTime(a.date, a.time);
                  return dt > now;
                })
                .sort((a, b) => parseDateTime(a.date, a.time) - parseDateTime(b.date, b.time));

              if (upcomingList.length === 0) return null;

              return (
                <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-gray-900">Upcoming Appointments with Doctor</h3>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {upcomingList.map((apt) => (
                      <div key={`upcoming-${apt.id}`} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 transition-colors">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold text-gray-900">{apt.name}</span>
                          <span className="mx-2 text-gray-300">→</span>
                          <span className="font-medium text-emerald-600">{apt.doctorId?.name ? `Dr. ${apt.doctorId.name}` : 'N/A'}</span>
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1.5 shrink-0">
                          {new Date(`${apt.date} ${apt.time || '00:00'}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {apt.time && <> &bull; {new Date(`${apt.date} ${apt.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        ) : activeTab === 'users' ? (
          /* ═══ USERS TAB ═══ */
          <>
            <div className="flex items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                All Users
                <span className="text-sm font-normal text-gray-400">({users.length})</span>
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => { setInviteRole('admin'); setShowInviteModal(true); }}
                  className="inline-flex items-center gap-2 bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-slate-900 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Invite Admin
                </button>
                <button
                  onClick={() => { setInviteRole('doctor'); setShowInviteModal(true); }}
                  className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary-dark transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Invite Doctor
                </button>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setUserRoleFilter('patient')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      userRoleFilter === 'patient'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Patients
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('doctor')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      userRoleFilter === 'doctor'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Doctors
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      userRoleFilter === 'admin'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Admins
                  </button>
                </div>
                <button
                  onClick={fetchUsers}
                  className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Success Message */}
            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium animate-fade-in-up flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {successMsg}
                <button onClick={() => setSuccessMsg('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
                {error}
                <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Users</h3>
                <p className="text-sm text-gray-500">No users have signed up yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Email
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Role
                        </th>
                        <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users
                        .filter(u => {
                          if (userRoleFilter === 'admin') return u.role === 'admin';
                          if (userRoleFilter === 'doctor') return u.role === 'doctor';
                          return u.role === 'user' || u.role === 'patient';
                        })
                        .map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                                  {u.role === 'admin' ? <Shield className="w-4 h-4 text-primary" /> : 
                                   u.role === 'doctor' ? <Stethoscope className="w-4 h-4 text-primary" /> : 
                                   <User className="w-4 h-4 text-primary" />}
                                </div>
                              <span className="text-sm font-semibold text-gray-900">
                                {u.name || u.email?.split('@')[0] || 'User'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              {u.email || '—'}
                            </span>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              u.role === 'admin'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : u.role === 'doctor'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {u.role === 'user' ? 'patient' : u.role || 'patient'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-400 font-mono">
                              {u.id?.slice(0, 6)}...
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {showDeleteUserConfirm === u.id ? (
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={deletingUserId === u.id}
                                  className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                >
                                  {deletingUserId === u.id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteUserConfirm(null)}
                                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteUserConfirm(u.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : activeTab === 'analytics' ? (
          /* ═══ ANALYTICS TAB ═══ */
          <>
            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-gray-500 text-sm">Loading analytics...</p>
              </div>
            ) : analytics ? (
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Patients', value: analytics.totalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Total Doctors', value: analytics.totalDoctors, icon: Stethoscope, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Total Appointments', value: analytics.totalAppointments, icon: Calendar, color: 'text-primary', bg: 'bg-primary-50' },
                    { label: 'Approved', value: analytics.statusBreakdown?.Approved || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* Monthly Bookings Chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Monthly Bookings
                  </h3>
                  <div className="flex items-end gap-2 h-48">
                    {Object.entries(analytics.monthlyBookings || {}).map(([month, count]) => {
                      const maxVal = Math.max(...Object.values(analytics.monthlyBookings || {}), 1);
                      const height = Math.max((count / maxVal) * 100, 4);
                      return (
                        <div key={month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-gray-700">{count}</span>
                          <div className="w-full bg-primary/80 rounded-t-lg transition-all hover:bg-primary" style={{ height: `${height}%` }} />
                          <span className="text-[10px] text-gray-400">{month.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Popular Services + Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" /> Popular Services
                    </h3>
                    <div className="space-y-3">
                      {(analytics.popularServices || []).map((s, i) => {
                        const maxC = analytics.popularServices[0]?.count || 1;
                        return (
                          <div key={s.service} className="flex items-center gap-3">
                            <span className="text-xs font-mono text-gray-400 w-4">{i + 1}</span>
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 capitalize">{s.service}</span>
                                <span className="text-sm font-bold text-gray-900">{s.count}</span>
                              </div>
                              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(s.count / maxC) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {(analytics.popularServices || []).length === 0 && (
                        <p className="text-sm text-gray-400">No data yet</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" /> Status Breakdown
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(analytics.statusBreakdown || {}).map(([status, count]) => {
                        const colors = { Pending: 'bg-amber-400', Approved: 'bg-emerald-400', Rejected: 'bg-red-400' };
                        const total = analytics.totalAppointments || 1;
                        return (
                          <div key={status}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{status}</span>
                              <span className="text-sm font-bold text-gray-900">{count} ({Math.round((count / total) * 100)}%)</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[status] || 'bg-gray-400'} rounded-full`} style={{ width: `${(count / total) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-500">No analytics data available</p>
              </div>
            )}
          </>
        ) : null}


        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Invite {inviteRole === 'admin' ? 'Admin' : 'Doctor'}
                </h3>
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {inviteRole === 'admin' ? 'Admin\'s Name' : 'Doctor\'s Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder={inviteRole === 'admin' ? 'e.g. John Doe' : 'e.g. Dr. Sarah Jenkins'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="sarah@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none transition-all"
                  />
                </div>
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className={`flex-1 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center justify-center gap-2 ${
                      inviting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Inviting...
                      </>
                    ) : (
                      'Send Invite'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
