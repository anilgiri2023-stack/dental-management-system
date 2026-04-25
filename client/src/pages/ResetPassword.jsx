import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
import { supabase } from '../utils/supabase';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
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
        console.log("URL:", window.location.href);
        const hash = window.location.hash;
        console.log("HASH:", hash);

        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const access_token = params.get('access_token');
          console.log("TOKEN:", access_token);

          if (!access_token) {
            setError('No reset token found. Please use the link in your email.');
            setInitializing(false);
            return;
          }

          // Set Supabase session so auth.updateUser works on backend
          const { error: sessionErr } = await supabase.auth.setSession({
            access_token,
            refresh_token: access_token
          });

          if (sessionErr) {
            console.error("Session set error:", sessionErr);
            setError('Verification failed. Your link may be expired.');
            setInitializing(false);
            return;
          }

          setAccessToken(access_token);
          setSessionReady(true);
          window.history.replaceState(null, '', window.location.pathname);
          setInitializing(false);
        } else {
          setError('No reset token found. Please use the link in your email.');
          setInitializing(false);
        }
      } catch (err) {
        console.error('Auth session error:', err);
        setError('Something went wrong verifying your reset link. Please try again.');
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
      // Use backend API to update password in both Auth and our users table
      await apiFetch('/auth/complete-reset-password', {
        method: 'POST',
        body: JSON.stringify({
          password: password,
          access_token: accessToken
        })
      });

      setSuccess(true);

      // Sign out and redirect to login
      setTimeout(() => {
        // Clear any local tokens
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        navigate('/login');
      }, 2500);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.message?.includes('expired') || err.message?.includes('invalid')) {
        setError('Your session has expired. Please request a new reset link.');
      } else {
        setError(err.message || 'Failed to reset password');
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Loading state while processing the token ───
  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-600 text-sm">Verifying your reset link...</p>
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Successfully!</h2>
          <p className="text-slate-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // ─── Main form ───
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Please enter your new password below.
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
                    type={showConfirm ? "text" : "password"}
                    required
                    minLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
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
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
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
