import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export type AccountStatus =
  | 'pending_payment'
  | 'pending_verification'
  | 'active'
  | 'suspended'
  | 'banned';

export type RegistrationPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  referralCode: string;
  accountStatus: AccountStatus;
  registrationPaymentStatus: RegistrationPaymentStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setUser: (user: AuthUser) => void;
  updateUser: (fields: Partial<AuthUser>) => void;
  setAccessToken: (token: string) => void;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),

      setAccessToken: (accessToken) => set({ accessToken }),

      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),

      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'chainx-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Do NOT persist accessToken — it's short-lived and refreshed on reload
      }),
    }
  )
);
