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
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg py-3'
          : 'bg-white py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo />

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'text-primary bg-primary-50'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary px-4 py-2.5 rounded-full hover:bg-primary-50 transition-all duration-300"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 px-3 py-2">
                  <div className="w-7 h-7 bg-primary-50 rounded-full flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-gray-700">{displayName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  id="navbar-logout"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-red-500 px-4 py-2.5 rounded-full hover:bg-red-50 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
                  className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <LogIn className="w-4 h-4" />
                  Login / Sign Up
                </button>
                
                {/* Dropdown Menu */}
                {isLoginDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up">
                    <Link
                      to="/login/patient"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors border-b border-gray-50"
                    >
                      Patient Login
                    </Link>
                    <Link
                      to="/login/doctor"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors border-b border-gray-50"
                    >
                      Doctor Login
                    </Link>
                    <Link
                      to="/login/admin"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary transition-colors"
                    >
                      Admin Login
                    </Link>
                  </div>
                )}
              </div>
            )}
            <Link
              to={isAuthenticated ? "/dashboard/book" : "/login"}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5"
            >
              Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isOpen ? 'max-h-[600px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="bg-gray-50 rounded-2xl p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === link.path
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-white hover:text-primary'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Mobile auth links */}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-primary transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </span>
                </Link>
                <div className="px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  {displayName}
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-white transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Logout
                  </span>
                </button>
              </>
            ) : (
              <div className="space-y-1 mt-2 border-t border-gray-200 pt-2">
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Login Portals</p>
                <Link
                  to="/login/patient"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-primary transition-all"
                >
                  Patient Login
                </Link>
                <Link
                  to="/login/doctor"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-primary transition-all"
                >
                  Doctor Login
                </Link>
                <Link
                  to="/login/admin"
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-white hover:text-primary transition-all"
                >
                  Admin Login
                </Link>
              </div>
            )}

            <Link
              to={isAuthenticated ? "/dashboard/book" : "/login"}
              className="block text-center bg-primary text-white px-6 py-3 rounded-xl text-sm font-semibold mt-3 hover:bg-primary-dark transition-colors"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
