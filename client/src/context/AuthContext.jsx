import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize user from localStorage for instant role detection on refresh
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cs_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('cs_token'));
  const [loading, setLoading] = useState(true);

  // Derive states from user
  const isAuthenticated = !!token && !!user;
  const isAdminLoggedIn = user?.role === 'admin';
  const isDoctorLoggedIn = user?.role === 'doctor';
  const adminLoading = loading;

  // Persist user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('cs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cs_user');
    }
  }, [user]);

  // Helper — make authenticated request
  const authFetch = useCallback(async (url, options = {}) => {
    return apiFetch(url, options);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('cs_token');
      if (!savedToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch('/auth/me');
        setUser(data.user);
        setToken(savedToken);
      } catch (err) {
        console.error('Session validation error:', err);
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);

  // ─── OTP Auth Functions ───

  // Send OTP to email or phone
  const sendOtp = async (identifier, type) => {
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, type }),
    });
  };

  // Verify OTP and login — returns user with role
  const verifyOtp = async (identifier, type, otp, name, phone) => {
    const data = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, type, otp, name, phone }),
    });

    // Save session — user object includes id, email, role
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Admin Auth ───
  const adminLogin = async (email, password) => {
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Doctor Auth ───
  const doctorLogin = async (email, password) => {
    const data = await apiFetch('/doctor/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Logout ───
  const logout = async () => {
    localStorage.removeItem('cs_token');
    localStorage.removeItem('cs_user');
    setToken(null);
    setUser(null);
  };

  const adminLogout = logout;

  // ─── Update Profile ───
  const updateProfile = async (name) => {
    const data = await authFetch('/auth/update-profile', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    if (data.token) {
      localStorage.setItem('cs_token', data.token);
      setToken(data.token);
      setUser(prev => {
        const updated = { ...prev, name };
        localStorage.setItem('cs_user', JSON.stringify(updated));
        return updated;
      });
    }
    return data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        adminLoading,
        isAuthenticated,
        isAdminLoggedIn,
        sendOtp,
        verifyOtp,
        adminLogin,
        doctorLogin,
        logout,
        adminLogout,
        updateProfile,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
