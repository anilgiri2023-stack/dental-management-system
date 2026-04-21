// Central API utility
export const API_BASE_URL = 'https://dental-management-system-gd47.onrender.com/api';

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
    // Catch network errors (like "Failed to fetch")
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
    throw new Error(data.message || 'Request failed');
  }

  return data;
};
