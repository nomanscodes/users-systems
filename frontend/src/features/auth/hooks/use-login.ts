import { useMutation } from '@tanstack/react-query';
import { AuthService } from '../api/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { LoginPayload, AuthResponse } from '../types/auth.dto';

export const useLogin = () => {
  const loginToStore = useAuthStore((state) => state.login);
  const router = useRouter();

  return useMutation<AuthResponse, any, LoginPayload>({
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
      // The error comes from our Axios interceptor, which standardizes error shapes
      const message = error?.message || 'Invalid email or password.';
      toast.error(message);
    }
  });
};
