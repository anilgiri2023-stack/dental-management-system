import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, ArrowLeft, Loader2, Stethoscope, EyeOff, Eye } from 'lucide-react';
import Logo from '../components/Logo';
import { apiFetch } from '../utils/api';

export default function DoctorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  const { doctorLogin, isAuthenticated, user, isAuthFlow } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isAuthFlow) {
      if (user?.role === 'doctor') navigate('/doctor');
      else if (user?.role === 'admin') navigate('/admin/dashboard');
      else navigate('/patient');
    }
  }, [isAuthenticated, user, navigate, isAuthFlow]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await doctorLogin(email, password);
      navigate('/doctor');
    } catch (err) {
      setError(err.message || 'Invalid doctor credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    if (cooldown > 0) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!data.success) {
        console.error('EMAIL FAILED');
        const msg = data.message || 'Failed to send reset link';
        if (msg.toLowerCase().includes('rate limit')) {
          setError('Too many requests. Please wait a while before trying again.');
        } else {
          setError(msg);
        }
      } else {
        console.log('EMAIL SENT SUCCESS');
        setSuccessMsg(data.message || 'Check your inbox or spam folder');
        
        // Start 60s countdown
        setCooldown(60);
        const interval = setInterval(() => {
          setCooldown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      console.error('EMAIL FAILED', err);
      const msg = err.message || 'Failed to send reset link.';
      if (msg.toLowerCase().includes('rate limit')) {
        setError('Too many requests. Please wait a while before trying again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side — Form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md animate-fade-in-left">
            {/* Logo */}
            <div className="mb-10">
              <Logo />
            </div>

            <div className="mb-8">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                <Stethoscope className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Portal</h1>
              <p className="text-gray-500 text-sm">Sign in to manage your appointments and schedule.</p>
            </div>

            {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">{error}</div>}
            {successMsg && <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-medium animate-fade-in-up">{successMsg}</div>}

            <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com" required autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300" />
              </div>
              
              {!forgotPasswordMode && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => { setForgotPasswordMode(true); setError(''); setSuccessMsg(''); }} className="text-xs font-medium text-emerald-600 hover:text-emerald-700">Forgot Password?</button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              
              <button type="submit" disabled={loading || cooldown > 0}
                className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-600/25 disabled:opacity-60 disabled:cursor-not-allowed group mt-2">
                {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> {forgotPasswordMode ? 'Sending...' : 'Authenticating...'}</>)
                  : cooldown > 0 ? `Wait ${cooldown}s`
                  : forgotPasswordMode ? 'Send Reset Link' : (<><ShieldCheck className="w-4 h-4" /> Access Portal</>)}
              </button>
            </form>

            {forgotPasswordMode && (
              <p className="text-center mt-6 text-sm text-gray-500">
                Remembered your password? <button onClick={() => { setForgotPasswordMode(false); setError(''); setSuccessMsg(''); }} className="text-emerald-600 font-medium hover:underline">Log in</button>
              </p>
            )}

            <p className="text-center mt-8 text-sm text-gray-400">
              <Link to="/" className="hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="w-4 h-4" /> Back to website
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side — Image + Content */}
        <div className="hidden lg:flex relative overflow-hidden">
          <div className="absolute inset-0">
            {/* Medical/doctor image instead of the general clinic image */}
            <img src="https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=2070&auto=format&fit=crop" alt="Doctor" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-800/40 to-transparent" />
          </div>
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 w-fit">
              <ShieldCheck className="w-4 h-4" /> Secure Staff Portal
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">Dedicated.<br />Professional. Care.</h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm mb-6">Access your patient assignments, manage schedules, and review treatments efficiently.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
