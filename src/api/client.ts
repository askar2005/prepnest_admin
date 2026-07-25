import axios from 'axios';

const raw = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
// Safety net: ensure base URL always ends with /api
const base = raw.replace(/\/+$/, '');
const finalBaseURL = base.endsWith('/api') ? base : `${base}/api`;

// eslint-disable-next-line no-console
console.log('[API Client] VITE_API_URL:', raw);
console.log('[API Client] Final baseURL:', finalBaseURL);

export const apiClient = axios.create({
  baseURL: finalBaseURL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  const token = window.localStorage.getItem('prepnest_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
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
