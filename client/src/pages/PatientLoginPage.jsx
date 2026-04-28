import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../utils/api';
import {
  Sparkles, ArrowRight, CheckCircle2, Mail, Phone,
  ShieldCheck, ArrowLeft, RefreshCw, Loader2, UserPlus, LogIn,
} from 'lucide-react';
import Logo from '../components/Logo';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function PatientLoginPage() {
  // Steps: 'email' → 'details' (new users only) → 'otp'
  const [step, setStep] = useState('email');
  const [isNewUser, setIsNewUser] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [loginCooldown, setLoginCooldown] = useState(0);

  const otpRefs = useRef([]);
  const { sendOtp, verifyOtp, isAuthenticated, isAdminLoggedIn, user, isAuthFlow } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isAuthFlow) {
      if (isAdminLoggedIn) navigate('/admin/dashboard');
      else if (user?.role === 'doctor') navigate('/doctor');
      else navigate('/patient');
    }
  }, [isAuthenticated, isAdminLoggedIn, user, navigate, isAuthFlow]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (loginCooldown > 0) {
      const timer = setTimeout(() => setLoginCooldown(loginCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [loginCooldown]);

  // Step 1: Check if email exists, then route accordingly
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (loginCooldown > 0) {
      setError(`Please wait ${loginCooldown}s before trying again.`);
      return;
    }
    setError('');
    setSuccess('');
    if (!identifier.trim()) { setError('Please enter your email'); return; }

    setCheckingUser(true);
    try {
      const result = await apiFetch('/auth/check-user', {
        method: 'POST',
        body: JSON.stringify({ email: identifier.trim() }),
      });

      if (result.exists) {
        // Existing user → send OTP directly, skip name/phone
        setIsNewUser(false);
        setLoading(true);
        try {
          await sendOtp(identifier.trim(), 'email');
          setStep('otp');
          setOtp(Array(OTP_LENGTH).fill(''));
          setResendTimer(RESEND_COOLDOWN);
          setLoginCooldown(RESEND_COOLDOWN);
          setSuccess(result.message || `Welcome back! Code sent to ${identifier}`);
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (otpErr) {
          const isRateLimit = 
            otpErr.status === 429 || 
            otpErr.message.toLowerCase().includes('rate limit') || 
            otpErr.message.toLowerCase().includes('too many');

          if (isRateLimit) {
            setError(otpErr.message || 'Too many attempts. Please wait 60 seconds.');
            setLoginCooldown(RESEND_COOLDOWN);
          } else {
            setError(otpErr.message);
          }
        }
      } else {
        // New user → show name + phone fields
        setIsNewUser(true);
        setStep('details');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setCheckingUser(false);
      setLoading(false);
    }
  };

  // Step 2 (new users): Collect name + phone, then send OTP
  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    if (loginCooldown > 0) {
      setError(`Please wait ${loginCooldown}s before trying again.`);
      return;
    }
    setError('');
    setSuccess('');
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) { setError('Please enter a valid 10-digit mobile number'); return; }

    setLoading(true);
    try {
      await sendOtp(identifier.trim(), 'email');
      setStep('otp');
      setOtp(Array(OTP_LENGTH).fill(''));
      setResendTimer(RESEND_COOLDOWN);
      setLoginCooldown(RESEND_COOLDOWN);
      setSuccess(result.message || `Verification code sent to ${identifier}`);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      const isRateLimit = 
        err.status === 429 || 
        err.message.toLowerCase().includes('rate limit') || 
        err.message.toLowerCase().includes('too many');

      if (isRateLimit) {
        setError(err.message || 'Too many attempts. Please wait 60 seconds.');
        setLoginCooldown(RESEND_COOLDOWN);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const otpString = otp.join('');
    if (otpString.length !== OTP_LENGTH) { setError('Please enter the full verification code'); setLoading(false); return; }

    try {
      const result = await verifyOtp(
        identifier.trim(), 'email', otpString,
        isNewUser ? name.trim() : undefined,
        isNewUser ? phone.trim() : undefined
      );
      setSuccess('Verification successful! Redirecting...');
      const dest = result.user?.role === 'admin' ? '/admin/dashboard' : result.user?.role === 'doctor' ? '/doctor' : '/patient';
      setTimeout(() => navigate(dest), 800);
    } catch (err) {
      setError(err.message);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
    if (newOtp.every(d => d !== '') && newOtp.join('').length === OTP_LENGTH) {
      setTimeout(() => {
        const otpStr = newOtp.join('');
        setLoading(true);
        setError('');
        verifyOtp(identifier.trim(), 'email', otpStr, isNewUser ? name.trim() : undefined, isNewUser ? phone.trim() : undefined)
          .then((result) => {
            setSuccess('Verification successful! Redirecting...');
            const dest = result.user?.role === 'admin' ? '/admin/dashboard' : result.user?.role === 'doctor' ? '/doctor' : '/patient';
            setTimeout(() => navigate(dest), 800);
          })
          .catch(err => { setError(err.message); setOtp(Array(OTP_LENGTH).fill('')); setTimeout(() => otpRefs.current[0]?.focus(), 100); })
          .finally(() => setLoading(false));
      }, 150);
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (pasted.length === OTP_LENGTH) {
      setOtp(pasted.split(''));
      otpRefs.current[OTP_LENGTH - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      await sendOtp(identifier.trim(), 'email');
      setResendTimer(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      setSuccess('New verification code sent!');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) { 
      const isRateLimit = 
        err.status === 429 || 
        err.message.toLowerCase().includes('rate limit') || 
        err.message.toLowerCase().includes('too many');

      if (isRateLimit) {
        setError(err.message || 'Too many attempts. Please wait 60 seconds.');
        setLoginCooldown(RESEND_COOLDOWN);
      } else {
        setError(err.message); 
      }
    }
    finally { setLoading(false); }
  };

  const goBack = () => {
    if (step === 'otp' && isNewUser) { setStep('details'); }
    else if (step === 'otp') { setStep('email'); }
    else if (step === 'details') { setStep('email'); }
    setOtp(Array(OTP_LENGTH).fill(''));
    setError(''); setSuccess('');
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

            {step === 'email' && (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Login</h1>
                  <p className="text-gray-500 text-sm">Sign in or create account — no password needed</p>
                  <p className="text-primary/80 text-xs mt-2 font-medium">Already registered? Just enter your email to login</p>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">{error}</div>}

                <form onSubmit={handleEmailSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                    <input type="email" id="auth-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@example.com" required autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300" />
                  </div>
                  <button type="submit" id="check-email-btn" disabled={checkingUser || loginCooldown > 0}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group">
                    {checkingUser ? (<><Loader2 className="w-5 h-5 animate-spin" /> Checking...</>)
                      : loginCooldown > 0 ? (<>Wait {loginCooldown}s</>)
                      : (<>Continue <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>)}
                  </button>
                </form>
              </>
            )}

            {step === 'details' && (
              <>
                <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <UserPlus className="w-7 h-7 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
                  <p className="text-gray-500 text-sm">Welcome! We need a few details to set up your account.</p>
                  <div className="mt-3 inline-flex items-center gap-2 bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium">
                    <Mail className="w-3 h-3" /> {identifier}
                  </div>
                </div>

                {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">{error}</div>}

                <form onSubmit={handleDetailsSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Your Full Name</label>
                    <input type="text" id="auth-name" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe" required autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                      <Phone className="w-3 h-3" /> Mobile Number
                    </label>
                    <input type="tel" id="auth-phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number" pattern="[0-9]{10}" maxLength="10" required
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all placeholder:text-gray-300" />
                  </div>
                  <button type="submit" id="send-otp-btn" disabled={loading || loginCooldown > 0}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group">
                    {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Sending code...</>)
                      : loginCooldown > 0 ? (<>Wait {loginCooldown}s</>)
                      : (<>Send Verification Code <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /></>)}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-6 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <div className="mb-8">
                  <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Enter Code</h1>
                  <p className="text-gray-500 text-sm">
                    We sent a 6-digit code to <span className="font-semibold text-gray-700">{identifier}</span>
                  </p>
                  {!isNewUser && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
                      <LogIn className="w-3 h-3" /> Welcome back!
                    </div>
                  )}
                </div>

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-600 text-sm font-medium animate-fade-in-up flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
                  </div>
                )}
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium animate-fade-in-up">{error}</div>}

                <form onSubmit={handleVerifyOtp}>
                  <div className="flex justify-center gap-3 mb-6">
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => otpRefs.current[i] = el}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`otp-input w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          digit ? 'border-primary bg-primary-50 text-primary' : 'border-gray-200 bg-gray-50/50 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20'
                        }`}
                        autoFocus={i === 0} />
                    ))}
                  </div>
                  <button type="submit" id="verify-otp-btn" disabled={loading || otp.some(d => d === '')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed group">
                    {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>)
                      : (<><ShieldCheck className="w-4 h-4" /> Verify & Sign In</>)}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-400">Resend code in <span className="font-semibold text-gray-600">{resendTimer}s</span></p>
                  ) : (
                    <button onClick={handleResend} disabled={loading}
                      className="text-sm text-primary font-semibold hover:text-primary-dark transition-colors inline-flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                    </button>
                  )}
                </div>
              </>
            )}

            <p className="text-center mt-8 text-sm text-gray-400">
              <Link to="/" className="hover:text-primary transition-colors">← Back to website</Link>
            </p>
          </div>
        </div>

        {/* Right Side — Image + Content */}
        <div className="hidden lg:flex relative overflow-hidden">
          <div className="absolute inset-0">
            <img src="/images/auth-dental.png" alt="Modern dental clinic" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary/40 to-primary-dark/20" />
          </div>
          <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 w-fit">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> OTP Secured Login
            </div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">Passwordless.<br />Secure. Simple.</h2>
            <p className="text-white/80 text-sm leading-relaxed max-w-sm mb-6">No passwords to remember. Just enter your email, verify with a one-time code, and you're in.</p>
            <div className="flex flex-col gap-3">
              {['No passwords required', 'Instant OTP verification', 'Book appointments in seconds'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/90 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary-light shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
