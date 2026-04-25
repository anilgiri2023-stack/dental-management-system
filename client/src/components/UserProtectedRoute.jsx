import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function UserProtectedRoute({ children }) {
  const { user, isAuthenticated, isAdminLoggedIn, loading } = useAuth();

  // Debug logs
  console.log('🛡️ UserProtectedRoute:', { user, isAuthenticated, isAdminLoggedIn, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → go to login
  if (!isAuthenticated) {
    console.log('🛡️ UserProtectedRoute: Not authenticated, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  // Admin trying to access user pages → redirect to admin dashboard
  if (isAdminLoggedIn) {
    console.log('🛡️ UserProtectedRoute: Admin detected, redirecting to /admin/dashboard');
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Doctor trying to access user pages → redirect to doctor dashboard
  if (user?.role === 'doctor') {
    console.log('🛡️ UserProtectedRoute: Doctor detected, redirecting to /doctor');
    return <Navigate to="/doctor" replace />;
  }

  console.log('🛡️ UserProtectedRoute: Access granted for user', user?.email);
  return children;
}
