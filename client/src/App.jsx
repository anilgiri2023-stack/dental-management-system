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
import DoctorRegister from './pages/DoctorRegister';

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
  console.log("🌐 CURRENT PATH:", window.location.pathname);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* ═══════════════════════════════════════════════════════════
              1. PUBLIC ROUTES (Always Accessible)
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
          <Route path="/doctors" element={<PublicLayout><DoctorsPage /></PublicLayout>} />
          <Route path="/gallery" element={<PublicLayout><GalleryPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          
          {/* Doctor Invitation Registration (Must be public & top-level) */}
          <Route
          path="/doctor-register"
          element={
            <PublicLayout>
              <DoctorRegister />
            </PublicLayout>
          }
/>

          {/* Auth Entry Points */}
          <Route path="/login/patient" element={<PatientLoginPage />} />
          <Route path="/login/doctor" element={<DoctorLoginPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ═══════════════════════════════════════════════════════════
              2. PROTECTED ROUTES (Require Specific Roles)
              ═══════════════════════════════════════════════════════════ */}
          
          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <UserProtectedRoute>
                <UserDashboard />
              </UserProtectedRoute>
            }
          />
          <Route
            path="/patient/book"
            element={
              <UserProtectedRoute>
                <BookingPage />
              </UserProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <DoctorProtectedRoute>
                <DoctorDashboard />
              </DoctorProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ═══════════════════════════════════════════════════════════
              3. REDIRECTS & ALIASES
              ═══════════════════════════════════════════════════════════ */}
          <Route path="/login" element={<Navigate to="/login/patient" replace />} />
          <Route path="/book" element={<Navigate to="/patient/book" replace />} />
          <Route path="/dashboard" element={<Navigate to="/patient" replace />} />
          <Route path="/admin-login" element={<Navigate to="/login/admin" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />

          {/* ═══════════════════════════════════════════════════════════
              4. CATCH-ALL (Fallback to Home)
              ═══════════════════════════════════════════════════════════ */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
