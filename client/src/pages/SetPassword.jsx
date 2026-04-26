import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import { apiFetch } from '../utils/api';

export default function SetPassword() {
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        
        console.log("🛠️ SetPassword Debug Info:");
        console.log("   URL:", window.location.href);
        console.log("   Path:", window.location.pathname);
        console.log("   Hash length:", hash.length);
        console.log("   Query length:", search.length);
        console.log("   Hash content detected:", hash ? "YES" : "NO");
        console.log("   Query content detected:", search ? "YES" : "NO");
        
        const hashParams = new URLSearchParams(hash.substring(1));
        const queryParams = new URLSearchParams(search);

        // Extract tokens from either hash or query
        const access_token = hashParams.get("access_token") || queryParams.get("token");
        const refresh_token = hashParams.get("refresh_token");
        const type = hashParams.get("type") || queryParams.get("type");
        const error_code = hashParams.get("error") || queryParams.get("error");
        const error_desc = hashParams.get("error_description") || queryParams.get("error_description");

        console.log("   Extracted token:", access_token ? "PRESENT" : "MISSING");
        console.log("   Extracted type:", type);

        if (hash || search) {
          // 1. Handle error cases first (e.g. access_denied, otp_expired)
          if (error_code || error_desc) {
            console.error("❌ Auth error detected:", error_code, error_desc);
            if (error_code === 'access_denied' || error_desc?.includes('expired') || error_code?.includes('expired')) {
              setError('Invite link expired. Please request a new invite.');
            } else {
              setError(error_desc || 'Authentication failed. Please try again.');
            }
            setInitializing(false);
            return;
          }

          // 2. Validate mandatory tokens
          if (!access_token) {
            console.warn("⚠️ No access_token found in hash or search");
            // If there's no token but we had a hash/search, it might be a malformed link
            setError('No valid invitation token found. Please use the link in your email.');
            setInitializing(false);
            return;
          }

          // 3. Force initialize session in Supabase SDK
          console.log("🔄 Initializing session with Supabase SDK...");
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || access_token // fallback
          });

          if (sessionErr) {
            console.error("❌ setSession error:", sessionErr);
            setError('Invite link expired. Please request a new invite.');
            setInitializing(false);
            return;
          }

          console.log("✅ Session initialized for flow:", type);
          setSessionReady(true);
          
          // 4. Clean URL to keep it tidy
          window.history.replaceState(null, '', window.location.pathname);
          setInitializing(false);
        } else {
          setError('No invitation link detected. Please check your email.');
          setInitializing(false);
        }
      } catch (err) {
        console.error('💥 SetPassword initialization failed:', err);
        setError('Something went wrong. Please try clicking the link in your email again.');
        setInitializing(false);
      }
    };

    handleAuthSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Use Supabase SDK directly as requested
      const { data, error: updateErr } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (updateErr) {
        throw new Error(updateErr.message || 'Failed to set password');
      }

      // Sync with app's auth context
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          localStorage.setItem('cs_token', session.access_token);
          // Fetch user info from our backend to get the correct role
          const userData = await apiFetch('/auth/me');
          if (userData && userData.user) {
            setUser(userData.user);
            localStorage.setItem('cs_user', JSON.stringify(userData.user));
          }
        }
      } catch (syncErr) {
        console.error('Auth sync error:', syncErr);
        // We still proceed to success state as the password was set
      }

      setSuccess(true);
      
      // Redirect to dashboard as requested
      setTimeout(() => {
        navigate('/dashboard');
      }, 2500);
    } catch (err) {
      console.error('Set password error:', err);
      setError(err.message || 'Failed to set password');
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state while processing the invite token ───
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Verifying your invitation...</p>
      </div>
    );
  }

  // ─── Success state ───
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
          <div className="text-teal-600 mb-4 flex justify-center">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Set Successfully!</h2>
          <p className="text-slate-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Main form ───
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Set Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Welcome! Please set a password for your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {sessionReady ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="mt-1 relative">
                  <input
                    id="set-password-new"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1 relative">
                  <input
                    id="set-password-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  id="set-password-submit"
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Setting Password...' : 'Set Password'}
                </button>
              </div>
            </form>
          ) : (
            !error && (
              <p className="text-center text-sm text-slate-500">
                Waiting for session verification...
              </p>
            )
          )}
        </div>
      </div>
    </div>
  );
}
