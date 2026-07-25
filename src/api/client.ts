import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
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
