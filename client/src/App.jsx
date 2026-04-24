import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import UserProtectedRoute from './components/UserProtectedRoute';
import DoctorProtectedRoute from './components/DoctorProtectedRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';

// Auth Pages
import PatientLoginPage from './pages/PatientLoginPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import SetPassword from './pages/SetPassword';
import ResetPassword from './pages/ResetPassword';

// Protected User Pages
import UserDashboard from './pages/UserDashboard';
import BookingPage from './pages/BookingPage';

// Protected Doctor Pages
import DoctorDashboard from './pages/DoctorDashboard';

// Protected Admin Pages
import AdminDashboard from './pages/AdminDashboard';

// Layout wrapper for pages with Navbar + Footer
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public pages with Navbar + Footer */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
          <Route path="/doctors" element={<PublicLayout><DoctorsPage /></PublicLayout>} />
          <Route path="/gallery" element={<PublicLayout><GalleryPage /></PublicLayout>} />
          <Route path="/book" element={<Navigate to="/dashboard/book" replace />} />

          {/* Auth Routes (no Navbar/Footer) */}
          <Route path="/login" element={<Navigate to="/login/patient" replace />} />
          <Route path="/login/patient" element={<PatientLoginPage />} />
          <Route path="/login/doctor" element={<DoctorLoginPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* User dashboard (protected, no Navbar/Footer — has its own header) */}
          <Route
            path="/dashboard"
            element={
              <UserProtectedRoute>
                <UserDashboard />
              </UserProtectedRoute>
            }
          />
          <Route
            path="/dashboard/book"
            element={
              <UserProtectedRoute>
                <BookingPage />
              </UserProtectedRoute>
            }
          />

          {/* Doctor dashboard (protected, no Navbar/Footer) */}
          <Route
            path="/doctor/dashboard"
            element={
              <DoctorProtectedRoute>
                <DoctorDashboard />
              </DoctorProtectedRoute>
            }
          />

          {/* Hidden admin login — NOT linked anywhere in UI (Deprecated path, redirects to new) */}
          <Route path="/admin-login" element={<Navigate to="/login/admin" replace />} />

          {/* Protected admin routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          {/* /admin-dashboard alias */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect /admin to /admin/dashboard */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Redirect /register to /login (no separate registration) */}
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* Catch all — redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
