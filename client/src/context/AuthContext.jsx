import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';
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
    const currentToken = token || localStorage.getItem('cs_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  }, [token]);

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
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setToken(savedToken);
        } else {
          // Token invalid — clear everything
          localStorage.removeItem('cs_token');
          localStorage.removeItem('cs_user');
          setToken(null);
          setUser(null);
        }
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
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, type }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  };

  // Verify OTP and login — returns user with role
  const verifyOtp = async (identifier, type, otp, name) => {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, type, otp, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Verification failed');
    }

    // Save session — user object includes id, email, role
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Admin Auth ───
  const adminLogin = async (email, password) => {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Admin login failed');
    }

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
