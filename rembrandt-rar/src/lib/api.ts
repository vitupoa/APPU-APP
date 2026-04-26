import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_KRIETA_API_URL || 'http://localhost:3000';

export const authApi = axios.create({
  baseURL: `${API_BASE}/api/v1/auth`,
  headers: { 'Content-Type': 'application/json' },
});

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1/rar`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('rar_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

authApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('rar_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
