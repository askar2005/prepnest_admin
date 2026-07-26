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

// eslint-disable-next-line no-console
console.log('[API Client] VITE_API_URL:', import.meta.env.VITE_API_URL || '(not set)');
console.log('[API Client] hostname:', hostname, '→ fallback:', fallback);
console.log('[API Client] Final baseURL:', finalBaseURL);

export const apiClient = axios.create({
  baseURL: finalBaseURL,
  withCredentials: true,
});

const BACKEND_ORIGIN = finalBaseURL.replace(/\/api\/?$/, '');

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return BACKEND_ORIGIN + url;
  return url;
}

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('prepnest_token');
  console.log(`[API-REQ] ${config.method?.toUpperCase()} ${config.url} ${token ? '🔑 with token' : '🔓 no token'}`);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API-RES] ${response.status} ${response.config?.method?.toUpperCase()} ${response.config?.url}`);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const method = error.config?.method?.toUpperCase();
    const data = error.response?.data;
    console.log(`[API-ERR] ${status} ${method} ${url}`, data ? JSON.stringify(data) : 'network error');
    if (error.code === 'ERR_CANCELED') {
      console.log('[API-ERR] Request was canceled (ERR_CANCELED)');
      return Promise.reject(error);
    }
    if (status === 429) {
      console.log('[API-ERR] === RATE LIMITED (429) === url:', url);
    }
    if (status === 401) {
      const wasLoginRequest = url.includes('/auth/login') || url.includes('/admin/login');
      console.log('[API-ERR] === 401 UNAUTHORIZED === wasLoginRequest:', wasLoginRequest, 'url:', url);
      if (!wasLoginRequest) {
        console.log('[API-ERR] Clearing token and redirecting to /login');
        window.localStorage.removeItem('prepnest_token');
        window.localStorage.removeItem('prepnest_user');
        window.sessionStorage.setItem('prepnest_session_expired', 'true');
        window.location.href = '/login';
      } else {
        console.log('[API-ERR] Login request returned 401 — not redirecting');
      }
    }
    return Promise.reject(error);
  }
);
