// Central API utility
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = isLocal 
  ? 'http://localhost:5000/api' 
  : 'https://dental-management-system-gd47.onrender.com/api';

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cs_token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  } catch (err) {
    console.error('API Fetch Network Error:', err);
    throw new Error('Unable to connect to the server. Please try again later.');
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error('API Fetch JSON Parse Error:', err);
    throw new Error('Received an invalid response from the server.');
  }

  if (!res.ok) {
    const error = new Error(data.message || 'Request failed');
    error.data = data; // Attach data for further inspection (e.g. error_code)
    error.status = res.status;
    throw error;
  }

  return data;
};

// Upload helper for multipart/form-data (file uploads)
export const uploadFetch = async (endpoint, formData) => {
  const token = localStorage.getItem('cs_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Do NOT set Content-Type — browser sets multipart boundary automatically

  let res;
  try {
    res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });
  } catch (err) {
    console.error('Upload Network Error:', err);
    throw new Error('Unable to connect to the server. Please try again later.');
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error('Upload JSON Parse Error:', err);
    throw new Error('Received an invalid response from the server.');
  }

  if (!res.ok) {
    throw new Error(data.message || 'Upload failed');
  }

  return data;
};
