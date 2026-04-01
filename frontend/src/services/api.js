// frontend/src/services/api.js - COMPLETE FIX
import axios from 'axios';

// ✅ Create axios instance with default config
const api = axios.create({
  baseURL: '/api', // Uses Vite proxy
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30 second timeout
});

// ✅ Request interceptor - add auth token if exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // ✅ Log request for debugging
    console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`, config.data || '');

    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => {
    // ✅ Log successful response
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    // ✅ Silence ERR_CANCELED/canceled errors
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.message === 'canceled') {
      return Promise.reject(error);
    }

    console.error('❌ API Error:', error.response?.data || error.message);

    // ✅ CRITICAL FIX: Only redirect on 401 for protected routes
    // Don't redirect if error is from login or register endpoints
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';

      // ✅ Don't redirect if error is from auth endpoints
      const isAuthEndpoint = requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register');

      if (!isAuthEndpoint) {
        console.log('🔒 Unauthorized! Clearing token and redirecting to login...');

        // Clear token and user
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // ✅ Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // ✅ Handle 403 Forbidden (unapproved user)
    if (error.response?.status === 403) {
      console.warn('⚠️ Access forbidden:', error.response.data.message);
      // Don't redirect - let the component handle it
    }

    return Promise.reject(error);
  }
);

export default api;