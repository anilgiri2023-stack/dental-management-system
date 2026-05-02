import axios from 'axios';

// 1. Axios baseURL
const API_URL = `${import.meta.env.VITE_API_URL || "https://dental-management-system-gd47.onrender.com"}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (user) {
      config.headers['x-user'] = btoa(unescape(encodeURIComponent(user)));
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * apiFetch helper - no modifications to endpoint
 * No unnecessary JSON.parse (Axios handles objects directly)
 */
export const apiFetch = async (endpoint, options = {}) => {
  const { method = 'GET', body, ...rest } = options;
  try {
    const response = await api({
      url: endpoint,
      method,
      data: body, // Axios handles objects directly
      ...rest,
    });
    // Handle empty JSON response
    return response.data || { success: true };
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Request failed';
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    throw err;
  }
};

/**
 * Upload helper
 */
export const uploadFetch = async (endpoint, formData) => {
  try {
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Upload failed';
    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    throw err;
  }
};

// 2. Clean endpoint usage
export const sendOtp = async (email, name, phone) => {
  return await apiFetch('/auth/send-otp', { method: 'POST', body: { email, name, phone } });
};

export const verifyOtp = async (email, otp) => {
  return await apiFetch('/auth/verify-otp', { method: 'POST', body: { email, otp } });
};

export const loginAdmin = async (email, password) => {
  return (await api.post('/admin/login', { email, password })).data;
};
export const loginDoctor = async (email, password) => {
  return (await api.post('/doctor/login', { email, password })).data;
};

export default api;
