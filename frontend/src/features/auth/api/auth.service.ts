import { apiClient } from '@/lib/api-client';
import type { LoginPayload, AuthResponse } from '../types/auth.dto';

export const AuthService = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    // apiClient automatically unwraps response.data from Axios via its response interceptor
    const response: any = await apiClient.post('/v1/auth/login', data);
    return response.data; // The backend wraps responses in a { data: ... } standard response format
  },
  
  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response: any = await apiClient.post('/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/v1/auth/logout', { refreshToken });
  }
};
