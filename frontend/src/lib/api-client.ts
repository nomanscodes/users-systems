import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { AuthService } from '@/features/auth/api/auth.service';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // 10 second timeout for all requests
  timeout: 10000, 
});

// ─── REQUEST INTERCEPTOR ───
apiClient.interceptors.request.use(
  (config) => {
    // Attempt to grab token from global window object (populated by Zustand on login)
    const token = typeof window !== 'undefined' ? (window as any).__accessToken : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ─── QUEUE MANAGEMENT FOR CONCURRENT REQUESTS ───
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ─── RESPONSE INTERCEPTOR ───
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If it's a 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, put this request in a queue
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/v1/login')) {
          window.location.href = '/auth/v1/login';
        }
        return Promise.reject(error);
      }

      try {
        // Call refresh endpoint
        const data = await AuthService.refresh(refreshToken);
        
        // Save new tokens
        localStorage.setItem('refresh_token', data.refreshToken);
        useAuthStore.getState().login(useAuthStore.getState().user!, data.accessToken);
        
        processQueue(null, data.accessToken);
        
        // Retry the original request
        originalRequest.headers['Authorization'] = 'Bearer ' + data.accessToken;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/v1/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Return standard error shape matching your backend error payloads
    return Promise.reject(error.response?.data || error);
  }
);
