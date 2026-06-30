import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (user, token) => {
        // Expose token globally for non-React contexts (like Axios interceptors)
        if (typeof window !== 'undefined') {
          (window as any).__accessToken = token;
          document.cookie = "auth_status=true; path=/; max-age=86400"; // 1 day, adjust as needed
        }
        set({ user, accessToken: token, isAuthenticated: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          (window as any).__accessToken = null;
          document.cookie = "auth_status=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      // Persist user and auth status, but tokens are usually kept in memory or secure cookies
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), 
    }
  )
);
