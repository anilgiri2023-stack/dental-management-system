import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import supabase from '../utils/supabase';

export default function DoctorProtectedRoute({ children }) {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [roleLoading, setRoleLoading] = useState(true);
  const [shouldRedirectLogin, setShouldRedirectLogin] = useState(false);
  const [shouldRedirectHome, setShouldRedirectHome] = useState(false);

  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;

    // Not logged in → redirect to /login
    if (!isAuthenticated || !user?.id) {
      setShouldRedirectLogin(true);
      setRoleLoading(false);
      return;
    }

    // Fetch user role from Supabase
    const verifyRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          throw new Error('Failed to fetch role');
        }

        // if role !== "doctor" → redirect to / (home)
        if (data.role !== 'doctor') {
          setShouldRedirectHome(true);
        } else {
          // else → allow access
          setIsVerified(true);
        }
      } catch (err) {
        console.error('Role verification failed:', err);
        setShouldRedirectHome(true);
      } finally {
        setRoleLoading(false);
      }
    };

    verifyRole();
  }, [authLoading, isAuthenticated, user]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (shouldRedirectLogin) {
    return <Navigate to="/login" replace />;
  }

  if (shouldRedirectHome) {
    return <Navigate to="/" replace />;
  }

  return isVerified ? children : null;
}
