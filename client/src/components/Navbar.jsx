import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LogIn, User, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from "../components/Logo";

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Doctors', path: '/doctors' },
  { name: 'Gallery', path: '/gallery' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    setIsOpen(false);
    setIsLoginDropdownOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const displayName = user?.name || user?.email?.split('@')[0] || user?.phone || 'User';

  return (
    <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* LEFT: LOGO */}
        <Logo />

        {/* CENTER: NAV LINKS */}
        <div className="hidden md:flex items-center gap-8 text-gray-600 font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`hover:text-teal-500 transition-colors ${
                location.pathname === link.path ? 'text-teal-500 font-semibold' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* RIGHT: ACTION BUTTONS */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link
                to={
                  user?.role === 'admin'
                    ? '/admin-dashboard'
                    : user?.role === 'doctor'
                    ? '/doctor-dashboard'
                    : '/appointments'
                }
                className="text-gray-600 hover:text-teal-500 font-medium transition"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-2 text-gray-700 font-medium px-2">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center border border-teal-100 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-teal-600" />
                  )}
                </div>
                <span className="text-sm hidden lg:inline">{displayName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="relative group">
              <button
                onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium text-sm flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Login / Sign Up
              </button>
              
              {isLoginDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up z-50">
                  <Link to="/login/patient" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors border-b border-gray-50">Patient Login</Link>
                  <Link to="/login/doctor" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors border-b border-gray-50">Doctor Login</Link>
                  <Link to="/login/admin" className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-teal-50 hover:text-teal-600 transition-colors">Admin Login</Link>
                </div>
              )}
            </div>
          )}

          <Link
            to={isAuthenticated ? (user?.role === 'doctor' || user?.role === 'admin' ? (user?.role === 'admin' ? '/admin-dashboard' : '/doctor-dashboard') : "/appointments") : "/login"}
            className="px-5 py-2 rounded-full bg-teal-500 text-white font-medium hover:bg-teal-600 transition shadow text-sm"
          >
            {isAuthenticated && (user?.role === 'doctor' || user?.role === 'admin') ? "Go to Dashboard" : "Book Appointment"}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t p-4 space-y-4 animate-fade-in shadow-xl">
          <div className="flex flex-col gap-4 text-gray-600 font-medium">
            {navLinks.map((link) => (
              <Link key={link.name} to={link.path} className="hover:text-teal-500 transition">{link.name}</Link>
            ))}
          </div>
          <div className="pt-4 border-t flex flex-col gap-3">
            {!isAuthenticated ? (
              <>
                <Link to="/login/patient" className="px-5 py-2 text-center rounded-full border border-gray-300 text-gray-700">Patient Login</Link>
                <Link to="/login/doctor" className="px-5 py-2 text-center rounded-full border border-gray-300 text-gray-700">Doctor Login</Link>
              </>
            ) : (
              <button onClick={handleLogout} className="px-5 py-2 text-center rounded-full border border-red-200 text-red-500">Logout</button>
            )}
            <Link
              to="/appointments"
              className="px-5 py-2 rounded-full bg-teal-500 text-white text-center font-medium shadow"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
