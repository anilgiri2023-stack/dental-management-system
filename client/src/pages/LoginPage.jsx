import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Loader2,
} from 'lucide-react';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function LoginPage() {
  // Auth mode: 'email' or 'phone'
  const [authMode, setAuthMode] = useState('email');
  // Steps: 'identifier' → 'otp'
  const [step, setStep] = useState('identifier');

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);
  const { sendOtp, verifyOtp, isAuthenticated, isAdminLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in — role-based
  useEffect(() => {
    if (isAuthenticated) {
      navigate(isAdminLoggedIn ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, isAdminLoggedIn, navigate]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!identifier.trim()) {
        throw new Error(authMode === 'email' ? 'Please enter your email' : 'Please enter your phone number');
      }

      await sendOtp(identifier.trim(), authMode);
      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN);
      setSuccess(
        authMode === 'email'
          ? `Verification code sent to ${identifier}`
          : `Verification code sent to ${identifier.slice(0, -4)}****`
      );

      // Focus first OTP input after transition
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) {
      setError('Please enter the full verification code');
      setLoading(false);
      return;
    }

    try {
      const result = await verifyOtp(identifier.trim(), authMode, otpString, name.trim() || undefined);
      setSuccess('Verification successful! Redirecting...');
      const dest = result.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      setTimeout(() => navigate(dest), 800);
    } catch (err) {
      setError(err.message);
      // Clear OTP on failure
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last char
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every(d => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      setTimeout(() => {
        const otpString = newOtp.join('');
        setLoading(true);
        setError('');
        verifyOtp(identifier.trim(), authMode, otpString, name.trim() || undefined)
          .then((result) => {
            setSuccess('Verification successful! Redirecting...');
            const dest = result.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
            setTimeout(() => navigate(dest), 800);
          })
          .catch(err => {
            setError(err.message);
            setOtp(Array(OTP_LENGTH).fill(''));
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
          })
          .finally(() => setLoading(false));
      }, 150);
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      const newOtp = pasted.split('');
      setOtp(newOtp);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  // Handle OTP backspace
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await sendOtp(identifier.trim(), authMode);
      setResendTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      setSuccess('New verification code sent!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Go back to identifier step
  const goBack = () => {
    setStep('identifier');
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setSuccess('');
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side — Form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <div className="w-full max-w-md animate-fade-in-left">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 mb-10 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 tracking-tight">
                Clinical <span className="text-primary">Serenity</span>
              </span>
            </Link>

            {step === 'identifier' ? (
              /* ─── STEP 1: Enter Email/Phone ─── */
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h1>
                  <p className="text-gray-500 text-sm">
                    Sign in or create account — no password needed
                  </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('email'); setIdentifier(''); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      authMode === 'email'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('phone'); setIdentifier(''); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      authMode === 'phone'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSendOtp} className="space-y-5">
                  {/* Name (optional, for new users) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Your Name <span className="text-gray-400 normal-case">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="auth-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
                    />
                  </div>

                  {/* Email or Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      {authMode === 'email' ? 'Email Address' : 'Phone Number'}
                    </label>
                    <input
                      type={authMode === 'email' ? 'email' : 'tel'}
                      id="auth-identifier"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={authMode === 'email' ? 'you@example.com' : '+91 98765 43210'}
                      required
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300"
                    />
                    {authMode === 'phone' && (
                      <p className="text-xs text-gray-400 mt-1.5">Include country code (e.g. +91 for India)</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    id="send-otp-btn"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ─── STEP 2: Enter OTP ─── */
              <>
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="mb-8">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Code</h1>
                  <p className="text-gray-500 text-sm">
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-gray-700">
                      {authMode === 'email' ? identifier : `${identifier.slice(0, -4)}****`}
                    </span>
                  </p>
                </div>

                {/* Success */}
                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-medium animate-fade-in-up flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">
                    {error}
                  </div>
                )}

                {/* OTP Inputs */}
                <form onSubmit={handleVerifyOtp}>
                  <div className="flex justify-center gap-3 mb-6">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`otp-input w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          digit
                            ? 'border-primary bg-primary-50 text-primary'
                            : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    id="verify-otp-btn"
                    disabled={loading || otp.some(d => d === '')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify & Sign In
                      </>
                    )}
                  </button>
                </form>

                {/* Resend */}
                <div className="mt-6 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-400">
                      Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Resend Code
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Back to site */}
            <p className="text-center mt-8 text-sm text-gray-400">
              <Link to="/" className="hover:text-primary transition-colors">
                ← Back to website
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side — Image + Content */}
        <div className="hidden lg:flex relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="/images/auth-dental.png"
              alt="Modern dental clinic"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary/40 to-primary-dark/20" />
          </div>

          {/* Overlay Text */}
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 w-fit">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              OTP Secured Login
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              Passwordless.<br />Secure. Simple.
            </h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm mb-6">
              No passwords to remember. Just enter your email or phone, verify with a one-time code, and you're in.
            </p>
            <div className="flex flex-col gap-3">
              {['No passwords required', 'Instant OTP verification', 'Book appointments in seconds'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary-light shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
