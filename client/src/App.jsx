import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import UserProtectedRoute from './components/UserProtectedRoute';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';

// Auth Pages
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Protected User Pages
import UserDashboard from './pages/UserDashboard';
import BookingPage from './pages/BookingPage';

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

          {/* OTP-based auth (no Navbar/Footer) */}
          <Route path="/login" element={<LoginPage />} />

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

          {/* Hidden admin login — NOT linked anywhere in UI */}
          <Route path="/admin-login" element={<AdminLoginPage />} />

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
