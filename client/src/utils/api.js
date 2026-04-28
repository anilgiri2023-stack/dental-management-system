// Central API utility
const configuredApiUrl = import.meta.env.VITE_API_URL;

function normalizeApiUrl(url) {
  return (url || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
}

export const API_BASE_URL = normalizeApiUrl(configuredApiUrl);

function apiUrl(endpoint) {
  const path = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  return `${API_BASE_URL}${path}`;
}

if (!configuredApiUrl) {
  console.warn('VITE_API_URL is not set. API requests will use same-origin /api.');
}

export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('cs_token');
  const user = localStorage.getItem('cs_user');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (user) {
    // Send user data in x-user header (base64 encoded to handle special characters)
    headers['x-user'] = btoa(unescape(encodeURIComponent(user)));
  }

  let res;
  try {
    res = await fetch(apiUrl(endpoint), { ...options, headers });
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
  const user = localStorage.getItem('cs_user');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user) {
    headers['x-user'] = btoa(unescape(encodeURIComponent(user)));
  }
  // Do NOT set Content-Type — browser sets multipart boundary automatically

  let res;
  try {
    res = await fetch(apiUrl(endpoint), {
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
    const error = new Error(data.message || 'Upload failed');
    error.data = data;
    error.status = res.status;
    throw error;
  }

  return data;
};
