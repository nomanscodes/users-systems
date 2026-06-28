# Frontend Authentication Implementation Guide

This guide provides the step-by-step code implementation for the Authentication and Registration flows based on the requirements defined in `frontend-auth-flow-requirements.md`.

---

## Step 1: Define the DTOs (Data Transfer Objects)

We need strict TypeScript interfaces mirroring the backend.

### `src/features/auth/types/auth.dto.ts`
```typescript
export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
}
```

### `src/features/tenants/types/tenant.dto.ts`
```typescript
export interface RegisterTenantPayload {
  schoolName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}
```

---

## Step 2: Build the Service Layer

The service layer handles the actual HTTP requests using our centralized `apiClient`.

### `src/features/auth/api/auth.service.ts`
```typescript
import { apiClient } from '@/lib/api-client';
import { LoginPayload, AuthResponse } from '../types/auth.dto';

export const AuthService = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post('/v1/auth/login', data);
    return response.data; // Assumes backend wraps in { data: ... }
  },
  
  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post('/v1/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/v1/auth/logout', { refreshToken });
  }
};
```

### `src/features/tenants/api/tenant.service.ts`
```typescript
import { apiClient } from '@/lib/api-client';
import { RegisterTenantPayload } from '../types/tenant.dto';

export const TenantService = {
  register: async (data: RegisterTenantPayload) => {
    const response = await apiClient.post('/v1/tenants/register', data);
    return response.data;
  }
};
```

---

## Step 3: Create React Query Hooks

We wrap the services in TanStack Query to manage loading states and caching automatically.

### `src/features/auth/hooks/use-login.ts`
```typescript
import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../api/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation({
    mutationFn: AuthService.login,
    onSuccess: (data) => {
      // 1. Save to global Zustand store
      loginToStore(data.user, data.accessToken);
      
      // 2. Persist refresh token securely
      localStorage.setItem('refresh_token', data.refreshToken);
      
      // 3. Redirect to dashboard
      toast.success('Logged in successfully!');
      router.push('/dashboard/default');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Invalid credentials');
    }
  });
};
```

### `src/features/tenants/hooks/use-register-tenant.ts`
```typescript
import { useMutation } from '@tanstack/react-query';
import { TenantService } from '../api/tenant.service';

export const useRegisterTenant = () => {
  return useMutation({
    mutationFn: TenantService.register,
  });
};
```

---

## Step 4: Implement Advanced Token Refresh (Interceptors)

To handle silent background token refreshing, update the `src/lib/api-client.ts` Response Interceptor:

```typescript
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';
import { AuthService } from '@/features/auth/api/auth.service';

// To prevent multiple simultaneous refresh calls if multiple APIs fail at once
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

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
        window.location.href = '/auth/v1/login';
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
        window.location.href = '/auth/v1/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);
```

---

## Step 5: Update the UI Components
Finally, go into `src/app/(main)/auth/v1/login/page.tsx` and replace the raw `fetch` block with:
```tsx
const { mutate, isPending } = useLogin();

const onSubmit = (values) => {
  mutate(values);
};
```
This leaves the UI file 100% focused on Tailwind styling and layout!
