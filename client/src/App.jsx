import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import ServicesPage from './pages/ServicesPage';
import DoctorsPage from './pages/DoctorsPage';
import GalleryPage from './pages/GalleryPage';
import ContactPage from './pages/ContactPage';
import BookingPage from './pages/BookingPage';
import LoginPage from './pages/LoginPage';
import PatientLoginPage from './pages/PatientLoginPage';
import DoctorLoginPage from './pages/DoctorLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DoctorRegister from './pages/DoctorRegister';
import UserDashboard from './pages/UserDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import SetPassword from './pages/SetPassword';
import CompleteProfile from './pages/CompleteProfile';

// Protection
import ProtectedRoute from './components/ProtectedRoute'; // Admin
import UserProtectedRoute from './components/UserProtectedRoute';
import DoctorProtectedRoute from './components/DoctorProtectedRoute';

function AppContent() {
  const location = useLocation();
  
  // Routes where we want to hide the global Navbar
  const hideNavbarRoutes = [
    '/admin-dashboard',
    '/doctor-dashboard',
    '/appointments',
    '/book-appointment',
    '/complete-profile'
  ];

  const shouldHideNavbar = hideNavbarRoutes.some(path => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!shouldHideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/booking" element={<BookingPage />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/patient" element={<PatientLoginPage />} />
          <Route path="/login/doctor" element={<DoctorLoginPage />} />
          <Route path="/login/admin" element={<AdminLoginPage />} />
          <Route path="/doctor-register" element={<DoctorRegister />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/complete-profile" element={<CompleteProfile />} />
          <Route 
            path="/book-appointment" 
            element={
              <UserProtectedRoute>
                <BookingPage />
              </UserProtectedRoute>
            } 
          />

          {/* Dashboard Routes (Protected) */}
          <Route 
            path="/appointments" 
            element={
              <UserProtectedRoute>
                <UserDashboard />
              </UserProtectedRoute>
            } 
          />
          <Route 
            path="/doctor-dashboard" 
            element={
              <DoctorProtectedRoute>
                <DoctorDashboard />
              </DoctorProtectedRoute>
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

          {/* Catch-all */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      {!shouldHideNavbar && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
