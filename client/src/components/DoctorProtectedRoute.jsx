import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DoctorProtectedRoute({ children }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Debug logs
  console.log('🩺 DoctorProtectedRoute:', { user, isAuthenticated, loading });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in → redirect to /login
  if (!isAuthenticated || !user?.id) {
    console.log('🩺 DoctorProtectedRoute: Not authenticated, redirecting to /login/doctor');
    return <Navigate to="/login/doctor" replace />;
  }

  // Not a doctor → redirect to home
  if (user.role !== 'doctor') {
    console.log('🩺 DoctorProtectedRoute: Not a doctor (role:', user.role, '), redirecting to /');
    return <Navigate to="/" replace />;
  }

  console.log('🩺 DoctorProtectedRoute: Access granted for doctor', user.email);
  return children;
}
