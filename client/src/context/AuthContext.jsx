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
    console.log('👤 AuthContext state:', { 
      user: user ? { id: user.id, email: user.email, role: user.role } : null, 
      loading,
      isAuthenticated 
    });
    if (user) {
      localStorage.setItem('cs_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cs_user');
    }
  }, [user, loading]);

  // Helper — make authenticated request
  const authFetch = useCallback(async (url, options = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request: ${url}`);
    }
    return apiFetch(url, options);
  }, []);

  // Validate token on mount
  useEffect(() => {
    const validateSession = async () => {
      console.log('🔄 AuthContext: Validating session on mount...');
      const savedToken = localStorage.getItem('cs_token');
      if (!savedToken) {
        console.log('🔄 AuthContext: No saved token found, user is null');
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch('/auth/me');
        console.log('🔄 AuthContext: Session validated:', { role: data.user?.role, email: data.user?.email });
        setUser(data.user);
        setToken(savedToken);
      } catch (err) {
        console.error('❌ AuthContext: Session validation error:', err);
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Sending OTP to ${identifier} (${type})`);
    }
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ identifier, type }),
    });
  };

  // Verify OTP and login — returns user with role
  // Ensures session is fully established before returning
  const verifyOtp = async (identifier, type, otp, name, phone) => {
    console.log('🔑 Verifying OTP...');

    // Helper: attempt verification with retry
    async function attemptVerify(retryCount = 0) {
      const data = await apiFetch('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, type, otp, name, phone }),
      });

      console.log('📦 verify-otp response:', { 
        success: data.success, 
        hasToken: !!data.token, 
        user: data.user ? { id: data.user.id, email: data.user.email, role: data.user.role } : null 
      });

      // Validate session: must have both token and user
      if (!data.token || !data.user) {
        console.error('❌ Session not established — missing token or user');
        if (retryCount === 0) {
          console.log('⏳ Retrying verification in 1 second...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return attemptVerify(1);
        }
        throw new Error('Login failed, retry OTP');
      }

      return data;
    }

    let data;
    try {
      data = await attemptVerify();
    } catch (err) {
      console.error('❌ OTP verification failed:', err.message);
      // If error is "Login failed, retry OTP", pass it through
      throw err;
    }

    console.log('✅ Session established successfully');
    console.log('🔐 Session token:', data.token ? `${data.token.substring(0, 20)}...` : 'MISSING');
    console.log('👤 Authenticated user:', { id: data.user.id, email: data.user.email, role: data.user.role });

    // Save session — user object includes id, email, role
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Admin Auth ───
  const adminLogin = async (email, password) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 Admin login attempt...');
    }
    const data = await apiFetch('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('✅ Admin login successful');
    localStorage.setItem('cs_token', data.token);
    localStorage.setItem('cs_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  // ─── Doctor Auth ───
  const doctorLogin = async (email, password) => {
    console.log('🩺 Doctor login attempt...');
    const data = await apiFetch('/doctor/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    console.log('✅ Doctor login successful, user:', data.user);
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

  const [isAuthFlow, setIsAuthFlow] = useState(false);

  useEffect(() => {
    const checkAuthFlow = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      const path = window.location.pathname;
      
      const params = new URLSearchParams(hash.substring(1));
      const queryParams = new URLSearchParams(search);
      
      const type = params.get('type') || queryParams.get('type');
      const hasToken = hash.includes('access_token') || search.includes('token=');
      const hasErrorCode = hash.includes('error=') || search.includes('error=');
      const isAuthPage = path === '/set-password' || path === '/reset-password' || path === '/doctor-register';
      
      const active = hasToken || type === 'invite' || type === 'recovery' || hasErrorCode || isAuthPage;
      
      if (active !== isAuthFlow) {
        console.log('🛡️ AuthContext: Auth flow detected!', { active, path, type, hasToken });
        setIsAuthFlow(active);
      }
    };

    // Initial check
    checkAuthFlow();

    // Listen for hash changes and pushState/replaceState
    window.addEventListener('hashchange', checkAuthFlow);
    
    // Intercept navigation (popstate)
    window.addEventListener('popstate', checkAuthFlow);

    return () => {
      window.removeEventListener('hashchange', checkAuthFlow);
      window.removeEventListener('popstate', checkAuthFlow);
    };
  }, [isAuthFlow]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        adminLoading,
        isAuthenticated,
        isAdminLoggedIn,
        isDoctorLoggedIn,
        setUser,
        sendOtp,
        verifyOtp,
        adminLogin,
        doctorLogin,
        logout,
        adminLogout,
        updateProfile,
        authFetch,
        isAuthFlow,
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
