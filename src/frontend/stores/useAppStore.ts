import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/api/mock';

type AppState = {
  token: string | null;
  user: AuthUser | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
};

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        user: null,
        setAuth: (user, token) => set({ user, token }),
        clearAuth: () => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('restaurantos:role');
            window.localStorage.removeItem('restaurantos:email');
          }
          set({ user: null, token: null });
        },
        sidebarOpen: true,
        toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
        setSidebarOpen: sidebarOpen => set({ sidebarOpen }),
        darkMode: false,
        setDarkMode: darkMode => set({ darkMode }),
      }),
      {
        name: 'restaurantos-app',
        partialize: s => ({
          token: s.token,
          user: s.user,
          sidebarOpen: s.sidebarOpen,
          darkMode: s.darkMode,
        }),
      }
    ),
    { name: 'RestaurantOS', enabled: process.env.NODE_ENV === 'development' }
  )
);
