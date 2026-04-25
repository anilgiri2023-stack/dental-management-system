import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { apiFetch } from '../utils/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Admin login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your admin email address first.');
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

      if (data.success) {
        console.log("Reset email sent to:", email);
        setSuccessMsg(data.message || "Check your inbox or spam folder");
        
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
      } else {
        const msg = data.message || 'Failed to send reset link.';
        if (msg.toLowerCase().includes('rate limit')) {
          setError('Too many requests. Please wait a while before trying again.');
        } else {
          setError(msg);
        }
      }
    } catch (err) {
      console.error(err);
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
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Dark-themed background for admin */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Logo lightText={true} />
        </div>

        {/* Card */}
        <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-700/50 p-8 animate-fade-in-up">
          {/* Admin badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary-light px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              Admin Portal
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400 text-sm">Access the clinic management dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-medium animate-fade-in-up">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-medium animate-fade-in-up">
              {successMsg}
            </div>
          )}

          <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Admin Email
                </label>
                <input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-600/50 bg-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-500"
                />
              </div>

              {!forgotPasswordMode && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Password
                    </label>
                    <button type="button" onClick={() => { setForgotPasswordMode(true); setError(''); setSuccessMsg(''); }} className="text-xs font-medium text-primary hover:text-primary-light transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="admin-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-gray-600/50 bg-gray-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-gray-500 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

            <button
              type="submit"
              id="admin-login-submit"
              disabled={loading || cooldown > 0}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {forgotPasswordMode ? 'Sending...' : 'Authenticating...'}
                </>
              ) : cooldown > 0 ? (
                `Wait ${cooldown}s`
              ) : (
                forgotPasswordMode ? 'Send Reset Link' : (
                  <>
                    <Shield className="w-4 h-4" />
                    Access Dashboard
                  </>
                )
              )}
            </button>
          </form>

          {forgotPasswordMode && (
            <p className="text-center mt-6 text-sm text-gray-400">
              Remembered your password? <button onClick={() => { setForgotPasswordMode(false); setError(''); setSuccessMsg(''); }} className="text-primary hover:text-primary-light font-medium transition-colors">Log in</button>
            </p>
          )}
        </div>

        {/* Back to site */}
        <p className="text-center mt-6 text-sm text-gray-500">
          <Link to="/" className="text-gray-400 hover:text-primary-light transition-colors">
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}
