import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthSession = async () => {
      try {
        const hash = window.location.hash;

        if (hash && hash.includes('access_token')) {
          // Extract tokens from URL hash manually
          const params = new URLSearchParams(hash.replace('#', ''));
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token') || access_token;
          const type = params.get('type'); // 'recovery'

          if (!access_token) {
            setError('Invalid reset link. No access token found.');
            setInitializing(false);
            return;
          }

          console.log('Setting session from reset link, type:', type);

          // Set session using extracted tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            if (sessionError.message?.includes('expired') || sessionError.message?.includes('invalid')) {
              setError('This reset link has expired. Please request a new one.');
            } else {
              setError(sessionError.message || 'Failed to verify reset link.');
            }
            setInitializing(false);
            return;
          }

          if (data?.session) {
            console.log('Session established for:', data.session.user.email);
            setSessionReady(true);
            // Clean URL hash
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            setError('Could not establish session. The link may have expired.');
          }
          setInitializing(false);
        } else {
          // No hash tokens — check if there's already an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setSessionReady(true);
          } else {
            setError('No reset token found. Please click the link in your email to reset your password.');
          }
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
      // 1. Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      // 2. Also store password in our custom users table (doctor login uses it)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ password: password })
          .eq('id', user.id);
      }

      setSuccess(true);

      // 3. Sign out and redirect to appropriate login
      setTimeout(() => {
        supabase.auth.signOut().then(() => {
          // We can guess where to send them based on user role if needed, but for now just send to main login
          navigate('/login');
        });
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
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                  />
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
