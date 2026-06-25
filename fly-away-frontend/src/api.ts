import axios from 'axios';

const api = axios.create({ baseURL: '/' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function errorMessage(err: unknown, fallback = 'Algo salió mal'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { detail?: string; message?: string } | undefined;
    return data?.detail || data?.message || err.message || fallback;
  }
  return fallback;
}

export default api;
