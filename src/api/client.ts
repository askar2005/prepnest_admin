import axios from 'axios';

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1';
const productionApiUrl = 'https://prednest-backend-e45z.onrender.com/api';
const devFallback = 'http://localhost:4000/api';
const fallback = isLocalDev ? devFallback : productionApiUrl;

const raw = import.meta.env.VITE_API_URL || fallback;
// Safety net: ensure base URL always ends with /api
const base = raw.replace(/\/+$/, '');
const finalBaseURL = base.endsWith('/api') ? base : `${base}/api`;

export const apiClient = axios.create({
  baseURL: finalBaseURL,
  withCredentials: true,
});

export const BACKEND_ORIGIN = finalBaseURL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return BACKEND_ORIGIN + url;
  return url;
}

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('prepnest_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }
    if (status === 401) {
      const wasLoginRequest = url.includes('/auth/login') || url.includes('/admin/login');
      if (!wasLoginRequest) {
        window.localStorage.removeItem('prepnest_token');
        window.localStorage.removeItem('prepnest_user');
        window.sessionStorage.setItem('prepnest_session_expired', 'true');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
