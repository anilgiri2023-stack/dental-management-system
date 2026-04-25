import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdminLoggedIn, adminLoading } = useAuth();

  // Debug logs
  console.log('🔒 ProtectedRoute (Admin):', { isAuthenticated, isAdminLoggedIn, adminLoading });

  // Wait for auth state to resolve
  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all → admin login
  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute: Not authenticated, redirecting to /admin-login');
    return <Navigate to="/admin-login" replace />;
  }

  // Logged in but NOT admin → redirect to user dashboard
  if (!isAdminLoggedIn) {
    console.log('🔒 ProtectedRoute: Not admin, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Admin authenticated → allow access
  console.log('🔒 ProtectedRoute: Admin access granted');
  return children;
}
